-- Electrical Safety Training LMS schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS training_courses (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  audience JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  duration_label TEXT,
  level_label TEXT,
  icon_key TEXT,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  order_index INTEGER NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, order_index)
);

CREATE TABLE IF NOT EXISTS training_lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  objective TEXT,
  lesson_type TEXT NOT NULL DEFAULT 'theory',
  order_index INTEGER NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_id, order_index),
  CHECK (lesson_type IN ('theory', 'scenario', 'equipment', 'response', 'first_aid'))
);

CREATE TABLE IF NOT EXISTS training_lesson_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN ('content', 'checklist', 'quiz_prompt')),
  order_index INTEGER NOT NULL,
  content_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lesson_id, block_type, order_index)
);

CREATE TABLE IF NOT EXISTS training_quiz_questions (
  id BIGSERIAL PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES training_lessons(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  answer_index INTEGER NOT NULL CHECK (answer_index >= 0),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, order_index)
);

CREATE TABLE IF NOT EXISTS training_quiz_options (
  id BIGSERIAL PRIMARY KEY,
  question_id BIGINT NOT NULL REFERENCES training_quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_index INTEGER NOT NULL CHECK (option_index >= 0),
  UNIQUE (question_id, option_index)
);

CREATE TABLE IF NOT EXISTS training_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Thấp', 'Trung bình', 'Cao', 'Rất cao')),
  status_label TEXT,
  lesson_text TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, order_index)
);

CREATE TABLE IF NOT EXISTS training_rescue_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  step_text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, order_index)
);

CREATE TABLE IF NOT EXISTS training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'expired')),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, user_id)
);

CREATE TABLE IF NOT EXISTS training_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES training_enrollments(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score_percent INTEGER CHECK (score_percent BETWEEN 0 AND 100),
  last_viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS training_lesson_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES training_enrollments(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  attempt_no INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions >= 0),
  correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
  score_percent INTEGER NOT NULL CHECK (score_percent BETWEEN 0 AND 100),
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  answers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  results_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id, lesson_id, attempt_no)
);

CREATE INDEX IF NOT EXISTS idx_training_modules_course_id ON training_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_training_lessons_course_id ON training_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_training_lessons_module_id ON training_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_training_lesson_blocks_lesson ON training_lesson_blocks(lesson_id, block_type, order_index);
CREATE INDEX IF NOT EXISTS idx_training_quiz_questions_course ON training_quiz_questions(course_id);
CREATE INDEX IF NOT EXISTS idx_training_incidents_course ON training_incidents(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_training_rescue_steps_course ON training_rescue_steps(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_user ON training_enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_training_lesson_progress_enrollment ON training_lesson_progress(enrollment_id, status);
CREATE INDEX IF NOT EXISTS idx_training_lesson_quiz_attempts_enrollment ON training_lesson_quiz_attempts(enrollment_id, lesson_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_lesson_quiz_attempts_course ON training_lesson_quiz_attempts(course_id, lesson_id, submitted_at DESC);

CREATE OR REPLACE VIEW v_training_lessons AS
SELECT
  l.id,
  l.course_id,
  l.module_id,
  m.title AS module_title,
  l.title,
  l.objective,
  l.lesson_type,
  l.order_index,
  l.is_required
FROM training_lessons l
JOIN training_modules m ON m.id = l.module_id;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'training_courses',
    'training_modules',
    'training_lessons',
    'training_lesson_blocks',
    'training_quiz_questions',
    'training_incidents',
    'training_rescue_steps',
    'training_enrollments',
    'training_lesson_progress',
    'training_lesson_quiz_attempts'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I', table_name);
    EXECUTE format('
      CREATE TRIGGER trg_set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at()', table_name);
  END LOOP;
END $$;
