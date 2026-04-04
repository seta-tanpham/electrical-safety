import "dotenv/config";
import { Pool, PoolClient } from "pg";

/**
 * Expected companion data file:
 *   ./curriculum.seed.ts
 */
import {
  courseSeedData,
  curriculumSeedData,
  quickQuizSeedData,
  incidentsSeedData,
  rescueStepsSeedData,
} from "./curriculum.seed";

type LessonSeed = {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  objective?: string;
  lessonType: string;
  orderIndex: number;
  isRequired: boolean;
  content: string[];
  checklist: string[];
  quiz: string[];
};

type ModuleSeed = {
  id: string;
  courseId: string;
  title: string;
  summary?: string;
  duration: string;
  level: string;
  iconKey: string;
  progress: number;
  orderIndex: number;
  isRequired: boolean;
  lessons: LessonSeed[];
};

type QuickQuizSeed = {
  id: number;
  question: string;
  options: string[];
  answer: number;
};

type IncidentSeed = {
  title: string;
  severity: string;
  status: string;
  lesson: string;
};

function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function withTransaction<T>(client: PoolClient, fn: () => Promise<T>): Promise<T> {
  await client.query("BEGIN");
  try {
    const result = await fn();
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function upsertCourse(client: PoolClient): Promise<void> {
  await client.query(
    `
      INSERT INTO training_courses (
        id,
        slug,
        title,
        description,
        audience,
        is_published
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6)
      ON CONFLICT (id) DO UPDATE
      SET
        slug = EXCLUDED.slug,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        audience = EXCLUDED.audience,
        is_published = EXCLUDED.is_published,
        updated_at = NOW()
    `,
    [
      courseSeedData.id,
      courseSeedData.slug,
      courseSeedData.title,
      "Khóa học chuẩn hóa cho kỹ thuật viên hiện trường, bảo trì, vận hành và HSE.",
      JSON.stringify(courseSeedData.audience ?? []),
      courseSeedData.isPublished ?? false,
    ]
  );
}

async function upsertModule(client: PoolClient, module: ModuleSeed): Promise<void> {
  await client.query(
    `
      INSERT INTO training_modules (
        id,
        course_id,
        title,
        summary,
        duration_label,
        level_label,
        icon_key,
        progress_percent,
        order_index,
        is_required
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE
      SET
        course_id = EXCLUDED.course_id,
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        duration_label = EXCLUDED.duration_label,
        level_label = EXCLUDED.level_label,
        icon_key = EXCLUDED.icon_key,
        progress_percent = EXCLUDED.progress_percent,
        order_index = EXCLUDED.order_index,
        is_required = EXCLUDED.is_required,
        updated_at = NOW()
    `,
    [
      module.id,
      module.courseId,
      module.title,
      module.summary ?? null,
      module.duration,
      module.level,
      module.iconKey,
      module.progress,
      module.orderIndex,
      module.isRequired,
    ]
  );
}

async function upsertLesson(client: PoolClient, lesson: LessonSeed): Promise<void> {
  await client.query(
    `
      INSERT INTO training_lessons (
        id,
        course_id,
        module_id,
        title,
        objective,
        lesson_type,
        order_index,
        is_required,
        estimated_duration_minutes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE
      SET
        course_id = EXCLUDED.course_id,
        module_id = EXCLUDED.module_id,
        title = EXCLUDED.title,
        objective = EXCLUDED.objective,
        lesson_type = EXCLUDED.lesson_type,
        order_index = EXCLUDED.order_index,
        is_required = EXCLUDED.is_required,
        estimated_duration_minutes = EXCLUDED.estimated_duration_minutes,
        updated_at = NOW()
    `,
    [
      lesson.id,
      lesson.courseId,
      lesson.moduleId,
      lesson.title,
      lesson.objective ?? null,
      lesson.lessonType,
      lesson.orderIndex,
      lesson.isRequired,
      null,
    ]
  );
}

async function replaceLessonBlocks(client: PoolClient, lesson: LessonSeed): Promise<void> {
  await client.query(`DELETE FROM training_lesson_blocks WHERE lesson_id = $1`, [lesson.id]);

  const blockInserts: Array<{ blockType: "content" | "checklist" | "quiz_prompt"; items: string[] }> = [
    { blockType: "content", items: lesson.content ?? [] },
    { blockType: "checklist", items: lesson.checklist ?? [] },
    { blockType: "quiz_prompt", items: lesson.quiz ?? [] },
  ];

  for (const blockGroup of blockInserts) {
    for (let index = 0; index < blockGroup.items.length; index += 1) {
      await client.query(
        `
          INSERT INTO training_lesson_blocks (
            lesson_id,
            block_type,
            order_index,
            content_text
          )
          VALUES ($1, $2, $3, $4)
        `,
        [lesson.id, blockGroup.blockType, index + 1, blockGroup.items[index]]
      );
    }
  }
}

async function replaceCourseQuiz(client: PoolClient, courseId: string, quizItems: QuickQuizSeed[]): Promise<void> {
  const existingQuestionRows = await client.query<{ id: number }>(
    `SELECT id FROM training_quiz_questions WHERE course_id = $1 ORDER BY order_index`,
    [courseId]
  );

  if (existingQuestionRows.rows.length > 0) {
    const questionIds = existingQuestionRows.rows.map((row) => row.id);
    await client.query(`DELETE FROM training_quiz_options WHERE question_id = ANY($1::bigint[])`, [questionIds]);
  }

  await client.query(`DELETE FROM training_quiz_questions WHERE course_id = $1`, [courseId]);

  for (let index = 0; index < quizItems.length; index += 1) {
    const question = quizItems[index];

    const inserted = await client.query<{ id: number }>(
      `
        INSERT INTO training_quiz_questions (
          course_id,
          lesson_id,
          question_text,
          answer_index,
          order_index
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [courseId, null, question.question, question.answer, index + 1]
    );

    const questionId = inserted.rows[0].id;

    for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
      await client.query(
        `
          INSERT INTO training_quiz_options (
            question_id,
            option_text,
            option_index
          )
          VALUES ($1, $2, $3)
        `,
        [questionId, question.options[optionIndex], optionIndex]
      );
    }
  }
}

async function replaceIncidents(client: PoolClient, courseId: string, items: IncidentSeed[]): Promise<void> {
  await client.query(`DELETE FROM training_incidents WHERE course_id = $1`, [courseId]);

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    await client.query(
      `
        INSERT INTO training_incidents (
          course_id,
          title,
          severity,
          status_label,
          lesson_text,
          order_index
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [courseId, item.title, item.severity, item.status, item.lesson, index + 1]
    );
  }
}

async function replaceRescueSteps(client: PoolClient, courseId: string, steps: string[]): Promise<void> {
  await client.query(`DELETE FROM training_rescue_steps WHERE course_id = $1`, [courseId]);

  for (let index = 0; index < steps.length; index += 1) {
    await client.query(
      `
        INSERT INTO training_rescue_steps (
          course_id,
          step_text,
          order_index
        )
        VALUES ($1, $2, $3)
      `,
      [courseId, steps[index], index + 1]
    );
  }
}

async function seed(client: PoolClient): Promise<void> {
  await upsertCourse(client);

  for (const module of curriculumSeedData as ModuleSeed[]) {
    await upsertModule(client, module);

    for (const lesson of module.lessons) {
      await upsertLesson(client, lesson);
      await replaceLessonBlocks(client, lesson);
    }
  }

  await replaceCourseQuiz(client, courseSeedData.id, quickQuizSeedData as QuickQuizSeed[]);
  await replaceIncidents(client, courseSeedData.id, incidentsSeedData as IncidentSeed[]);
  await replaceRescueSteps(client, courseSeedData.id, rescueStepsSeedData as string[]);
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL ?? assertEnv("DATABASE_URL");

  const pool = new Pool({
    connectionString,
    max: 5,
    ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
  });

  const client = await pool.connect();

  try {
    await withTransaction(client, async () => {
      await seed(client);
    });

    console.log("✅ Electrical safety training seed completed successfully.");
    console.log(`Course: ${courseSeedData.id}`);
    console.log(`Modules: ${(curriculumSeedData as ModuleSeed[]).length}`);
    console.log(
      `Lessons: ${(curriculumSeedData as ModuleSeed[]).reduce((sum, module) => sum + module.lessons.length, 0)}`
    );
    console.log(`Quick quiz questions: ${(quickQuizSeedData as QuickQuizSeed[]).length}`);
    console.log(`Incidents: ${(incidentsSeedData as IncidentSeed[]).length}`);
    console.log(`Rescue steps: ${(rescueStepsSeedData as string[]).length}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("❌ Failed to seed electrical safety training data.");
  console.error(error);
  process.exit(1);
});
