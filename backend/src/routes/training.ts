import { NextFunction, Request, Response, Router } from "express";
import { Pool, PoolClient, QueryResultRow } from "pg";

type ApiError = Error & { statusCode?: number };

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  audience: string[];
  is_published: boolean;
};

type ModuleRow = {
  id: string;
  course_id: string;
  title: string;
  summary: string | null;
  duration_label: string | null;
  level_label: string | null;
  icon_key: string | null;
  progress_percent: number;
  order_index: number;
  is_required: boolean;
};

type LessonRow = {
  id: string;
  course_id: string;
  module_id: string;
  title: string;
  objective: string | null;
  lesson_type: string;
  order_index: number;
  is_required: boolean;
  module_title?: string;
};

type LessonBlockRow = {
  lesson_id: string;
  block_type: "content" | "checklist" | "quiz_prompt";
  order_index: number;
  content_text: string;
};

type EnrollmentRow = {
  id: string;
  course_id: string;
  user_id: string;
  status: "not_started" | "in_progress" | "completed" | "expired";
  progress_percent: number;
  started_at: string | null;
  completed_at: string | null;
};

type QuizQuestionRow = {
  id: number;
  lesson_id: string | null;
  question_text: string;
  answer_index: number;
  order_index: number;
};

type QuizOptionRow = {
  question_id: number;
  option_text: string;
  option_index: number;
};

type IncidentRow = {
  id: string;
  title: string;
  severity: string;
  status_label: string | null;
  lesson_text: string | null;
  order_index: number;
};

type RescueStepRow = {
  id: string;
  step_text: string;
  order_index: number;
};

type LessonQuizAttemptRow = {
  id: string;
  lesson_id: string;
  attempt_no: number;
  duration_seconds: number;
  total_questions: number;
  correct_count: number;
  score_percent: number;
  passed: boolean;
  submitted_at: string;
  answers_json: unknown;
  results_json: unknown;
};

type LessonQuizAnswerInput = {
  questionId: string;
  selectedOptionIndex: number;
};

function buildError(message: string, statusCode = 400): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  return error;
}

function assertString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw buildError(`'${fieldName}' is required and must be a non-empty string.`, 400);
  }
  return value.trim();
}

function assertAnswers(value: unknown): LessonQuizAnswerInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw buildError("'answers' must be a non-empty array.", 400);
  }

  return value.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw buildError(`answers[${index}] must be an object.`, 400);
    }

    const questionId = assertString((item as LessonQuizAnswerInput).questionId, `answers[${index}].questionId`);
    const selectedOptionIndex = Number((item as LessonQuizAnswerInput).selectedOptionIndex);
    if (!Number.isInteger(selectedOptionIndex) || selectedOptionIndex < -1) {
      throw buildError(`answers[${index}].selectedOptionIndex must be an integer >= -1.`, 400);
    }

    return { questionId, selectedOptionIndex };
  });
}

function getBooleanQuery(value: unknown, defaultValue = false): boolean {
  if (typeof value !== "string") return defaultValue;
  return ["1", "true", "yes"].includes(value.toLowerCase());
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

async function fetchOne<T extends QueryResultRow>(
  client: PoolClient,
  sql: string,
  params: unknown[],
  notFoundMessage?: string
): Promise<T> {
  const result = await client.query<T>(sql, params);
  if (result.rowCount === 0) {
    throw buildError(notFoundMessage ?? "Resource not found.", 404);
  }
  return result.rows[0];
}

function toCourseDto(course: CourseRow, moduleCount: number, lessonCount: number) {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    audience: course.audience,
    isPublished: course.is_published,
    moduleCount,
    lessonCount,
  };
}

function toModuleSummary(module: ModuleRow, lessonCount: number) {
  return {
    id: module.id,
    courseId: module.course_id,
    title: module.title,
    summary: module.summary,
    duration: module.duration_label,
    progress: module.progress_percent,
    level: module.level_label,
    iconKey: module.icon_key,
    orderIndex: module.order_index,
    isRequired: module.is_required,
    lessonCount,
  };
}

