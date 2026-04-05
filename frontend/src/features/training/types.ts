export type OverviewCourse = {
  id: string;
  title: string;
  moduleCount: number;
  lessonCount: number;
};

export type Module = {
  id: string;
  title: string;
  summary: string | null;
  duration: string | null;
  level: string | null;
  iconKey: string | null;
  orderIndex: number;
  isRequired: boolean;
  lessonCount: number;
};

export type LessonSummary = {
  id: string;
  courseId: string;
  moduleId: string;
  moduleTitle?: string;
  title: string;
  objective: string | null;
  orderIndex: number;
  lessonType: string;
  isRequired: boolean;
};

export type LessonResourceType =
  | "video"
  | "pdf"
  | "image"
  | "document"
  | "download"
  | "external_link";

export type LessonResource = {
  id: string;
  type: LessonResourceType;
  title: string;
  description?: string;
  url?: string;
  previewUrl?: string;
  isRequired: boolean;
  sectionId?: string | null;
  orderIndex: number;
  durationLabel?: string;
  fileLabel?: string;
};

export type LessonSection = {
  id: string;
  title: string;
  summary: string;
  content: string[];
  checklist: string[];
  warning?: string;
  examples?: string[];
  isRequired: boolean;
  orderIndex: number;
  resources: LessonResource[];
};

export type LessonDetail = LessonSummary & {
  content?: string[];
  checklist?: string[];
  quizPrompts?: string[];
  sections?: LessonSection[];
};

export type ProgressLesson = {
  lessonId: string;
  moduleId: string;
  lessonTitle: string;
  isRequired: boolean;
  status: string;
  scorePercent: number | null;
  unlocked?: boolean;
  passed?: boolean;
};

export type LessonAttempt = {
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  durationSeconds?: number;
  submittedAt?: string;
  results?: Array<{
    questionId: string;
    selectedOptionIndex: number;
    correctAnswerIndex: number;
    isCorrect: boolean;
  }>;
};

export type EnrichedLesson = LessonSummary & {
  unlocked: boolean;
  completed: boolean;
  passed: boolean;
};

export type EnrichedModule = Module & {
  lessons: EnrichedLesson[];
  unlocked: boolean;
  completed: boolean;
};

export type AdminStats = {
  totalLearners: number;
  passedLearners: number;
  inProgressLearners: number;
  passRate: number;
  averageScore: number;
};

export type NormalizedLessonDetail = LessonSummary & {
  quizPrompts: string[];
  sections: LessonSection[];
  allResources: LessonResource[];
};
