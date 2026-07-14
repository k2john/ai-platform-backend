// ── Auth ─────────────────────────────────────────────────────
export interface User {
  user_id: string;
  email: string;
  password_hash: string;
  role: "admin" | "student";
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPublic {
  user_id: string;
  email: string;
  role: "admin" | "student";
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface TokenPayload {
  sub: string;   // user_id
  role: "admin" | "student";
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}

// ── Course ───────────────────────────────────────────────────
export interface Course {
  course_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  background_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Avatar ───────────────────────────────────────────────────
export interface Avatar {
  avatar_id: string;
  name: string;
  style: string;
  did_presenter_id: string | null;
  voice_id: string | null;
  background_url: string | null;
  course_id: string;
  created_at: string;
  updated_at: string;
}

// ── Question ─────────────────────────────────────────────────
export interface Rubric {
  clarity: number;
  confidence: number;
  accuracy: number;
  [key: string]: number;
}

export interface Question {
  question_id: string;
  course_id: string;
  text: string;
  type: "open" | "mcq" | "scenario";
  difficulty: "easy" | "medium" | "hard";
  order_index: number;
  rubric: Rubric;
  created_at: string;
  updated_at: string;
}

// ── Interview ────────────────────────────────────────────────
export type InterviewStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface Interview {
  interview_id: string;
  student_id: string;
  course_id: string;
  scheduled_time: string;
  duration_minutes: number;
  status: InterviewStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Response ─────────────────────────────────────────────────
export interface InterviewResponse {
  response_id: string;
  interview_id: string;
  question_id: string;
  transcription: string | null;
  audio_url: string | null;
  duration_secs: number | null;
  score: Rubric | null;
  ai_feedback: string | null;
  created_at: string;
}

// ── Report ───────────────────────────────────────────────────
export interface Report {
  report_id: string;
  interview_id: string;
  overall_score: number | null;
  max_score: number;
  feedback: string | null;
  score_breakdown: Rubric | null;
  generated_at: string;
}

// ── AI ───────────────────────────────────────────────────────
export interface TranscribeResult {
  transcription: string;
  language?: string;
  duration_secs?: number;
}

export interface EvaluationScore {
  score: Rubric;
  total_score: number;
  max_score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface AvatarTalkResult {
  talk_id: string | null;
  status: string;
  video_url: string | null;
}

// ── Express Request extension ─────────────────────────────────
import { Request } from "express";
export interface AuthRequest extends Request {
  user?: TokenPayload;
}
