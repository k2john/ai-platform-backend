import { z } from "zod";

// ── Auth ─────────────────────────────────────────────────────
export const RegisterSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Full name is required"),
  role: z.enum(["admin", "student"]).default("student"),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const UpdateUserSchema = z.object({
  full_name: z.string().optional(),
  avatar_url: z.string().url().optional(),
});

// ── Courses ──────────────────────────────────────────────────
export const CourseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  background_url: z.string().url().optional().or(z.literal("")),
});

export const CourseUpdateSchema = CourseSchema.partial();

// ── Avatars ──────────────────────────────────────────────────
export const AvatarSchema = z.object({
  name: z.string().min(1),
  style: z.string().default("formal"),
  did_presenter_id: z.string().optional(),
  voice_id: z.string().optional(),
  background_url: z.string().url().optional().or(z.literal("")),
  course_id: z.string().uuid("Invalid course ID"),
});

export const AvatarUpdateSchema = AvatarSchema.partial();

// ── Questions ────────────────────────────────────────────────
export const RubricSchema = z.record(z.string(), z.number().min(1).max(20));

export const QuestionSchema = z.object({
  course_id: z.string().uuid(),
  text: z.string().min(5, "Question text is required"),
  type: z.enum(["open", "mcq", "scenario"]).default("open"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  order_index: z.number().int().min(0).default(0),
  rubric: RubricSchema.default({ clarity: 5, confidence: 5, accuracy: 10 }),
});

export const QuestionUpdateSchema = QuestionSchema.partial();

// ── Interviews ───────────────────────────────────────────────
export const InterviewSchema = z.object({
  student_id: z.string().uuid(),
  course_id: z.string().uuid(),
  scheduled_time: z.string().datetime({ offset: true }),
  duration_minutes: z.number().int().min(5).max(120).default(30),
});

export const InterviewUpdateSchema = z.object({
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
  scheduled_time: z.string().datetime({ offset: true }).optional(),
  duration_minutes: z.number().int().min(5).max(120).optional(),
});

// ── Responses ────────────────────────────────────────────────
export const ResponseSchema = z.object({
  interview_id: z.string().uuid(),
  question_id: z.string().uuid(),
  transcription: z.string().optional(),
  audio_url: z.string().url().optional(),
  duration_secs: z.number().int().optional(),
  score: RubricSchema.optional(),
  ai_feedback: z.string().optional(),
});

// ── Reports ──────────────────────────────────────────────────
export const ReportSchema = z.object({
  interview_id: z.string().uuid(),
  overall_score: z.number().int().min(0).max(100).optional(),
  max_score: z.number().int().default(100),
  feedback: z.string().optional(),
  score_breakdown: RubricSchema.optional(),
});

// ── AI ───────────────────────────────────────────────────────
export const TranscribeUrlSchema = z.object({
  audio_url: z.string().url(),
});

export const EvaluateSchema = z.object({
  transcription: z.string().min(1),
  question_text: z.string().min(1),
  rubric: RubricSchema.default({ clarity: 5, confidence: 5, accuracy: 10 }),
});

export const AvatarSpeakSchema = z.object({
  text: z.string().min(1),
  presenter_id: z.string().optional(),
  voice_id: z.string().optional(),
  background_url: z.string().url().optional(),
});
