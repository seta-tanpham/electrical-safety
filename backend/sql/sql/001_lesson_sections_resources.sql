CREATE TABLE training_lesson_sections (
  id UUID PRIMARY KEY,
  lesson_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  warning_text TEXT,
  examples JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE training_lesson_resources (
  id UUID PRIMARY KEY,
  lesson_id UUID NOT NULL,
  section_id UUID NULL,
  resource_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT,
  preview_url TEXT,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE training_user_section_progress (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  section_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  completed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE training_user_resource_progress (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  resource_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'opened',
  completion_percent INTEGER NULL,
  completed_at TIMESTAMP NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
