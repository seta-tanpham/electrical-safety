import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api/client";
import "./styles.css";

const COURSE_ID = "electrical-safety-foundation";
const DEMO_USER_ID = "demo_user_001";
const LESSON_QUIZ_OPTIONS = [
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

function getStatusLabel(status?: string | null) {
  if (!status) return "Chưa bắt đầu";
  return STATUS_LABELS[status] ?? status;
}

function getLessonTypeLabel(type?: string | null) {
  if (!type) return "Bài học";
  return LESSON_TYPE_LABELS[type] ?? type;
}

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

export default function App() {
  const [activeTab, setActiveTab] = useState<"hoc-vien" | "quan-tri">("hoc-vien");
  const [course, setCourse] = useState<OverviewCourse | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [resources, setResources] = useState<{ incidents: any[]; rescueSteps: any[] }>({ incidents: [], rescueSteps: [] });
  const [progressLessons, setProgressLessons] = useState<ProgressLesson[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizTimeLeft, setQuizTimeLeft] = useState<number>(0);
  const [latestAttempt, setLatestAttempt] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const lessonsByModule = useMemo(() => {
    const lessonMap = new Map<string, (LessonSummary & { unlocked?: boolean; completed?: boolean; passed?: boolean })[]>();
    for (const lesson of lessons) {
      const progress = progressLessons.find((item) => item.lessonId === lesson.id);
      const entry = {
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

  const visibleModules = useMemo(() => {
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

  async function loadBaseData() {
    setLoading(true);
    setError("");
    try {
      const [overviewPayload, lessonsPayload, resourcesPayload, progressPayload, adminPayload] = await Promise.all([
        api.getOverview(COURSE_ID),
        api.getLessons(COURSE_ID),
        api.getResources(COURSE_ID),
        api.getProgress(COURSE_ID, DEMO_USER_ID),
        api.getAdminStats(COURSE_ID),
      ]);

      const courseData = overviewPayload.data.course;
      const moduleData = overviewPayload.data.modules ?? [];
      const lessonData = lessonsPayload.data ?? [];
      const backendProgress = progressPayload?.data?.lessons ?? [];
      const normalizedProgress = buildProgressFallback(moduleData, lessonData, backendProgress);

      setCourse(courseData);
      setModules(moduleData);
      setLessons(lessonData);
      setResources({
        incidents: resourcesPayload.data.incidents ?? [],
        rescueSteps: resourcesPayload.data.rescueSteps ?? [],
      });
      setEnrollment(progressPayload?.data?.enrollment ?? null);
      setProgressLessons(normalizedProgress);
      setAdminStats(adminPayload?.data ?? null);

      const firstUnlocked = normalizedProgress.find((lesson) => lesson.unlocked) ?? normalizedProgress[0] ?? null;
      if (firstUnlocked) {
        setCurrentLessonId((prev) => prev ?? firstUnlocked.lessonId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  }

  async function loadLesson(lessonId: string) {
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
      setQuizTimeLeft(getLessonDurationSeconds(detailPayload.data));
      setCurrentLessonId(lessonId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được bài học.");
    } finally {
      setLoadingLesson(false);
    }
  }

  useEffect(() => {
    void loadBaseData();
  }, []);

  useEffect(() => {
    if (!currentLessonId) return;
    void loadLesson(currentLessonId);
  }, [currentLessonId]);

  useEffect(() => {
    if (!lessonDetail) return;
    if (latestAttempt?.passed) return;
    if (quizTimeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setQuizTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lessonDetail, quizTimeLeft, latestAttempt]);

  useEffect(() => {
    if (!lessonDetail || latestAttempt?.passed) return;
    if (quizTimeLeft !== 0) return;
    void handleSubmitQuiz(true);
  }, [quizTimeLeft]);

  const completionPercent = useMemo(() => {
    if (!course?.lessonCount) return 0;
    const completedCount = progressLessons.filter((lesson) => lesson.status === "completed").length;
    return Math.round((completedCount / course.lessonCount) * 100);
  }, [progressLessons, course]);

  async function handleEnroll() {
    try {
      const payload = await api.enroll(COURSE_ID, DEMO_USER_ID);
      setEnrollment(payload.data);
      await loadBaseData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể ghi danh.");
    }
  }

  async function handleSubmitQuiz(forcedTimeout = false) {
    if (!lessonDetail || !lessonQuestions.length) return;
    setSubmitting(true);
    setError("");
    try {
      const answers = lessonQuestions.map((question, index) => ({
        questionId: question.id,
        selectedOptionIndex: quizAnswers[index] ?? -1,
      }));
      const payload = await api.submitLessonQuiz(
        COURSE_ID,
        lessonDetail.id,
        DEMO_USER_ID,
        getLessonDurationSeconds(lessonDetail) - quizTimeLeft,
        answers
      );
      setLatestAttempt({
        ...payload.data.attempt,
        forcedTimeout,
      });
      setEnrollment(payload.data.enrollment);
      await loadBaseData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể nộp bài kiểm tra.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetryQuiz() {
    if (!lessonDetail) return;
    setLatestAttempt(null);
    setQuizAnswers({});
    setQuizTimeLeft(getLessonDurationSeconds(lessonDetail));
  }

  function getRecommendation() {
    if (!currentModule) return "Đề xuất sẽ hiển thị sau khi chọn bài học.";
    if (currentModule.id === "m1") return "Tiếp theo nên học: Dòng điện tác động lên cơ thể người.";
    if (currentModule.id === "m2") return "Tiếp theo nên học: Yếu tố làm tăng mức độ nguy hiểm.";
    if (currentModule.id === "m3") return "Tiếp theo nên học: Điện áp tiếp xúc và điện áp bước.";
    if (currentModule.id === "m4") return "Tiếp theo nên học: Biện pháp bảo vệ khi làm việc với mạng điện.";
    return "Tiếp theo nên học: Cấp cứu người bị điện giật.";
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div className="card center-loading">Đang tải dữ liệu từ API...</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="top-grid">
        <div className="card hero-card-compact">
          <div className="card-content compact-header-content">
            <div className="badge-row compact-badges">
              <span className="badge primary">Đào tạo bắt buộc</span>
              <span className="badge">An toàn điện</span>
            </div>

            <div className="button-row compact-actions">
              <button className="button" onClick={() => void loadBaseData()}>Tải lại dữ liệu</button>
              <button className="button primary" onClick={() => void handleEnroll()}>Ghi danh học viên demo</button>
              {enrollment && <span className="badge">{DEMO_USER_ID} • {getStatusLabel(enrollment.status)} • {enrollment.progressPercent}%</span>}
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="stat-grid compact-stat-grid">
              <div className="stat-card compact-stat-card">
                <div className="stat-label">Module</div>
                <div className="stat-value">{course?.moduleCount ?? modules.length}</div>
              </div>
              <div className="stat-card compact-stat-card">
                <div className="stat-label">Bài học</div>
                <div className="stat-value">{course?.lessonCount ?? lessons.length}</div>
              </div>
              <div className="stat-card compact-stat-card">
                <div className="stat-label">Tiến độ toàn khóa</div>
                <div className="stat-value">{enrollment?.progressPercent ?? completionPercent}%</div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${enrollment?.progressPercent ?? completionPercent}%` }} /></div>
              </div>
              <div className="stat-card compact-stat-card warm-stat">
                <div className="stat-label">Đánh giá cuối bài</div>
                <div className="stat-value">--</div>
                <div className="small-note warm-note">Hiển thị khi học viên bắt đầu.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card compact-side-card">
          <div className="card-header">
            <div className="section-title">Chế độ xem</div>
            <p className="section-subtitle">Chuyển giữa giao diện học viên và quản trị.</p>
          </div>
          <div className="card-content">
            <div className="tabs">
              <button className={`tab-button ${activeTab === "hoc-vien" ? "active" : ""}`} onClick={() => setActiveTab("hoc-vien")}>Học viên</button>
              <button className={`tab-button ${activeTab === "quan-tri" ? "active" : ""}`} onClick={() => setActiveTab("quan-tri")}>Quản trị</button>
            </div>
            <div className="muted-box" style={{ marginTop: 16 }}>
              {activeTab === "hoc-vien"
                ? "Học theo lộ trình tuần tự. Pass bài kiểm tra để mở khóa nội dung tiếp theo."
                : "Theo dõi tổng số học viên, số người đạt và tỷ lệ hoàn thành."}
            </div>
          </div>
        </div>
      </div>

      {activeTab === "hoc-vien" ? (
        <div className="page-grid">
          <div>
            <div className="card">
              <div className="card-header">
                <div className="section-heading">
                  <div className="section-icon">1</div>
                  <div>
                    <h2 className="section-title">Lộ trình học tuần tự</h2>
                    <p className="section-subtitle">Bài học được mở khóa theo tiến độ hoàn thành từ backend.</p>
                  </div>
                </div>
              </div>
              <div className="card-content" style={{ display: "grid", gap: 16 }}>
                {visibleModules.map((module) => (
                  <div key={module.id} className={`module-card ${currentModule?.id === module.id ? "active" : ""}`}>
                    <div className="module-head">
                      <div>
                        <div style={{ fontWeight: 700 }}>{module.title}</div>
                        <div className="module-meta">{module.duration} • {module.level} • {module.lessons.length} bài học</div>
                      </div>
                      <span className={`badge ${module.completed ? "success" : module.unlocked ? "" : "warning"}`}>
                        {module.completed ? "Đã hoàn thành" : module.unlocked ? "Đang mở" : "Đã khóa"}
                      </span>
                    </div>
                    <div className="lesson-list">
                      {module.lessons.map((lesson, index) => (
                        <button
                          key={lesson.id}
                          className={`lesson-button ${currentLessonId === lesson.id ? "active" : ""}`}
                          disabled={!lesson.unlocked}
                          onClick={() => setCurrentLessonId(lesson.id)}
                        >
                          <div className="lesson-title">Bài {index + 1}. {lesson.title}</div>
                          <div className="lesson-meta">
                            {getLessonTypeLabel(lesson.lessonType)} • {lesson.passed ? "Đã đạt" : lesson.unlocked ? "Đang mở" : "Đã khóa"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
              <div className="card-header">
                <div className="section-heading">
                  <div className="section-icon">!</div>
                  <div>
                    <h2 className="section-title">Tình huống rủi ro</h2>
                    <p className="section-subtitle">Tình huống thực tế hỗ trợ cho quá trình học.</p>
                  </div>
                </div>
              </div>
              <div className="card-content" style={{ display: "grid", gap: 12 }}>
                {resources.incidents.map((incident) => (
                  <div key={incident.id} className="list-card">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <strong>{incident.title}</strong>
                      <span className={`badge ${incident.severity === "Cao" ? "danger" : ""}`}>{incident.severity}</span>
                    </div>
                    <div className="small-note" style={{ marginTop: 6 }}>{incident.status}</div>
                    <div style={{ marginTop: 8 }}>{incident.lesson}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-header">
                <div className="section-heading">
                  <div className="section-icon">2</div>
                  <div>
                    <h2 className="section-title">{lessonDetail?.title ?? "Chọn bài học"}</h2>
                    <p className="section-subtitle">{lessonDetail?.objective ?? "Chi tiết bài học sẽ hiển thị sau khi chọn."}</p>
                  </div>
                </div>
              </div>
              <div className="card-content">
                {loadingLesson ? (
                  <div className="muted-box">Đang tải bài học...</div>
                ) : lessonDetail ? (
                  <>
                    <div className="badge-row" style={{ marginBottom: 16 }}>
                      <span className="badge">{getLessonTypeLabel(lessonDetail.lessonType)}</span>
                      <span className="badge">{currentModule?.title}</span>
                      {progressLessons.find((item) => item.lessonId === lessonDetail.id)?.passed && (
                        <span className="badge success">Đã đạt</span>
                      )}
                    </div>

                    <div className="two-col">
                      <div className="list-card">
                        <strong>Nội dung bài học</strong>
                        <ul style={{ marginTop: 10 }}>
                          {lessonDetail.content.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                      <div className="list-card warning">
                        <strong>Checklist cần ghi nhớ</strong>
                        <ul style={{ marginTop: 10 }}>
                          {lessonDetail.checklist.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                    </div>

                    <div className="quiz-card">
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 18 }}>Bài kiểm tra cuối bài</div>
                          <div className="small-note">Đạt từ 75% để mở khóa bài tiếp theo.</div>
                        </div>
                        <span className={`badge ${quizTimeLeft <= 30 ? "danger" : ""}`}>⏱ {formatSeconds(quizTimeLeft)}</span>
                      </div>

                      {lessonQuestions.map((question, index) => (
                        <div key={question.id} className="quiz-question">
                          <div style={{ fontWeight: 600 }}>{index + 1}. {question.question}</div>
                          <div className="quiz-options">
                            {question.options.map((option, optionIndex) => (
                              <button
                                key={option}
                                className={`quiz-option ${quizAnswers[index] === optionIndex ? "selected" : ""}`}
                                disabled={Boolean(latestAttempt?.passed)}
                                onClick={() => setQuizAnswers((prev) => ({ ...prev, [index]: optionIndex }))}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="button-row" style={{ marginTop: 14 }}>
                        <button className="button primary" disabled={submitting || Boolean(latestAttempt?.passed)} onClick={() => void handleSubmitQuiz(false)}>
                          {submitting ? "Đang nộp..." : "Nộp bài kiểm tra"}
                        </button>
                        <button className="button" onClick={handleRetryQuiz}>Làm lại</button>
                        <span className="badge">Đã trả lời {Object.keys(quizAnswers).length}/{lessonQuestions.length}</span>
                      </div>

                      {latestAttempt && (
                        <div className={`result-panel ${latestAttempt.passed ? "" : "fail"}`} style={{ marginTop: 16 }}>
                          <div className="badge-row">
                            <span className="badge primary">Kết quả</span>
                            <span className={`badge ${latestAttempt.passed ? "success" : "danger"}`}>{latestAttempt.passed ? "Đạt" : "Chưa đạt"}</span>
                          </div>
                          <div className="result-grid">
                            <div className="result-tile">
                              <div className="stat-label">Điểm</div>
                              <div className="stat-value">{latestAttempt.scorePercent}%</div>
                            </div>
                            <div className="result-tile">
                              <div className="stat-label">Đúng</div>
                              <div className="stat-value">{latestAttempt.correctCount}/{latestAttempt.totalQuestions}</div>
                            </div>
                            <div className="result-tile">
                              <div className="stat-label">Thời gian</div>
                              <div className="stat-value">{formatSeconds(latestAttempt.durationSeconds ?? 0)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="list-card warning" style={{ marginTop: 20 }}>
                      <strong>Gợi ý cá nhân hóa</strong>
                      <div style={{ marginTop: 8 }}>{getRecommendation()}</div>
                    </div>
                  </>
                ) : (
                  <div className="muted-box">Chọn một bài học đã mở khóa để bắt đầu.</div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-header">
                <div className="section-heading">
                  <div className="section-icon">3</div>
                  <div>
                    <h2 className="section-title">Quy trình cứu nạn nhanh</h2>
                    <p className="section-subtitle">Cheat sheet hỗ trợ trong quá trình học.</p>
                  </div>
                </div>
              </div>
              <div className="card-content" style={{ display: "grid", gap: 12 }}>
                {resources.rescueSteps.map((step, index) => (
                  <div key={step.id} className="timeline-step">
                    <div className="step-index">{index + 1}</div>
                    <div>{step.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
              <div className="card-header">
                <div className="section-heading">
                  <div className="section-icon">✓</div>
                  <div>
                    <h2 className="section-title">Tiến độ cá nhân</h2>
                    <p className="section-subtitle">Theo dõi kết quả học và trạng thái mở khóa.</p>
                  </div>
                </div>
              </div>
              <div className="card-content">
                {[
                  ["Tiến độ toàn khóa", enrollment?.progressPercent ?? completionPercent],
                  ["Bài học đã hoàn thành", course?.lessonCount ? Math.round((progressLessons.filter((item) => item.status === "completed").length / course.lessonCount) * 100) : 0],
                  ["Bài học đã mở khóa", course?.lessonCount ? Math.round((progressLessons.filter((item) => item.unlocked).length / course.lessonCount) * 100) : 0],
                  ["Tỷ lệ đạt bài kiểm tra", progressLessons.length ? Math.round((progressLessons.filter((item) => item.passed).length / progressLessons.length) * 100) : 0],
                ].map(([label, value]) => (
                  <div key={String(label)} className="metric-item">
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                      <span>{label}</span>
                      <span className="small-note">{value}%</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${value}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-grid">
          <div className="card">
            <div className="card-header">
              <div className="section-heading">
                <div className="section-icon">A</div>
                <div>
                  <h2 className="section-title">Bảng điều khiển quản trị</h2>
                  <p className="section-subtitle">Theo dõi tổng số học viên, số người đạt và tỷ lệ hoàn thành.</p>
                </div>
              </div>
            </div>
            <div className="card-content">
              <div className="admin-stat-grid">
                <div className="stat-card"><div className="stat-label">Tổng số nhân viên đã học</div><div className="stat-value">{adminStats?.totalLearners ?? 0}</div></div>
                <div className="stat-card"><div className="stat-label">Số người đạt</div><div className="stat-value">{adminStats?.passedLearners ?? 0}</div></div>
                <div className="stat-card"><div className="stat-label">Tỷ lệ đạt</div><div className="stat-value">{adminStats?.passRate ?? 0}%</div></div>
                <div className="stat-card"><div className="stat-label">Điểm trung bình</div><div className="stat-value">{adminStats?.averageScore ?? 0}%</div></div>
              </div>

              <div className="two-col" style={{ marginTop: 18 }}>
                <div className="list-card">
                  <strong>Chỉ số vận hành</strong>
                  <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                    <div className="timeline-step"><div className="step-index">1</div><div>Đang học: <strong>{adminStats?.inProgressLearners ?? 0}</strong></div></div>
                    <div className="timeline-step"><div className="step-index">2</div><div>Module trong khóa: <strong>{course?.moduleCount ?? modules.length}</strong></div></div>
                    <div className="timeline-step"><div className="step-index">3</div><div>Bài học trong khóa: <strong>{course?.lessonCount ?? lessons.length}</strong></div></div>
                    <div className="timeline-step"><div className="step-index">4</div><div>Demo user hoàn thành khóa: <strong>{enrollment?.status === "completed" ? "Đạt" : "Chưa đạt"}</strong></div></div>
                  </div>
                </div>
                <div className="list-card warning">
                  <strong>Nhận định dashboard</strong>
                  <ul style={{ marginTop: 10 }}>
                    <li>Luồng học tuần tự giúp giảm việc bỏ sót bài học nền tảng.</li>
                    <li>Bài kiểm tra cuối mỗi bài tạo checkpoint đánh giá rõ ràng.</li>
                    <li>Dashboard quản lý tập trung vào tổng số người học, số người đạt và tỷ lệ hoàn thành.</li>
                    <li>Backend đang tính các chỉ số này từ enrollments và lesson quiz attempts.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-header">
                <div className="section-heading">
                  <div className="section-icon">i</div>
                  <div>
                    <h2 className="section-title">Checklist luồng mới</h2>
                    <p className="section-subtitle">Các thay đổi nghiệp vụ đã được áp dụng.</p>
                  </div>
                </div>
              </div>
              <div className="card-content" style={{ display: "grid", gap: 12 }}>
                {[
                  "Học viên phải đi theo thứ tự từng bài học.",
                  "Cuối mỗi bài có bài kiểm tra tính thời gian và nộp riêng.",
                  "Chỉ khi đạt bài kiểm tra mới được mở khóa bài tiếp theo.",
                  "Dashboard quản lý hiển thị tổng học viên, số người đạt và tỷ lệ hoàn thành.",
                ].map((item, index) => (
                  <div key={item} className="timeline-step">
                    <div className="step-index">{index + 1}</div>
                    <div>{item}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
