import OpenAI from "openai";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import { config } from "../config";
import { createError } from "../middleware/errorHandler";
import { TranscribeResult, EvaluationScore, AvatarTalkResult, Rubric } from "../types";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

// ── TRANSCRIPTION (Whisper) ──────────────────────────────────

export async function transcribeFromUrl(audioUrl: string): Promise<TranscribeResult> {
  // Download audio to temp file
  const response = await axios.get(audioUrl, { responseType: "arraybuffer" });
  const ext = path.extname(new URL(audioUrl).pathname) || ".mp3";
  const tmpPath = path.join(os.tmpdir(), `audio_${Date.now()}${ext}`);
  fs.writeFileSync(tmpPath, Buffer.from(response.data));

  return transcribeFile(tmpPath);
}

export async function transcribeFile(filePath: string): Promise<TranscribeResult> {
  try {
    const fileStream = fs.createReadStream(filePath);
    const transcript = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: fileStream,
      response_format: "verbose_json",
    });

    return {
      transcription: transcript.text,
      language: (transcript as Record<string, unknown>).language as string | undefined,
      duration_secs: (transcript as Record<string, unknown>).duration as number | undefined,
    };
  } finally {
    // Clean up temp file
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
  }
}

// ── EVALUATION (GPT-4o) ──────────────────────────────────────

const EVAL_SYSTEM_PROMPT = `
You are an expert academic interviewer evaluating student answers.
Evaluate the answer based on the provided rubric and respond ONLY with valid JSON:
{
  "score": {"clarity": <int>, "confidence": <int>, "accuracy": <int>},
  "total_score": <int>,
  "max_score": <int>,
  "feedback": "<string>",
  "strengths": ["<string>"],
  "improvements": ["<string>"]
}
Be fair, specific, and constructive. Scores must not exceed rubric maximums.
`.trim();

export async function evaluateAnswer(
  transcription: string,
  questionText: string,
  rubric: Rubric
): Promise<EvaluationScore> {
  const maxScore = Object.values(rubric).reduce((a, b) => a + b, 0);

  const userPrompt = `
Question: ${questionText}
Student Answer: ${transcription}
Rubric (key: max_points): ${JSON.stringify(rubric)}
Total maximum score: ${maxScore}

Evaluate and return JSON.
`.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: EVAL_SYSTEM_PROMPT },
      { role: "user",   content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const raw = completion.choices[0].message.content;
  if (!raw) throw createError("GPT-4o returned empty response", 500);

  try {
    const result = JSON.parse(raw);
    return {
      score:       result.score       ?? {},
      total_score: result.total_score ?? 0,
      max_score:   result.max_score   ?? maxScore,
      feedback:    result.feedback    ?? "",
      strengths:   result.strengths   ?? [],
      improvements:result.improvements?? [],
    };
  } catch {
    throw createError("Failed to parse GPT-4o evaluation response", 500);
  }
}

// ── TEXT-TO-SPEECH (ElevenLabs) ──────────────────────────────

export async function textToSpeech(
  text: string,
  voiceId?: string
): Promise<Buffer> {
  const vid = voiceId || config.elevenlabs.defaultVoiceId;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${vid}`;

  const response = await axios.post(
    url,
    {
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.3 },
    },
    {
      headers: {
        "xi-api-key": config.elevenlabs.apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      responseType: "arraybuffer",
      timeout: 30_000,
    }
  );

  if (response.status !== 200) {
    throw createError(`ElevenLabs TTS failed: ${response.statusText}`, 502);
  }

  return Buffer.from(response.data);
}

// ── AVATAR VIDEO (D-ID) ──────────────────────────────────────

const DEFAULT_PRESENTER = "amy-Aq6OmGZnMt";

export async function createAvatarTalk(params: {
  text: string;
  presenter_id?: string;
  voice_id?: string;
  background_url?: string;
}): Promise<AvatarTalkResult> {
  const presenterId = params.presenter_id || DEFAULT_PRESENTER;
  const voiceId     = params.voice_id     || config.elevenlabs.defaultVoiceId;

  const payload: Record<string, unknown> = {
    script: {
      type: "text",
      input: params.text,
      provider: {
        type: "elevenlabs",
        voice_id: voiceId,
      },
    },
    presenter_id: presenterId,
    driver_url: "bank://lively",
  };

  if (params.background_url) {
    payload.background = { source_url: params.background_url };
  }

  const response = await axios.post(
    `${config.did.apiUrl}/talks`,
    payload,
    {
      headers: {
        Authorization: `Basic ${config.did.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30_000,
    }
  );

  const data = response.data as Record<string, unknown>;
  return {
    talk_id:   (data.id as string)          || null,
    status:    (data.status as string)       || "processing",
    video_url: (data.result_url as string)   || null,
  };
}

export async function getAvatarTalkStatus(talkId: string): Promise<AvatarTalkResult> {
  const response = await axios.get(
    `${config.did.apiUrl}/talks/${talkId}`,
    {
      headers: { Authorization: `Basic ${config.did.apiKey}` },
      timeout: 15_000,
    }
  );

  const data = response.data as Record<string, unknown>;
  return {
    talk_id:   talkId,
    status:    (data.status as string)      || "processing",
    video_url: (data.result_url as string)  || null,
  };
}
