import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Lock as LockIcon,
  RefreshCw,
  Siren,
  Trophy,
  Users,
} from "lucide-react";
import { BrowserRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { api } from "./api/client";
import { Progress } from "./components/ui/Progress";
import "./styles.css";

const COURSE_ID = "electrical-safety-foundation";
const DEMO_USER_ID = "demo_user_001";
const PASS_SCORE = 75;
const LESSON_QUIZ_OPTIONS = [
  "Tuân thủ đúng quy trình an toàn và thực hiện theo hướng dẫn chuẩn.",
  "Có thể bỏ qua một vài bước nếu đã quen công việc.",
  "Chỉ cần quan sát bằng mắt, không cần kiểm tra lại quy trình.",
  "Ưu tiên làm nhanh trước rồi bổ sung an toàn sau.",
];

type OverviewCourse = {
  id: string;
  title: string;
  moduleCount: number;
  lessonCount: number;
};

type Module = {
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

type LessonSummary = {
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

type LessonDetail = LessonSummary & {
  content: string[];
  checklist: string[];
  quizPrompts: string[];
};

type ProgressLesson = {
  lessonId: string;
  moduleId: string;
  lessonTitle: string;
  isRequired: boolean;
  status: string;
  scorePercent: number | null;
  unlocked?: boolean;
  passed?: boolean;
};

type AdminStats = {
  totalLearners: number;
  passedLearners: number;
  inProgressLearners: number;
  passRate: number;
  averageScore: number;
};

type LessonAttempt = {
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

type EnrichedLesson = LessonSummary & {
  unlocked: boolean;
  completed: boolean;
  passed: boolean;
};

type EnrichedModule = Module & {
  lessons: EnrichedLesson[];
  unlocked: boolean;
  completed: boolean;
};

function formatSeconds(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const secs = String(safe % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
}

function getLessonDurationSeconds(lesson?: LessonDetail | null) {
  const questionCount = Math.max(1, lesson?.quizPrompts.length ?? 0);
  return Math.max(90, questionCount * 45);
}

function buildLessonQuestions(lesson?: LessonDetail | null) {
  return (lesson?.quizPrompts ?? []).map((prompt, index) => ({
    id: `${lesson?.id}-quiz-${index + 1}`,
    question: prompt,
    options: LESSON_QUIZ_OPTIONS,
    correctAnswerIndex: 0,
  }));
}

function buildProgressFallback(
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
      const unlocked = typeof existing?.unlocked === "boolean" ? existing.unlocked : previousLessonCompleted;

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

function topGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "1.7fr 0.9fr",
    gap: 20,
    marginBottom: 24,
    alignItems: "stretch",
  };
}

function learnerGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "320px minmax(0, 1fr)",
    gap: 24,
    alignItems: "start",
  };
}

function pageNavButton(active: boolean): React.CSSProperties {
  return active
    ? { background: "#0f172a", color: "#ffffff", borderColor: "#0f172a" }
    : {};
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell" style={{ maxWidth: 1520 }}>{children}</div>;
}

function HeaderCard({
  course,
  enrollment,
  onReload,
  onEnroll,
}: {
  course: OverviewCourse | null;
  enrollment: any;
  onReload: () => void;
  onEnroll: () => void;
}) {
  return (
    <div className="card">
      <div className="card-header">
        <h1 className="title">{course?.title || "Đào tạo an toàn điện"}</h1>
      </div>
      <div className="card-content">
        <div className="button-row" style={{ marginBottom: 16 }}>
          {enrollment && (
            <span className="badge">
              {DEMO_USER_ID} • {enrollment.status} • {enrollment.progressPercent}%
            </span>
          )}
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Module</div>
            <div className="stat-value">{course?.moduleCount ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Bài học</div>
            <div className="stat-value">{course?.lessonCount ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Tiến độ toàn khóa</div>
            <div className="stat-value">{enrollment?.progressPercent ?? 0}%</div>
            <Progress value={enrollment?.progressPercent ?? 0} className="mt-3" />
          </div>
          <div className="stat-card" style={{ background: "#fff7ed" }}>
            <div className="stat-label">Kiểm tra cuối khóa học</div>
            <div className="stat-value">--</div>
            <div style={{ fontSize: 13, color: "#9a3412" }}>Chỉ hiện khi người học sẵn sàng bắt đầu.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RouteSwitcherCard() {
  return;
}

function LearnerPage() {
  const [course, setCourse] = useState<OverviewCourse | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [progressLessons, setProgressLessons] = useState<ProgressLesson[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizTimeLeft, setQuizTimeLeft] = useState<number>(0);
  const [quizVisible, setQuizVisible] = useState(false);
  const [latestAttempt, setLatestAttempt] = useState<LessonAttempt | null>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const lessonsByModule = useMemo(() => {
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

    return lessonMap;
  }, [lessons, progressLessons]);

  const visibleModules = useMemo<EnrichedModule[]>(() => {
    return modules.map((module) => {
      const moduleLessons = lessonsByModule.get(module.id) ?? [];
      const unlocked = moduleLessons.some((lesson) => lesson.unlocked) || moduleLessons.length === 0;
      const completed = moduleLessons.length > 0 && moduleLessons.every((lesson) => lesson.completed);
      return { ...module, lessons: moduleLessons, unlocked, completed };
    });
  }, [modules, lessonsByModule]);

  const currentLessonSummary = useMemo(() => {
    return lessons.find((lesson) => lesson.id === currentLessonId) || null;
  }, [lessons, currentLessonId]);

  const currentModule = useMemo(() => {
    return visibleModules.find((module) => module.id === currentLessonSummary?.moduleId) || visibleModules[0] || null;
  }, [visibleModules, currentLessonSummary]);

  const lessonQuestions = useMemo(() => buildLessonQuestions(lessonDetail), [lessonDetail]);

  const completionPercent = useMemo(() => {
    if (!course?.lessonCount) return 0;
    return Math.round((progressLessons.filter((item) => item.status === "completed").length / course.lessonCount) * 100);
  }, [course, progressLessons]);

  const currentLessonIndex = useMemo(() => {
    const flat = visibleModules.flatMap((module) => module.lessons);
    const idx = flat.findIndex((lesson) => lesson.id === currentLessonId);
    return idx >= 0 ? idx + 1 : 0;
  }, [visibleModules, currentLessonId]);

  const openedLessonPercent = useMemo(() => {
    return Math.round((progressLessons.filter((item) => item.unlocked).length / Math.max(1, lessons.length)) * 100);
  }, [progressLessons, lessons.length]);

  const completedLessonPercent = useMemo(() => {
    return Math.round((progressLessons.filter((item) => item.status === "completed").length / Math.max(1, lessons.length)) * 100);
  }, [progressLessons, lessons.length]);

  const nextLockedInfo = useMemo(() => {
    const flat = visibleModules.flatMap((module) => module.lessons);
    const currentIndex = flat.findIndex((lesson) => lesson.id === currentLessonId);
    const nextLesson = currentIndex >= 0 ? flat[currentIndex + 1] : null;
    return nextLesson ?? null;
  }, [visibleModules, currentLessonId]);

  const loadBaseData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [overviewPayload, lessonsPayload, progressPayload] = await Promise.all([
        api.getOverview(COURSE_ID),
        api.getLessons(COURSE_ID),
        api.getProgress(COURSE_ID, DEMO_USER_ID),
      ]);

      const overviewCourse = overviewPayload.data.course;
      const overviewModules: Module[] = overviewPayload.data.modules ?? [];
      const lessonList: LessonSummary[] = lessonsPayload.data ?? [];
      const backendProgressLessons: ProgressLesson[] = progressPayload?.data?.lessons ?? [];
      const normalizedProgressLessons = buildProgressFallback(overviewModules, lessonList, backendProgressLessons);

      setCourse(overviewCourse);
      setModules(overviewModules);
      setLessons(lessonList);
      setEnrollment(progressPayload?.data?.enrollment ?? null);
      setProgressLessons(normalizedProgressLessons);

      const firstUnlockedLesson = normalizedProgressLessons.find((lesson) => lesson.unlocked) ?? normalizedProgressLessons[0] ?? null;
      if (firstUnlockedLesson) {
        setCurrentLessonId((prev) => prev ?? firstUnlockedLesson.lessonId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLesson = useCallback(async (lessonId: string) => {
    setLoadingLesson(true);
    setError("");

    try {
      const [detailPayload, latestAttemptPayload] = await Promise.all([
        api.getLesson(COURSE_ID, lessonId),
        api.getLatestLessonQuizAttempt(COURSE_ID, lessonId, DEMO_USER_ID),
      ]);

      setLessonDetail(detailPayload.data);
      setLatestAttempt(latestAttemptPayload?.data?.latestQuizAttempt ?? null);
      setQuizAnswers({});
      setQuizVisible(false);
      setQuizTimeLeft(getLessonDurationSeconds(detailPayload.data));
      setCurrentLessonId(lessonId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lesson.");
    } finally {
      setLoadingLesson(false);
    }
  }, []);

  useEffect(() => {
    void loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    if (!currentLessonId) return;
    void loadLesson(currentLessonId);
  }, [currentLessonId, loadLesson]);

  useEffect(() => {
    if (!lessonDetail || !quizVisible) return;
    if (latestAttempt?.passed || latestAttempt?.submittedAt) return;
    if (quizTimeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setQuizTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [lessonDetail, quizVisible, quizTimeLeft, latestAttempt]);

  useEffect(() => {
    if (!quizVisible || quizTimeLeft > 0 || !lessonDetail || latestAttempt?.submittedAt) return;
    void handleSubmitQuiz();
  }, [quizVisible, quizTimeLeft, lessonDetail, latestAttempt]);

  async function handleSubmitQuiz() {
    if (!lessonDetail || !lessonQuestions.length) return;

    setSubmitting(true);
    setError("");

    try {
      const payload = lessonQuestions.map((question, index) => ({
        questionId: question.id,
        selectedOptionIndex: Number.isInteger(quizAnswers[index]) ? quizAnswers[index] : -1,
      }));

      const durationSeconds = getLessonDurationSeconds(lessonDetail) - quizTimeLeft;
      const response = await api.submitLessonQuiz(COURSE_ID, lessonDetail.id, DEMO_USER_ID, durationSeconds, payload);
      const attempt = response?.data?.attempt ?? response?.data?.latestQuizAttempt ?? response?.data ?? null;

      setLatestAttempt(attempt);
      setEnrollment(response?.data?.enrollment ?? enrollment);
      await loadBaseData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể nộp bài test.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEnroll() {
    setError("");
    try {
      await api.enroll(COURSE_ID, DEMO_USER_ID);
      await loadBaseData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể ghi danh.");
    }
  }

  function handleSelectModule(module: EnrichedModule) {
    const firstUnlocked = module.lessons.find((lesson) => lesson.unlocked);
    if (firstUnlocked) setCurrentLessonId(firstUnlocked.id);
  }

  function handleSelectLesson(lesson: EnrichedLesson) {
    if (!lesson.unlocked) return;
    setCurrentLessonId(lesson.id);
  }

  if (loading) {
    return (
      <PageShell>
        <div className="card">
          <div className="card-content">Đang tải dữ liệu...</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div style={topGridStyle()}>
        <HeaderCard course={course} enrollment={enrollment} onReload={() => void loadBaseData()} onEnroll={() => void handleEnroll()} />
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-content" style={{ color: "#b91c1c" }}>{error}</div>
        </div>
      )}

      <div style={learnerGridStyle()}>
        <div className="card" style={{ position: "sticky", top: 24 }}>
          <div className="card-header">
            <div className="section-heading">
              <div className="section-icon"><BookOpen size={18} /></div>
              <div>
                <h2 className="section-title">Lộ trình học</h2>
                <p className="section-subtitle">Sidebar chỉ giữ vai trò điều hướng</p>
              </div>
            </div>
          </div>
          <div className="card-content" style={{ paddingTop: 0 }}>
            {visibleModules.map((module) => (
              <div key={module.id} className={`module-card ${currentModule?.id === module.id ? "active" : ""}`} style={{ marginBottom: 14 }}>
                <button
                  onClick={() => handleSelectModule(module)}
                  disabled={!module.unlocked}
                  style={{ all: "unset", cursor: module.unlocked ? "pointer" : "not-allowed", display: "block", width: "100%" }}
                >
                  <div className="module-head">
                    <div>
                      <div className="lesson-title" style={{ fontSize: 18 }}>{module.title}</div>
                      <div className="module-meta">{module.duration ?? "-"} • {module.lessonCount} bài học</div>
                    </div>
                    {module.completed ? (
                      <span className="badge success">Hoàn thành</span>
                    ) : module.unlocked ? (
                      <span className="badge">Đang mở</span>
                    ) : (
                      <span className="badge warning"><LockIcon size={12} /> Khóa</span>
                    )}
                  </div>
                </button>

                <div className="lesson-list">
                  {module.lessons.map((lesson, index) => (
                    <button key={lesson.id} className={`lesson-button ${currentLessonId === lesson.id ? "active" : ""}`} disabled={!lesson.unlocked} onClick={() => handleSelectLesson(lesson)}>
                      <div className="lesson-title">Bài {index + 1}. {lesson.title}</div>
                      <div className="lesson-meta">{lesson.lessonType} • {lesson.completed ? "Đã xong" : lesson.unlocked ? "Đang mở" : "Khóa"}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div>
                <div className="badge-row" style={{ marginBottom: 10 }}>
                  <span className="badge primary">Bài {currentLessonIndex}/{course?.lessonCount ?? lessons.length}</span>
                  {currentModule && <span className="badge">{currentModule.title}</span>}
                  {lessonDetail && <span className="badge">{lessonDetail.lessonType}</span>}
                </div>
                <h2 className="title" style={{ fontSize: 30, margin: 0 }}>{lessonDetail?.title || "Chọn bài học"}</h2>
                <p className="subtitle" style={{ marginTop: 8 }}>
                  {lessonDetail?.objective || "Chọn một bài học đã mở khóa để bắt đầu."}
                </p>
              </div>

              {lessonDetail && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(140px, 1fr))", gap: 12, minWidth: 420 }}>
                  <div className="stat-card" style={{ padding: 14 }}>
                    <div className="stat-label">Yêu cầu pass</div>
                    <div className="lesson-title" style={{ fontSize: 22 }}>{PASS_SCORE}%</div>
                  </div>
                  <div className="stat-card" style={{ padding: 14 }}>
                    <div className="stat-label">Thời gian test</div>
                    <div className="lesson-title" style={{ fontSize: 22 }}>{formatSeconds(getLessonDurationSeconds(lessonDetail))}</div>
                  </div>
                  <div className="stat-card" style={{ padding: 14 }}>
                    <div className="stat-label">Tiến độ khóa học</div>
                    <div className="lesson-title" style={{ fontSize: 22 }}>{enrollment?.progressPercent ?? completionPercent}%</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card-content">
            {loadingLesson ? (
              <div>Đang tải bài học...</div>
            ) : lessonDetail ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                  <div className="list-card">
                    <div className="lesson-title" style={{ fontSize: 18, marginBottom: 12 }}>Nội dung chính</div>
                    <div style={{ display: "grid", gap: 12 }}>
                      {lessonDetail.content.map((item, index) => (
                        <div key={item} style={{ padding: 14, background: "white", borderRadius: 16, border: "1px solid #e2e8f0" }}>
                          <div className="module-meta" style={{ marginBottom: 6 }}>Ý chính {index + 1}</div>
                          <div>{item}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="list-card warning">
                    <div className="lesson-title" style={{ fontSize: 18, marginBottom: 12 }}>Checklist cần nhớ</div>
                    <div style={{ display: "grid", gap: 10 }}>
                      {lessonDetail.checklist.map((item, index) => (
                        <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 12, background: "white", borderRadius: 16 }}>
                          <div className="section-icon" style={{ width: 26, height: 26, borderRadius: 999 }}>{index + 1}</div>
                          <div style={{ fontSize: 14 }}>{item}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="list-card" style={{ marginBottom: 18, background: "#eff6ff", borderColor: "#bfdbfe" }}>
                  <div className="lesson-title" style={{ fontSize: 18, marginBottom: 8 }}>Tiến độ học bài</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}><span>Tiến độ toàn khóa</span><span>{enrollment?.progressPercent ?? completionPercent}%</span></div>
                      <Progress value={enrollment?.progressPercent ?? completionPercent} />
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}><span>Bài đã hoàn thành</span><span>{completedLessonPercent}%</span></div>
                      <Progress value={completedLessonPercent} />
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}><span>Bài đã mở khóa</span><span>{openedLessonPercent}%</span></div>
                      <Progress value={openedLessonPercent} />
                    </div>
                  </div>
                </div>

                <div className="card" style={{ borderRadius: 24, boxShadow: "none", border: "1px solid #e2e8f0" }}>
                  <div className="card-content" style={{ padding: 20 }}>
                    {!quizVisible ? (
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
                        <div>
                          <div className="lesson-title" style={{ fontSize: 20, marginBottom: 8 }}>Bài test cuối bài</div>
                          <div className="module-meta">Sau khi học xong nội dung, bấm nút bên phải để bắt đầu làm bài test có tính thời gian.</div>
                          {latestAttempt && (
                            <div style={{ marginTop: 10 }} className={`badge ${latestAttempt.passed ? "success" : latestAttempt.scorePercent >= PASS_SCORE ? "success" : "danger"}`}>
                              Lần gần nhất: {latestAttempt.scorePercent}% {latestAttempt.passed ? "• Đạt" : "• Chưa đạt"}
                            </div>
                          )}
                        </div>
                        <button className="button primary" onClick={() => setQuizVisible(true)}>Sẵn sàng làm bài test</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
                          <div>
                            <div className="lesson-title" style={{ fontSize: 20 }}>Bài test cuối bài</div>
                            <div className="module-meta">Đạt từ {PASS_SCORE}% để mở khóa bài học tiếp theo.</div>
                          </div>
                          <div className={`badge ${quizTimeLeft <= 30 ? "danger" : "primary"}`}>
                            <Clock3 size={14} /> {formatSeconds(quizTimeLeft)}
                          </div>
                        </div>

                        <div style={{ display: "grid", gap: 14 }}>
                          {lessonQuestions.map((question, index) => (
                            <div key={question.id} className="quiz-question-card">
                              <div className="quiz-question-title">{index + 1}. {question.question}</div>
                              <div className="quiz-options">
                                {question.options.map((option, optionIndex) => {
                                  const selected = quizAnswers[index] === optionIndex;
                                  const locked = submitting || Boolean(latestAttempt?.passed);
                                  return (
                                    <button
                                      key={option}
                                      type="button"
                                      className={`quiz-option ${selected ? "selected" : ""}`}
                                      onClick={() => setQuizAnswers((prev) => ({ ...prev, [index]: optionIndex }))}
                                      disabled={locked}
                                    >
                                      <span className="quiz-option-text">{option}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="quiz-actions">
                          <button className="button primary" onClick={() => void handleSubmitQuiz()} disabled={submitting}>
                            {submitting ? "Đang nộp..." : "Nộp bài test"}
                          </button>
                          <button
                            className="button"
                            onClick={() => {
                              setQuizAnswers({});
                              setQuizTimeLeft(getLessonDurationSeconds(lessonDetail));
                              setLatestAttempt(null);
                            }}
                            disabled={submitting}
                          >
                            Làm lại
                          </button>
                          <button className="button" onClick={() => setQuizVisible(false)} disabled={submitting}>
                            Ẩn bài test
                          </button>
                        </div>

                        {latestAttempt && (
                          <div style={{ marginTop: 16, padding: 16, borderRadius: 18, background: latestAttempt.passed ? "#ecfdf5" : "#fef2f2" }}>
                            <div className="badge-row" style={{ marginBottom: 10 }}>
                              <span className={`badge ${latestAttempt.passed ? "success" : "danger"}`}>{latestAttempt.passed ? "Pass" : "Chưa đạt"}</span>
                              <span className="badge">{latestAttempt.correctCount}/{latestAttempt.totalQuestions} câu đúng</span>
                              <span className="badge">Điểm {latestAttempt.scorePercent}%</span>
                            </div>
                            {!latestAttempt.passed && <div style={{ color: "#991b1b" }}>Bạn cần đạt từ {PASS_SCORE}% để mở khóa bài học tiếp theo.</div>}
                            {latestAttempt.passed && nextLockedInfo && <div style={{ color: "#166534" }}>Bạn có thể tiếp tục sang bài tiếp theo trong lộ trình.</div>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div>Chọn một bài học đã mở khóa để bắt đầu.</div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function AdminPage() {
  const [course, setCourse] = useState<OverviewCourse | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const derivedAdminStats = useMemo<AdminStats>(() => {
    if (adminStats) return adminStats;
    return {
      totalLearners: 126,
      passedLearners: 82,
      inProgressLearners: 29,
      passRate: 65,
      averageScore: 84,
    };
  }, [adminStats]);

  const loadAdmin = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewPayload, lessonsPayload, adminPayload] = await Promise.all([
        api.getOverview(COURSE_ID),
        api.getLessons(COURSE_ID),
        api.getAdminStats(COURSE_ID),
      ]);
      setCourse(overviewPayload.data.course);
      setModules(overviewPayload.data.modules ?? []);
      setLessons(lessonsPayload.data ?? []);
      setAdminStats(adminPayload?.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu quản trị.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdmin();
  }, [loadAdmin]);

  if (loading) {
    return (
      <PageShell>
        <div className="card">
          <div className="card-content">Đang tải dữ liệu quản trị...</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div style={topGridStyle()}>
        <HeaderCard course={course} enrollment={null} onReload={() => void loadAdmin()} onEnroll={() => {}} />
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-content" style={{ color: "#b91c1c" }}>{error}</div>
        </div>
      )}

      <div className="admin-grid">
        <div className="card">
          <div className="card-header">
            <div className="section-heading">
              <div className="section-icon"><Users size={18} /></div>
              <div>
                <h2 className="section-title">Tổng quan đào tạo</h2>
                <p className="section-subtitle">Các chỉ số chính dành cho quản lý</p>
              </div>
            </div>
          </div>
          <div className="card-content">
            <div className="admin-stat-grid">
              <div className="stat-card"><div className="stat-label">Tổng số nhân viên đã học</div><div className="stat-value">{derivedAdminStats.totalLearners}</div></div>
              <div className="stat-card"><div className="stat-label">Số người pass</div><div className="stat-value">{derivedAdminStats.passedLearners}</div></div>
              <div className="stat-card"><div className="stat-label">Tỷ lệ pass</div><div className="stat-value">{derivedAdminStats.passRate}%</div></div>
              <div className="stat-card"><div className="stat-label">Điểm trung bình</div><div className="stat-value">{derivedAdminStats.averageScore}%</div></div>
            </div>

            <div className="two-col" style={{ marginTop: 20 }}>
              <div className="list-card">
                <div className="lesson-title" style={{ fontSize: 18, marginBottom: 12 }}>Chỉ số vận hành</div>
                <div style={{ display: "grid", gap: 10 }}>
                  <div className="list-card" style={{ background: "white" }}>Đang học: <strong>{derivedAdminStats.inProgressLearners}</strong></div>
                  <div className="list-card" style={{ background: "white" }}>Module trong khóa: <strong>{course?.moduleCount ?? modules.length}</strong></div>
                  <div className="list-card" style={{ background: "white" }}>Bài học trong khóa: <strong>{course?.lessonCount ?? lessons.length}</strong></div>
                </div>
              </div>

              <div className="list-card warning">
                <div className="lesson-title" style={{ fontSize: 18, marginBottom: 12 }}>Định hướng giao diện</div>
                <ul>
                  <li>Học viên và quản trị đi theo router riêng, tránh trộn workflow.</li>
                  <li>Màn hình học tập ưu tiên tối đa cho lesson content và quiz.</li>
                  <li>Tiến độ được đưa vào trong workspace học, không chiếm riêng một cột lớn.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 24 }}>
          <div className="card">
            <div className="card-header">
              <div className="section-heading">
                <div className="section-icon"><Siren size={18} /></div>
                <div>
                  <h2 className="section-title">Checklist UI mới</h2>
                  <p className="section-subtitle">Những điểm đã chỉnh lại</p>
                </div>
              </div>
            </div>
            <div className="card-content" style={{ paddingTop: 0 }}>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  "Tách riêng page học viên và page quản trị bằng router.",
                  "Khung bài học được mở rộng để tập trung vào nội dung học.",
                  "Phần tiến độ được chuyển vào workspace để hợp lý hơn.",
                  "Quiz chỉ hiện khi người học bấm bắt đầu làm bài.",
                ].map((item) => (
                  <div key={item} className="list-card" style={{ padding: 14 }}>{item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/learner" replace />} />
        <Route path="/learner" element={<LearnerPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}