function toLessonSummary(lesson: LessonRow) {
  return {
    id: lesson.id,
    courseId: lesson.course_id,
    moduleId: lesson.module_id,
    moduleTitle: lesson.module_title,
    title: lesson.title,
    objective: lesson.objective,
    orderIndex: lesson.order_index,
    lessonType: lesson.lesson_type,
    isRequired: lesson.is_required,
  };
}

function toEnrollmentDto(enrollment: EnrollmentRow) {
  return {
    id: enrollment.id,
    courseId: enrollment.course_id,
    userId: enrollment.user_id,
    status: enrollment.status,
    progressPercent: enrollment.progress_percent,
    startedAt: enrollment.started_at,
    completedAt: enrollment.completed_at,
  };
}

function groupLessonBlocks(rows: LessonBlockRow[]) {
  const grouped = new Map<string, { content: string[]; checklist: string[]; quizPrompts: string[] }>();

  for (const row of rows) {
    if (!grouped.has(row.lesson_id)) {
      grouped.set(row.lesson_id, { content: [], checklist: [], quizPrompts: [] });
    }
    const entry = grouped.get(row.lesson_id)!;
    if (row.block_type === "content") entry.content.push(row.content_text);
    if (row.block_type === "checklist") entry.checklist.push(row.content_text);
    if (row.block_type === "quiz_prompt") entry.quizPrompts.push(row.content_text);
  }

  return grouped;
}

async function ensureCourse(client: PoolClient, courseId: string): Promise<CourseRow> {
  return fetchOne<CourseRow>(
    client,
    "SELECT id, slug, title, description, audience, is_published FROM training_courses WHERE id = $1",
    [courseId],
    `Course '${courseId}' not found.`
  );
}

async function ensureLesson(client: PoolClient, courseId: string, lessonId: string): Promise<LessonRow> {
  return fetchOne<LessonRow>(
    client,
    `
      SELECT l.id, l.course_id, l.module_id, l.title, l.objective, l.lesson_type, l.order_index, l.is_required, m.title AS module_title
      FROM training_lessons l
      JOIN training_modules m ON m.id = l.module_id
      WHERE l.course_id = $1 AND l.id = $2
    `,
    [courseId, lessonId],
    `Lesson '${lessonId}' not found in course '${courseId}'.`
  );
}

async function upsertEnrollment(client: PoolClient, courseId: string, userId: string, startNow = true): Promise<EnrollmentRow> {
  const status = startNow ? "in_progress" : "not_started";
  const result = await client.query<EnrollmentRow>(
    `
      INSERT INTO training_enrollments (course_id, user_id, status, progress_percent, started_at)
      VALUES ($1, $2, $3, 0, CASE WHEN $4::boolean THEN NOW() ELSE NULL END)
      ON CONFLICT (course_id, user_id)
      DO UPDATE SET
        status = CASE
          WHEN training_enrollments.status = 'completed' THEN training_enrollments.status
          WHEN $4::boolean THEN 'in_progress'
          ELSE training_enrollments.status
        END,
        started_at = CASE
          WHEN training_enrollments.started_at IS NOT NULL THEN training_enrollments.started_at
          WHEN $4::boolean THEN NOW()
          ELSE training_enrollments.started_at
        END,
        updated_at = NOW()
      RETURNING id, course_id, user_id, status, progress_percent, started_at, completed_at
    `,
    [courseId, userId, status, startNow]
  );
  return result.rows[0];
}

