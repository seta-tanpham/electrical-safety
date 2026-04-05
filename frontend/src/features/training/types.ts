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

export type LessonDetail = LessonSummary & {
  content: string[];
  checklist: string[];
  quizPrompts: string[];
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

export type AdminStats = {
  totalLearners: number;
  passedLearners: number;
  inProgressLearners: number;
  passRate: number;
  averageScore: number;
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

export type LessonSection = {
  id: string;
  navTitle: string;
  summary: string;
  details: string[];
  fieldGuide: string[];
  warning: string;
  relatedChecklist: string[];
};

export type LessonQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
};
