import type {
  LessonDetail,
  LessonSection,
  LessonSummary,
  Module,
  ProgressLesson,
} from "./types";

export const COURSE_ID = "electrical-safety-foundation";
export const DEMO_USER_ID = "demo_user_001";
export const PASS_SCORE = 75;

export const LESSON_QUIZ_OPTIONS = [
  "Tuân thủ đúng quy trình an toàn và thực hiện theo hướng dẫn chuẩn.",
  "Có thể bỏ qua một vài bước nếu đã quen công việc.",
  "Chỉ cần quan sát bằng mắt, không cần kiểm tra lại quy trình.",
  "Ưu tiên làm nhanh trước rồi bổ sung an toàn sau.",
];

const STATUS_LABELS: Record<string, string> = {
  not_started: "Chưa bắt đầu",
  in_progress: "Đang học",
  completed: "Hoàn thành",
  failed: "Chưa đạt",
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  theory: "Lý thuyết",
  practical: "Thực hành",
  practice: "Thực hành",
  quiz: "Bài kiểm tra",
  assessment: "Đánh giá",
};

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

export function getLessonDurationSeconds(lesson?: LessonDetail | null) {
  const questionCount = Math.max(1, lesson?.quizPrompts.length ?? 0);
  return Math.max(90, questionCount * 45);
}

export function buildLessonQuestions(lesson?: LessonDetail | null) {
  return (lesson?.quizPrompts ?? []).map((prompt, index) => ({
    id: `${lesson?.id}-quiz-${index + 1}`,
    question: prompt,
    options: LESSON_QUIZ_OPTIONS,
    correctAnswerIndex: 0,
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

export function buildDetailedSections(lesson?: LessonDetail | null): LessonSection[] {
  if (!lesson) return [];

  return (lesson.content ?? []).map((item, index) => {
    const relatedChecklist = (lesson.checklist ?? []).slice(index, index + 2);
    const fallbackChecklist =
      relatedChecklist.length > 0 ? relatedChecklist : (lesson.checklist ?? []).slice(0, 2);

    return {
      id: `${lesson.id}-section-${index + 1}`,
      navTitle: `Ý chính ${index + 1}`,
      summary: item,
      details: [
        `${item} Đây là nội dung trọng tâm cần được hiểu theo nghĩa thực hành, không chỉ đọc lướt ở mức ghi nhớ.`,
        lesson.objective
          ? `Mục tiêu của phần này là kết nối trực tiếp với mục tiêu bài học: ${lesson.objective}`
          : "Người học cần biến nội dung này thành hành động kiểm soát rủi ro khi làm việc với thiết bị điện.",
        "Khi triển khai tại hiện trường, người học cần biết mình phải kiểm tra gì, xác nhận gì và dừng ở điểm nào nếu điều kiện an toàn chưa được đảm bảo.",
      ],
      fieldGuide: [
        `Đối chiếu nội dung "${item}" với bối cảnh công việc thực tế trước khi thao tác.`,
        "Xác nhận điều kiện an toàn, tình trạng thiết bị và trách nhiệm của người thực hiện.",
        "Nếu có điểm chưa rõ, báo lại người phụ trách thay vì tự suy đoán hoặc bỏ qua bước kiểm soát.",
      ],
      warning:
        "Sai lầm thường gặp là hiểu khái niệm đúng nhưng không chuyển nó thành hành vi an toàn cụ thể tại hiện trường.",
      relatedChecklist: fallbackChecklist,
    };
  });
}