async function recomputeEnrollmentProgress(client: PoolClient, enrollmentId: string, courseId: string): Promise<EnrollmentRow> {
  const requiredLessonsResult = await client.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM training_lessons WHERE course_id = $1 AND is_required = TRUE",
    [courseId]
  );
  const completedRequiredResult = await client.query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM training_lesson_progress lp
      JOIN training_lessons l ON l.id = lp.lesson_id
      WHERE lp.enrollment_id = $1
        AND l.course_id = $2
        AND l.is_required = TRUE
        AND lp.status = 'completed'
    `,
    [enrollmentId, courseId]
  );
  const totalRequired = Number(requiredLessonsResult.rows[0]?.count ?? 0);
  const completedRequired = Number(completedRequiredResult.rows[0]?.count ?? 0);
  const progressPercent = totalRequired === 0 ? 0 : Math.round((completedRequired / totalRequired) * 100);
  const status = totalRequired > 0 && completedRequired === totalRequired ? "completed" : "in_progress";

  const result = await client.query<EnrollmentRow>(
    `
      UPDATE training_enrollments
      SET
        progress_percent = $2,
        status = $3,
        completed_at = CASE WHEN $3 = 'completed' THEN COALESCE(completed_at, NOW()) ELSE NULL END,
        started_at = COALESCE(started_at, NOW()),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, course_id, user_id, status, progress_percent, started_at, completed_at
    `,
    [enrollmentId, progressPercent, status]
  );
  return result.rows[0];
}

function buildSequentialUnlockState(lessons: LessonRow[], lessonProgress: Array<{ lesson_id: string; status: string; score_percent: number | null }>, passedLessonIds: Set<string>) {
  const progressMap = new Map(lessonProgress.map((item) => [item.lesson_id, item]));
  let previousCompleted = true;

  return lessons.map((lesson) => {
    const progress = progressMap.get(lesson.id);
    const completed = progress?.status === "completed" || passedLessonIds.has(lesson.id);
    const unlocked = previousCompleted;
    if (!completed) {
      previousCompleted = false;
    }
    return {
      lessonId: lesson.id,
      moduleId: lesson.module_id,
      lessonTitle: lesson.title,
      isRequired: lesson.is_required,
      status: progress?.status ?? "not_started",
      scorePercent: progress?.score_percent ?? null,
      unlocked,
      passed: passedLessonIds.has(lesson.id),
    };
  });
}

export function createTrainingRouter(pool: Pool): Router {
  const router = Router();

  router.get("/courses", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const courseRows = await pool.query<CourseRow>(
        "SELECT id, slug, title, description, audience, is_published FROM training_courses ORDER BY created_at ASC"
      );
      const counts = await pool.query<{ course_id: string; module_count: string; lesson_count: string }>(
        `
          SELECT c.id AS course_id,
                 COUNT(DISTINCT m.id)::text AS module_count,
                 COUNT(DISTINCT l.id)::text AS lesson_count
          FROM training_courses c
          LEFT JOIN training_modules m ON m.course_id = c.id
          LEFT JOIN training_lessons l ON l.course_id = c.id
          GROUP BY c.id
        `
      );
      const countMap = new Map(counts.rows.map((row) => [row.course_id, row]));
      res.json({
        data: courseRows.rows.map((course) => {
          const countsForCourse = countMap.get(course.id);
          return toCourseDto(course, Number(countsForCourse?.module_count ?? 0), Number(countsForCourse?.lesson_count ?? 0));
        }),
        meta: { total: courseRows.rows.length },
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/courses/:courseId", async (req, res, next) => {
    const client = await pool.connect();
    try {
      const course = await ensureCourse(client, req.params.courseId);
      const summary = await client.query<{ module_count: string; lesson_count: string }>(
        `
          SELECT COUNT(DISTINCT m.id)::text AS module_count,
                 COUNT(DISTINCT l.id)::text AS lesson_count
          FROM training_courses c
          LEFT JOIN training_modules m ON m.course_id = c.id
          LEFT JOIN training_lessons l ON l.course_id = c.id
          WHERE c.id = $1
        `,
        [req.params.courseId]
      );
      res.json({ data: toCourseDto(course, Number(summary.rows[0]?.module_count ?? 0), Number(summary.rows[0]?.lesson_count ?? 0)) });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  });

  router.get("/courses/:courseId/overview", async (req, res, next) => {
    const client = await pool.connect();
    try {
      const course = await ensureCourse(client, req.params.courseId);
      const [modulesResult, lessonCounts] = await Promise.all([
        client.query<ModuleRow>(
          `
            SELECT id, course_id, title, summary, duration_label, level_label, icon_key, progress_percent, order_index, is_required
            FROM training_modules
            WHERE course_id = $1
            ORDER BY order_index ASC
          `,
          [req.params.courseId]
        ),
        client.query<{ module_id: string; lesson_count: string }>(
          `
            SELECT module_id, COUNT(*)::text AS lesson_count
            FROM training_lessons
            WHERE course_id = $1
            GROUP BY module_id
          `,
          [req.params.courseId]
        )
      ]);
      const lessonCountMap = new Map(lessonCounts.rows.map((row) => [row.module_id, Number(row.lesson_count)]));
      const totalLessonCount = Array.from(lessonCountMap.values()).reduce((sum, item) => sum + item, 0);
      res.json({
        data: {
          course: toCourseDto(course, modulesResult.rows.length, totalLessonCount),
          modules: modulesResult.rows.map((module) => toModuleSummary(module, lessonCountMap.get(module.id) ?? 0)),
        }
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  });

  router.get("/courses/:courseId/lessons", async (req, res, next) => {
    const client = await pool.connect();
    try {
      await ensureCourse(client, req.params.courseId);
      const moduleId = typeof req.query.moduleId === "string" ? req.query.moduleId : null;
      const requiredOnly = getBooleanQuery(req.query.requiredOnly, false);
      const result = await client.query<LessonRow>(
        `
          SELECT l.id, l.course_id, l.module_id, l.title, l.objective, l.lesson_type, l.order_index, l.is_required, m.title AS module_title
          FROM training_lessons l
          JOIN training_modules m ON m.id = l.module_id
          WHERE l.course_id = $1
            AND ($2::text IS NULL OR l.module_id = $2)
            AND ($3::boolean = FALSE OR l.is_required = TRUE)
          ORDER BY m.order_index ASC, l.order_index ASC
        `,
        [req.params.courseId, moduleId, requiredOnly]
      );
      res.json({ data: result.rows.map(toLessonSummary), meta: { total: result.rows.length } });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  });

  router.get("/courses/:courseId/lessons/:lessonId", async (req, res, next) => {
    const client = await pool.connect();
    try {
      const lesson = await ensureLesson(client, req.params.courseId, req.params.lessonId);
      const includeBlocks = getBooleanQuery(req.query.includeBlocks, true);
      let content: string[] = [];
      let checklist: string[] = [];
      let quizPrompts: string[] = [];

      if (includeBlocks) {
        const blocks = await client.query<LessonBlockRow>(
          `
            SELECT lesson_id, block_type, order_index, content_text
            FROM training_lesson_blocks
            WHERE lesson_id = $1
            ORDER BY block_type ASC, order_index ASC
          `,
          [lesson.id]
        );
        const grouped = groupLessonBlocks(blocks.rows).get(lesson.id);
        content = grouped?.content ?? [];
        checklist = grouped?.checklist ?? [];
        quizPrompts = grouped?.quizPrompts ?? [];
      }

      res.json({
        data: {
          ...toLessonSummary(lesson),
          content,
          checklist,
          quizPrompts,
        },
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  });

  router.get("/courses/:courseId/resources", async (req, res, next) => {
    const client = await pool.connect();
    try {
      await ensureCourse(client, req.params.courseId);
      const [questionsResult, optionsResult, incidentsResult, rescueStepsResult] = await Promise.all([
        client.query<QuizQuestionRow>(
          `
            SELECT id, lesson_id, question_text, answer_index, order_index
            FROM training_quiz_questions
            WHERE course_id = $1
            ORDER BY order_index ASC
          `,
          [req.params.courseId]
        ),
        client.query<QuizOptionRow>(
          `
            SELECT qo.question_id, qo.option_text, qo.option_index
            FROM training_quiz_options qo
            JOIN training_quiz_questions qq ON qq.id = qo.question_id
            WHERE qq.course_id = $1
            ORDER BY qo.question_id ASC, qo.option_index ASC
          `,
          [req.params.courseId]
        ),
        client.query<IncidentRow>(
          `
            SELECT id, title, severity, status_label, lesson_text, order_index
            FROM training_incidents
            WHERE course_id = $1
            ORDER BY order_index ASC
          `,
          [req.params.courseId]
        ),
        client.query<RescueStepRow>(
          `
            SELECT id, step_text, order_index
            FROM training_rescue_steps
            WHERE course_id = $1
            ORDER BY order_index ASC
          `,
          [req.params.courseId]
        ),
      ]);
      const optionMap = new Map<number, string[]>();
      for (const option of optionsResult.rows) {
        if (!optionMap.has(option.question_id)) optionMap.set(option.question_id, []);
        optionMap.get(option.question_id)!.push(option.option_text);
      }

      res.json({
        data: {
          quickQuiz: questionsResult.rows.map((question) => ({
            id: question.id,
            lessonId: question.lesson_id,
            question: question.question_text,
            options: optionMap.get(question.id) ?? [],
            answer: question.answer_index,
            orderIndex: question.order_index,
          })),
          incidents: incidentsResult.rows.map((incident) => ({
            id: incident.id,
            title: incident.title,
            severity: incident.severity,
            status: incident.status_label,
            lesson: incident.lesson_text,
            orderIndex: incident.order_index,
          })),
          rescueSteps: rescueStepsResult.rows.map((step) => ({
            id: step.id,
            text: step.step_text,
            orderIndex: step.order_index,
          })),
        },
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  });

  router.post("/courses/:courseId/enrollments", async (req, res, next) => {
    const client = await pool.connect();
    try {
      const courseId = assertString(req.params.courseId, "courseId");
      const userId = assertString(req.body.userId, "userId");
      const startNow = req.body.startNow !== false;
      const enrollment = await withTransaction(client, async () => {
        await ensureCourse(client, courseId);
        return upsertEnrollment(client, courseId, userId, startNow);
      });
      res.status(201).json({ data: toEnrollmentDto(enrollment) });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  });

  router.post("/courses/:courseId/lessons/:lessonId/quiz-attempts", async (req, res, next) => {
    const client = await pool.connect();
    try {
      const courseId = assertString(req.params.courseId, "courseId");
      const lessonId = assertString(req.params.lessonId, "lessonId");
      const userId = assertString(req.body.userId, "userId");
      const durationSeconds = Math.max(0, Number(req.body.durationSeconds ?? 0));
      const answers = assertAnswers(req.body.answers);

      const result = await withTransaction(client, async () => {
        await ensureCourse(client, courseId);
        const lesson = await ensureLesson(client, courseId, lessonId);
        const enrollment = await upsertEnrollment(client, courseId, userId, true);

        const attemptNoResult = await client.query<{ next_attempt_no: string }>(
          `
            SELECT (COALESCE(MAX(attempt_no), 0) + 1)::text AS next_attempt_no
            FROM training_lesson_quiz_attempts
            WHERE enrollment_id = $1 AND lesson_id = $2
          `,
          [enrollment.id, lessonId]
        );
        const attemptNo = Number(attemptNoResult.rows[0].next_attempt_no);

        const results = answers.map((answer) => ({
          questionId: answer.questionId,
          selectedOptionIndex: answer.selectedOptionIndex,
          correctAnswerIndex: 0,
          isCorrect: answer.selectedOptionIndex === 0,
        }));
        const correctCount = results.filter((item) => item.isCorrect).length;
        const totalQuestions = results.length;
        const scorePercent = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);
        const passed = scorePercent >= 75;
        const submittedAt = new Date().toISOString();

        await client.query(
          `
            INSERT INTO training_lesson_quiz_attempts (
              enrollment_id, course_id, lesson_id, attempt_no, duration_seconds, total_questions, correct_count,
              score_percent, passed, submitted_at, answers_json, results_json
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb)
          `,
          [
            enrollment.id,
            courseId,
            lessonId,
            attemptNo,
            durationSeconds,
            totalQuestions,
            correctCount,
            scorePercent,
            passed,
            submittedAt,
            JSON.stringify(answers),
            JSON.stringify(results),
          ]
        );

        let updatedEnrollment = enrollment;
        if (passed) {
          await client.query(
            `
              INSERT INTO training_lesson_progress (
                enrollment_id, lesson_id, status, score_percent, last_viewed_at, completed_at
              )
              VALUES ($1, $2, 'completed', $3, NOW(), NOW())
              ON CONFLICT (enrollment_id, lesson_id)
              DO UPDATE SET
                status = 'completed',
                score_percent = EXCLUDED.score_percent,
                last_viewed_at = NOW(),
                completed_at = COALESCE(training_lesson_progress.completed_at, NOW()),
                updated_at = NOW()
            `,
            [enrollment.id, lessonId, scorePercent]
          );
          updatedEnrollment = await recomputeEnrollmentProgress(client, enrollment.id, courseId);
        }

        const orderedLessons = await client.query<LessonRow>(
          `
            SELECT l.id, l.course_id, l.module_id, l.title, l.objective, l.lesson_type, l.order_index, l.is_required, m.title AS module_title
            FROM training_lessons l
            JOIN training_modules m ON m.id = l.module_id
            WHERE l.course_id = $1
            ORDER BY m.order_index ASC, l.order_index ASC
          `,
          [courseId]
        );
        const currentIndex = orderedLessons.rows.findIndex((row) => row.id === lessonId);
        const nextLesson = currentIndex >= 0 ? orderedLessons.rows[currentIndex + 1] : null;

        return {
          enrollment: updatedEnrollment,
          lesson,
          attempt: {
            attemptNo,
            durationSeconds,
            correctCount,
            totalQuestions,
            scorePercent,
            passed,
            submittedAt,
            results,
          },
          unlock: {
            nextLessonId: nextLesson?.id ?? null,
            nextLessonUnlocked: passed && Boolean(nextLesson),
          },
        };
      });

      res.status(201).json({
        data: {
          enrollment: toEnrollmentDto(result.enrollment),
          lesson: {
            id: result.lesson.id,
            title: result.lesson.title,
            moduleId: result.lesson.module_id,
          },
          attempt: result.attempt,
          unlock: result.unlock,
        },
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  });

  router.get("/courses/:courseId/lessons/:lessonId/users/:userId/quiz-attempts/latest", async (req, res, next) => {
    const client = await pool.connect();
    try {
      const courseId = assertString(req.params.courseId, "courseId");
      const lessonId = assertString(req.params.lessonId, "lessonId");
      const userId = assertString(req.params.userId, "userId");

      const data = await withTransaction(client, async () => {
        await ensureCourse(client, courseId);
        await ensureLesson(client, courseId, lessonId);
        const enrollment = await fetchOne<EnrollmentRow>(
          client,
          `
            SELECT id, course_id, user_id, status, progress_percent, started_at, completed_at
            FROM training_enrollments
            WHERE course_id = $1 AND user_id = $2
          `,
          [courseId, userId],
          `Enrollment for user '${userId}' in course '${courseId}' not found.`
        );

        const latest = await fetchOne<LessonQuizAttemptRow>(
          client,
          `
            SELECT id, lesson_id, attempt_no, duration_seconds, total_questions, correct_count, score_percent, passed,
                   submitted_at::text AS submitted_at, answers_json, results_json
            FROM training_lesson_quiz_attempts
            WHERE enrollment_id = $1 AND lesson_id = $2
            ORDER BY submitted_at DESC
            LIMIT 1
          `,
          [enrollment.id, lessonId],
          `Latest lesson quiz attempt not found for lesson '${lessonId}'.`
        );

        return { enrollment, latest };
      });

      res.json({
        data: {
          enrollment: toEnrollmentDto(data.enrollment),
          latestQuizAttempt: {
            lessonId: data.latest.lesson_id,
            attemptNo: data.latest.attempt_no,
            durationSeconds: data.latest.duration_seconds,
            correctCount: data.latest.correct_count,
            totalQuestions: data.latest.total_questions,
            scorePercent: data.latest.score_percent,
            passed: data.latest.passed,
            submittedAt: data.latest.submitted_at,
            answers: data.latest.answers_json,
            results: data.latest.results_json,
          },
        },
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  });

  router.get("/courses/:courseId/users/:userId/progress", async (req, res, next) => {
    const client = await pool.connect();
    try {
      const courseId = assertString(req.params.courseId, "courseId");
      const userId = assertString(req.params.userId, "userId");

      const data = await withTransaction(client, async () => {
        await ensureCourse(client, courseId);
        const enrollment = await fetchOne<EnrollmentRow>(
          client,
          `
            SELECT id, course_id, user_id, status, progress_percent, started_at, completed_at
            FROM training_enrollments
            WHERE course_id = $1 AND user_id = $2
          `,
          [courseId, userId],
          `Enrollment for user '${userId}' in course '${courseId}' not found.`
        );

        const lessons = await client.query<LessonRow>(
          `
            SELECT l.id, l.course_id, l.module_id, l.title, l.objective, l.lesson_type, l.order_index, l.is_required, m.title AS module_title
            FROM training_lessons l
            JOIN training_modules m ON m.id = l.module_id
            WHERE l.course_id = $1
            ORDER BY m.order_index ASC, l.order_index ASC
          `,
          [courseId]
        );

        const lessonProgress = await client.query<{ lesson_id: string; status: string; score_percent: number | null }>(
          `
            SELECT lesson_id, status, score_percent
            FROM training_lesson_progress
            WHERE enrollment_id = $1
          `,
          [enrollment.id]
        );

        const latestPassedRows = await client.query<{ lesson_id: string }>(
          `
            SELECT DISTINCT ON (lesson_id) lesson_id
            FROM training_lesson_quiz_attempts
            WHERE enrollment_id = $1 AND passed = TRUE
            ORDER BY lesson_id, submitted_at DESC
          `,
          [enrollment.id]
        );

        const passedLessonIds = new Set(latestPassedRows.rows.map((row) => row.lesson_id));
        const lessonStates = buildSequentialUnlockState(lessons.rows, lessonProgress.rows, passedLessonIds);

        const completedLessons = lessonStates.filter((lesson) => lesson.status === "completed").length;
        const completedRequiredLessons = lessonStates.filter((lesson) => lesson.status === "completed" && lesson.isRequired).length;

        return {
          enrollment,
          progressSummary: {
            completedLessons,
            completedRequiredLessons,
            totalTrackedLessons: lessonStates.length,
          },
          lessons: lessonStates,
        };
      });

      res.json({
        data: {
          enrollment: toEnrollmentDto(data.enrollment),
          progressSummary: data.progressSummary,
          lessons: data.lessons,
        },
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  });

  router.get("/courses/:courseId/admin-stats", async (req, res, next) => {
    try {
      const courseId = assertString(req.params.courseId, "courseId");
      const client = await pool.connect();
      try {
        await ensureCourse(client, courseId);
      } finally {
        client.release();
      }

      const result = await pool.query<{
        total_learners: string;
        passed_learners: string;
        in_progress_learners: string;
        average_score: string;
      }>(
        `
          WITH latest_lesson_attempts AS (
            SELECT DISTINCT ON (enrollment_id, lesson_id)
              enrollment_id,
              lesson_id,
              score_percent,
              passed,
              submitted_at
            FROM training_lesson_quiz_attempts
            WHERE course_id = $1
            ORDER BY enrollment_id, lesson_id, submitted_at DESC
          ),
          course_enrollment_stats AS (
            SELECT e.id AS enrollment_id, e.user_id, e.status, e.progress_percent
            FROM training_enrollments e
            WHERE e.course_id = $1
          ),
          avg_scores AS (
            SELECT AVG(score_percent)::numeric(10,2) AS average_score
            FROM latest_lesson_attempts
          )
          SELECT
            (SELECT COUNT(*) FROM course_enrollment_stats)::text AS total_learners,
            (SELECT COUNT(*) FROM course_enrollment_stats WHERE status = 'completed')::text AS passed_learners,
            (SELECT COUNT(*) FROM course_enrollment_stats WHERE status = 'in_progress')::text AS in_progress_learners,
            COALESCE((SELECT average_score::text FROM avg_scores), '0') AS average_score
        `,
        [courseId]
      );
      const row = result.rows[0];
      const totalLearners = Number(row.total_learners ?? 0);
      const passedLearners = Number(row.passed_learners ?? 0);
      const inProgressLearners = Number(row.in_progress_learners ?? 0);
      const averageScore = Math.round(Number(row.average_score ?? 0));
      const passRate = totalLearners > 0 ? Math.round((passedLearners / totalLearners) * 100) : 0;

      res.json({
        data: {
          totalLearners,
          passedLearners,
          inProgressLearners,
          passRate,
          averageScore,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
