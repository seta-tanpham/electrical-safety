import type {
  EnrichedLesson,
  EnrichedModule,
  LessonDetail,
  LessonQuizQuestion,
  LessonResource,
  LessonSection,
  LessonSummary,
  Module,
  NormalizedLessonDetail,
  ProgressLesson,
} from "./types";
import { buildFallbackSections } from "../../mock/lessonResourceCatalog";

export const STATUS_LABELS: Record<string, string> = {
  not_started: "Chưa bắt đầu",
  in_progress: "Đang học",
  completed: "Hoàn thành",
  failed: "Chưa đạt",
};

export const LESSON_TYPE_LABELS: Record<string, string> = {
  theory: "Lý thuyết",
  practical: "Thực hành",
  practice: "Thực hành",
  quiz: "Bài kiểm tra",
  assessment: "Đánh giá",
};

export const LESSON_QUIZ_OPTIONS = [
  "Tuân thủ đúng quy trình an toàn và thực hiện theo hướng dẫn chuẩn.",
  "Có thể bỏ qua một vài bước nếu đã quen công việc.",
  "Chỉ cần quan sát bằng mắt, không cần kiểm tra lại quy trình.",
  "Ưu tiên làm nhanh trước rồi bổ sung an toàn sau.",
];

export function getStatusLabel(status?: string | null) {
  if (!status) return "Chưa bắt đầu";
  return STATUS_LABELS[status] ?? status;
}

export function getLessonTypeLabel(type?: string | null) {
  if (!type) return "Bài học";
  return LESSON_TYPE_LABELS[type] ?? type;
}

export function formatSeconds(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const secs = String(safe % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
}

export function getLessonDurationSeconds(quizPrompts?: string[], quizQuestions?: LessonQuizQuestion[]) {
  const questionCount = Math.max(1, quizQuestions?.length ?? quizPrompts?.length ?? 0);
  return Math.max(90, questionCount * 45);
}

function buildFallbackQuizQuestions(lesson?: NormalizedLessonDetail | LessonDetail | null): LessonQuizQuestion[] {
  return (lesson?.quizPrompts ?? []).map((prompt, index) => ({
    id: `${lesson?.id}-quiz-${index + 1}`,
    prompt,
    options: LESSON_QUIZ_OPTIONS.map((text, optionIndex) => ({
      id: `${lesson?.id}-quiz-${index + 1}-option-${optionIndex + 1}`,
      text,
    })),
    correctAnswerIndex: 0,
    orderIndex: index + 1,
  }));
}

export function buildLessonQuestions(lesson?: NormalizedLessonDetail | LessonDetail | null) {
  const questions = lesson?.quizQuestions?.length
    ? [...lesson.quizQuestions].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    : buildFallbackQuizQuestions(lesson);

  return questions.map((question, index) => ({
    id: question.id,
    question: question.prompt,
    options: question.options.map((option) => option.text),
    correctAnswerIndex: question.correctAnswerIndex ?? 0,
    explanation: question.explanation,
    orderIndex: question.orderIndex ?? index + 1,
  }));
}

export function buildProgressFallback(
  modules: Module[],
  lessons: LessonSummary[],
  progressLessons: ProgressLesson[]
): ProgressLesson[] {
  const moduleOrderMap = new Map(modules.map((module) => [module.id, module.orderIndex]));
  const progressMap = new Map(progressLessons.map((item) => [item.lessonId, item]));
  let previousLessonCompleted = true;

  return [...lessons]
    .sort((a, b) => {
      const moduleOrderA = moduleOrderMap.get(a.moduleId) ?? 9999;
      const moduleOrderB = moduleOrderMap.get(b.moduleId) ?? 9999;
      if (moduleOrderA !== moduleOrderB) return moduleOrderA - moduleOrderB;
      return a.orderIndex - b.orderIndex;
    })
    .map((lesson) => {
      const existing = progressMap.get(lesson.id);
      const completed = existing?.status === "completed" || existing?.passed === true;
      const passed = existing?.passed ?? completed;
      const unlocked =
        typeof existing?.unlocked === "boolean" ? existing.unlocked : previousLessonCompleted;

      const normalized: ProgressLesson = {
        lessonId: lesson.id,
        moduleId: lesson.moduleId,
        lessonTitle: lesson.title,
        isRequired: lesson.isRequired,
        status: completed ? "completed" : existing?.status ?? "not_started",
        scorePercent: existing?.scorePercent ?? null,
        unlocked,
        passed,
      };

      if (!completed) previousLessonCompleted = false;
      return normalized;
    });
}

export function buildModulesWithFlow(
  modules: Module[],
  lessons: LessonSummary[],
  progressLessons: ProgressLesson[]
): EnrichedModule[] {
  const lessonMap = new Map<string, EnrichedLesson[]>();

  for (const lesson of lessons) {
    const progress = progressLessons.find((item) => item.lessonId === lesson.id);
    const entry: EnrichedLesson = {
      ...lesson,
      unlocked: progress?.unlocked ?? false,
      completed: progress?.status === "completed",
      passed: progress?.passed ?? false,
    };
    if (!lessonMap.has(lesson.moduleId)) lessonMap.set(lesson.moduleId, []);
    lessonMap.get(lesson.moduleId)!.push(entry);
  }

  for (const [key, value] of lessonMap.entries()) {
    lessonMap.set(key, [...value].sort((a, b) => a.orderIndex - b.orderIndex));
  }

  return modules.map((module) => {
    const moduleLessons = lessonMap.get(module.id) ?? [];
    const unlocked = moduleLessons.some((lesson) => lesson.unlocked) || moduleLessons.length === 0;
    const completed = moduleLessons.length > 0 && moduleLessons.every((lesson) => lesson.completed);
    return { ...module, lessons: moduleLessons, unlocked, completed };
  });
}

function normalizeResources(resources: LessonResource[]): LessonResource[] {
  return [...resources].sort((a, b) => a.orderIndex - b.orderIndex);
}

function normalizeSections(rawSections: LessonSection[]): LessonSection[] {
  return [...rawSections]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((section) => ({
      ...section,
      content: section.content ?? [],
      checklist: section.checklist ?? [],
      resources: normalizeResources(section.resources ?? []),
      examples: section.examples ?? [],
      isRequired: section.isRequired ?? true,
    }));
}

export function normalizeLessonDetail(lesson: LessonDetail): NormalizedLessonDetail {
  const sections = lesson.sections?.length
    ? normalizeSections(lesson.sections)
    : buildFallbackSections(lesson);

  const allResources = sections
    .flatMap((section) => section.resources.map((resource) => ({ ...resource, sectionId: section.id })))
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return {
    ...lesson,
    quizPrompts: lesson.quizPrompts ?? [],
    quizQuestions:
      lesson.quizQuestions?.length
        ? [...lesson.quizQuestions].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        : buildFallbackQuizQuestions(lesson),
    sections,
    allResources,
  };
}
