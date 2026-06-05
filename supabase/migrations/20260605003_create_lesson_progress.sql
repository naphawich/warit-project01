-- Migration: Create lesson_progress table for tracking per-user lesson completion
-- Created: 2026-06-05
-- Currently progress is stored only in localStorage — this table enables cross-device sync
-- and is required for the certificate feature mentioned in FAQ.

CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id int NOT NULL,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  last_position_seconds int NOT NULL DEFAULT 0 CHECK (last_position_seconds >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Index for fetching all progress for a user within a course
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_course
  ON lesson_progress(user_id, course_id);

-- Enable Row Level Security
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Users can only read and write their own progress rows
CREATE POLICY "users_own_progress" ON lesson_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ROLLBACK:
-- DROP TABLE IF EXISTS lesson_progress;
