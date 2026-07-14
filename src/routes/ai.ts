import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import os from "os";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { TranscribeUrlSchema, EvaluateSchema, AvatarSpeakSchema } from "../config/schemas";
import * as aiService from "../services/aiService";
import * as interviewService from "../services/interviewService";
import * as questionService from "../services/questionService";
import * as rrService from "../services/responseReportService";
import { getSupabase } from "../db/supabase";
import { Rubric, InterviewResponse } from "../types";
import { createError } from "../middleware/errorHandler";

const router = Router();

// Multer — store audio uploads in OS temp dir
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [".webm", ".mp3", ".mp4", ".wav", ".ogg", ".m4a"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext) || file.mimetype.startsWith("audio/"));
  },
});

// ── TRANSCRIPTION ─────────────────────────────────────────────

// POST /api/ai/transcribe  — from URL
router.post("/transcribe", authenticate, validate(TranscribeUrlSchema), async (req, res: Response) => {
  const result = await aiService.transcribeFromUrl(req.body.audio_url);
  res.json(result);
});

// POST /api/ai/transcribe/upload  — raw audio file (from browser MediaRecorder)
router.post("/transcribe/upload", authenticate, upload.single("file"), async (req, res: Response) => {
  if (!req.file) { res.status(400).json({ detail: "Audio file is required" }); return; }
  const result = await aiService.transcribeFile(req.file.path);
  res.json(result);
});

// ── EVALUATION ────────────────────────────────────────────────

// POST /api/ai/evaluate
router.post("/evaluate", authenticate, validate(EvaluateSchema), async (req, res: Response) => {
  const { transcription, question_text, rubric } = req.body as {
    transcription: string;
    question_text: string;
    rubric: Rubric;
  };
  const result = await aiService.evaluateAnswer(transcription, question_text, rubric);
  res.json(result);
});

// ── AVATAR ────────────────────────────────────────────────────

// POST /api/ai/avatar/speak
router.post("/avatar/speak", authenticate, validate(AvatarSpeakSchema), async (req, res: Response) => {
  const result = await aiService.createAvatarTalk(req.body);
  res.json(result);
});

// GET /api/ai/avatar/speak/:talkId  — poll D-ID status
router.get("/avatar/speak/:talkId", authenticate, async (req, res: Response) => {
  const result = await aiService.getAvatarTalkStatus(req.params.talkId);
  res.json(result);
});

// ── TEXT-TO-SPEECH ────────────────────────────────────────────

// POST /api/ai/tts
router.post("/tts", authenticate, async (req, res: Response) => {
  const { text, voice_id } = req.body as { text: string; voice_id?: string };
  if (!text) { res.status(400).json({ detail: "text is required" }); return; }
  const audioBuffer = await aiService.textToSpeech(text, voice_id);
  res.set("Content-Type", "audio/mpeg");
  res.set("Content-Length", String(audioBuffer.length));
  res.send(audioBuffer);
});

// ── AUTO-EVALUATE FULL INTERVIEW ──────────────────────────────

// POST /api/ai/evaluate/interview/:interviewId
router.post("/evaluate/interview/:interviewId", authenticate, async (req, res: Response) => {
  const { interviewId } = req.params;
  const db = getSupabase();

  // Fetch all responses
  const { data: responses, error } = await db
    .from("responses")
    .select("*")
    .eq("interview_id", interviewId);

  if (error || !responses?.length) {
    throw createError("No responses found for this interview", 404);
  }

  let totalScore = 0;
  let maxTotal = 0;
  const scoreBreakdown: Rubric = {} as Rubric;
  const feedbackParts: string[] = [];

  for (const resp of responses as InterviewResponse[]) {
    // Already evaluated — tally existing score
    if (resp.score) {
      const sum = Object.values(resp.score).reduce((a, b) => a + b, 0);
      totalScore += sum;
      maxTotal += 20; // default max per question
      continue;
    }

    if (!resp.transcription) continue;

    // Fetch question
    const question = await questionService.getQuestion(resp.question_id);
    const rubric = question.rubric || { clarity: 5, confidence: 5, accuracy: 10 };

    // Evaluate
    const evaluation = await aiService.evaluateAnswer(
      resp.transcription,
      question.text,
      rubric
    );

    // Persist score back
    await rrService.updateResponse(resp.response_id, {
      score: evaluation.score,
      ai_feedback: evaluation.feedback,
    });

    totalScore += evaluation.total_score;
    maxTotal   += evaluation.max_score;
    feedbackParts.push(`Q: ${question.text.slice(0, 60)}… → ${evaluation.feedback}`);

    // Aggregate breakdown
    for (const [k, v] of Object.entries(evaluation.score)) {
      scoreBreakdown[k] = (scoreBreakdown[k] || 0) + v;
    }
  }

  const overallPct = maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;

  // Upsert report
  const report = await rrService.upsertReport({
    interview_id:    interviewId,
    overall_score:   overallPct,
    max_score:       100,
    feedback:        feedbackParts.join(" | ") || "Interview completed.",
    score_breakdown: scoreBreakdown,
  });

  res.json({ report, total_score: totalScore, max_total: maxTotal, overall_pct: overallPct });
});

export default router;
