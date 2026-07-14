-- ============================================================
-- AI Interview Platform — Supabase SQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (already enabled in Supabase by default)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    user_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role        TEXT CHECK (role IN ('admin', 'student')) NOT NULL DEFAULT 'student',
    full_name   TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── COURSES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
    course_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           TEXT NOT NULL,
    description    TEXT,
    image_url      TEXT,
    background_url TEXT,
    created_by     UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── AVATARS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avatars (
    avatar_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           TEXT NOT NULL,
    style          TEXT DEFAULT 'formal',
    did_presenter_id TEXT,              -- D-ID presenter/source ID
    voice_id       TEXT,               -- ElevenLabs voice ID
    background_url TEXT,
    course_id      UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── QUESTIONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
    question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    type        TEXT CHECK (type IN ('open', 'mcq', 'scenario')) NOT NULL DEFAULT 'open',
    difficulty  TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    order_index INT DEFAULT 0,
    rubric      JSONB DEFAULT '{"clarity": 5, "confidence": 5, "accuracy": 10}',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── COURSE-STUDENT ASSIGNMENTS ────────────────────────────────
CREATE TABLE IF NOT EXISTS course_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id     UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    student_id    UUID REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (course_id, student_id)
);

-- ── INTERVIEWS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interviews (
    interview_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       UUID REFERENCES users(user_id) ON DELETE CASCADE,
    course_id        UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    scheduled_time   TIMESTAMPTZ NOT NULL,
    duration_minutes INT DEFAULT 30,
    status           TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
    started_at       TIMESTAMPTZ,
    ended_at         TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── RESPONSES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS responses (
    response_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id  UUID REFERENCES interviews(interview_id) ON DELETE CASCADE,
    question_id   UUID REFERENCES questions(question_id) ON DELETE CASCADE,
    transcription TEXT,
    audio_url     TEXT,
    duration_secs INT,
    score         JSONB,   -- {"clarity": 4, "confidence": 3, "accuracy": 8}
    ai_feedback   TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── REPORTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
    report_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id  UUID REFERENCES interviews(interview_id) ON DELETE CASCADE UNIQUE,
    overall_score INT,
    max_score     INT DEFAULT 100,
    feedback      TEXT,
    score_breakdown JSONB,  -- {"clarity": 18, "confidence": 14, "accuracy": 42}
    generated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_questions_course     ON questions(course_id);
CREATE INDEX IF NOT EXISTS idx_interviews_student   ON interviews(student_id);
CREATE INDEX IF NOT EXISTS idx_interviews_course    ON interviews(course_id);
CREATE INDEX IF NOT EXISTS idx_responses_interview  ON responses(interview_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student  ON course_assignments(student_id);

-- ── AUTO-UPDATE updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    CREATE TRIGGER trg_users_updated      BEFORE UPDATE ON users      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    CREATE TRIGGER trg_courses_updated    BEFORE UPDATE ON courses    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    CREATE TRIGGER trg_avatars_updated    BEFORE UPDATE ON avatars    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    CREATE TRIGGER trg_questions_updated  BEFORE UPDATE ON questions  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    CREATE TRIGGER trg_interviews_updated BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── SEED: Default Admin ──────────────────────────────────────
-- Password: Admin@1234  (bcrypt hash — change immediately in production)
INSERT INTO users (email, password_hash, role, full_name)
VALUES (
    'admin@aiinterview.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeM0tXLBTRGQvCkS2',
    'admin',
    'Platform Administrator'
) ON CONFLICT (email) DO NOTHING;