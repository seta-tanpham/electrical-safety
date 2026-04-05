import React, { useCallback, useEffect, useMemo, useState } from "react";
import HeaderOverviewCard from "../components/learner/HeaderOverviewCard";
import LearningSidebarCard from "../components/learner/LearningSidebarCard";
import LessonProgressCard from "../components/learner/LessonProgressCard";
import LessonQuizCard from "../components/learner/LessonQuizCard";
import LessonReaderPanel from "../components/learner/LessonReaderPanel";
import LessonWorkspaceCard from "../components/learner/LessonWorkspaceCard";
import LearningResourcesPanel from "../components/learner/LearningResourcesPanel";
import { api } from "../api/client";
import {
  buildModulesWithFlow,
  buildProgressFallback,
  getLessonDurationSeconds,
  normalizeLessonDetail,
} from "../features/training/helpers";
import type {
  LessonAttempt,
  LessonSummary,
  Module,
  NormalizedLessonDetail,
  OverviewCourse,
  ProgressLesson,
} from "../features/training/types";

const COURSE_ID = "electrical-safety-foundation";
const DEMO_USER_ID = "demo_user_001";
const PASS_SCORE = 75;

type CompletionState = {
  completedSectionIds: string[];
  completedResourceIds: string[];
};

type WorkspaceTab = "content" | "resources" | "quiz";

function getStorageKey(lessonId: string) {
  return `learning_workspace_state:${DEMO_USER_ID}:${lessonId}`;
}

function loadCompletionState(lessonId: string): CompletionState {
  if (typeof window === "undefined") {
    return { completedSectionIds: [], completedResourceIds: [] };
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(lessonId));
    if (!raw) return { completedSectionIds: [], completedResourceIds: [] };
    return JSON.parse(raw);
  } catch {
    return { completedSectionIds: [], completedResourceIds: [] };
  }
}

function saveCompletionState(lessonId: string, state: CompletionState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(lessonId), JSON.stringify(state));
}

export default function LearnerPage() {
  const [course, setCourse] = useState<OverviewCourse | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [progressLessons, setProgressLessons] = useState<ProgressLesson[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [lessonDetail, setLessonDetail] = useState<NormalizedLessonDetail | null>(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [completedSectionIds, setCompletedSectionIds] = useState<string[]>([]);
  const [completedResourceIds, setCompletedResourceIds] = useState<string[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizTimeLeft, setQuizTimeLeft] = useState<number>(0);
  const [quizVisible, setQuizVisible] = useState(false);
  const [latestAttempt, setLatestAttempt] = useState<LessonAttempt | null>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("content");

  const visibleModules = useMemo(
    () => buildModulesWithFlow(modules, lessons, progressLessons),
    [modules, lessons, progressLessons]
  );

  const completionPercent = useMemo(() => {
    if (!course?.lessonCount) return 0;
    const completedCount = progressLessons.filter((item) => item.status === "completed").length;
    return Math.round((completedCount / course.lessonCount) * 100);
  }, [course, progressLessons]);

  const completedLessonPercent = useMemo(() => {
    return Math.round(
      (progressLessons.filter((item) => item.status === "completed").length /
        Math.max(1, lessons.length)) *
        100
    );
  }, [progressLessons, lessons.length]);

  const openedLessonPercent = useMemo(() => {
    return Math.round(
      (progressLessons.filter((item) => item.unlocked).length / Math.max(1, lessons.length)) * 100
    );
  }, [progressLessons, lessons.length]);

  const currentLessonIndex = useMemo(() => {
    const flat = visibleModules.flatMap((module) => module.lessons);
    const idx = flat.findIndex((lesson) => lesson.id === currentLessonId);
    return idx >= 0 ? idx + 1 : 0;
  }, [visibleModules, currentLessonId]);

  const completedLessonsCount = useMemo(
    () => progressLessons.filter((item) => item.status === "completed").length,
    [progressLessons]
  );

  const requiredSections = useMemo(
    () => (lessonDetail?.sections ?? []).filter((section) => section.isRequired).map((section) => section.id),
    [lessonDetail]
  );

  const requiredResources = useMemo(
    () => (lessonDetail?.allResources ?? []).filter((resource) => resource.isRequired).map((resource) => resource.id),
    [lessonDetail]
  );

  const completedRequiredSectionCount = useMemo(
    () => requiredSections.filter((id) => completedSectionIds.includes(id)).length,
    [requiredSections, completedSectionIds]
  );

  const completedRequiredResourceCount = useMemo(
    () => requiredResources.filter((id) => completedResourceIds.includes(id)).length,
    [requiredResources, completedResourceIds]
  );

  const canStartQuiz = useMemo(() => {
    if (!lessonDetail) return false;
    const sectionsCompleted = requiredSections.every((id) => completedSectionIds.includes(id));
    const resourcesCompleted = requiredResources.every((id) => completedResourceIds.includes(id));
    return sectionsCompleted && resourcesCompleted;
  }, [lessonDetail, requiredSections, requiredResources, completedSectionIds, completedResourceIds]);

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
      const normalizedProgressLessons = buildProgressFallback(
        overviewModules,
        lessonList,
        backendProgressLessons
      );

      setCourse(overviewCourse);
      setModules(overviewModules);
      setLessons(lessonList);
      setEnrollment(progressPayload?.data?.enrollment ?? null);
      setProgressLessons(normalizedProgressLessons);

      const firstUnlocked =
        normalizedProgressLessons.find((lesson) => lesson.unlocked) ??
        normalizedProgressLessons[0] ??
        null;

      if (firstUnlocked) {
        setCurrentLessonId((prev) => prev ?? firstUnlocked.lessonId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
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

      const normalizedLesson = normalizeLessonDetail(detailPayload.data);
      const savedState = loadCompletionState(lessonId);

      setLessonDetail(normalizedLesson);
      setLatestAttempt(latestAttemptPayload?.data?.latestQuizAttempt ?? null);
      setSelectedSectionIndex(0);
      setCompletedSectionIds(savedState.completedSectionIds);
      setCompletedResourceIds(savedState.completedResourceIds);
      setQuizAnswers({});
      setQuizVisible(false);
      setQuizTimeLeft(getLessonDurationSeconds(normalizedLesson.quizPrompts));
      setCurrentLessonId(lessonId);
      setActiveTab("content");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được bài học.");
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
    if (!currentLessonId) return;
    saveCompletionState(currentLessonId, { completedSectionIds, completedResourceIds });
  }, [currentLessonId, completedSectionIds, completedResourceIds]);

  async function handleEnroll() {
    try {
      const payload = await api.enroll(COURSE_ID, DEMO_USER_ID);
      setEnrollment(payload.data);
      await loadBaseData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể ghi danh.");
    }
  }

  async function handleQuizSubmit(
    durationSeconds: number,
    answers: Array<{ questionId: string; selectedOptionIndex: number }>
  ) {
    if (!lessonDetail) return;
    setSubmitting(true);
    setError("");

    try {
      const payload = await api.submitLessonQuiz(
        COURSE_ID,
        lessonDetail.id,
        DEMO_USER_ID,
        durationSeconds,
        answers
      );

      setLatestAttempt(payload.data.attempt ?? null);
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
    setQuizTimeLeft(getLessonDurationSeconds(lessonDetail.quizPrompts));
  }

  function markSectionComplete(sectionId: string) {
    setCompletedSectionIds((prev) => Array.from(new Set([...prev, sectionId])));
  }

  function markResourceComplete(resourceId: string) {
    setCompletedResourceIds((prev) => Array.from(new Set([...prev, resourceId])));
  }

  if (loading) {
    return <div className="page-shell">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="page-shell">
      <HeaderOverviewCard
        course={course}
        enrollment={enrollment}
        completionPercent={completionPercent}
        completedLessons={completedLessonsCount}
        onReload={() => void loadBaseData()}
        onEnroll={() => void handleEnroll()}
        demoUserId={DEMO_USER_ID}
      />

      {error && <div className="error-box">{error}</div>}

      <div className="learner-layout">
        <LearningSidebarCard
          modules={visibleModules}
          currentLessonId={currentLessonId}
          onSelectLesson={setCurrentLessonId}
        />

        <div className="workspace-stack">
          <LessonWorkspaceCard
            lessonDetail={lessonDetail}
            totalLessons={lessons.length}
            currentLessonIndex={currentLessonIndex}
            completionPercent={completionPercent}
            passScore={PASS_SCORE}
            loading={loadingLesson}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            canStartQuiz={canStartQuiz}
            completedRequiredSectionCount={completedRequiredSectionCount}
            totalRequiredSections={requiredSections.length}
            completedRequiredResourceCount={completedRequiredResourceCount}
            totalRequiredResources={requiredResources.length}
          />

          {activeTab === "content" && (
            <LessonReaderPanel
              lessonDetail={lessonDetail}
              selectedSectionIndex={selectedSectionIndex}
              onSelectSection={setSelectedSectionIndex}
              completedSectionIds={completedSectionIds}
              onCompleteSection={markSectionComplete}
            />
          )}

          {activeTab === "resources" && (
            <LearningResourcesPanel
              lessonDetail={lessonDetail}
              completedResourceIds={completedResourceIds}
              onCompleteResource={markResourceComplete}
            />
          )}

          {activeTab === "quiz" && (
            <LessonQuizCard
              lessonDetail={lessonDetail}
              latestAttempt={latestAttempt}
              quizVisible={quizVisible}
              setQuizVisible={setQuizVisible}
              quizAnswers={quizAnswers}
              setQuizAnswers={setQuizAnswers}
              quizTimeLeft={quizTimeLeft}
              setQuizTimeLeft={setQuizTimeLeft}
              submitting={submitting}
              canStartQuiz={canStartQuiz}
              passScore={PASS_SCORE}
              onSubmit={handleQuizSubmit}
              onRetry={handleRetryQuiz}
            />
          )}

          <LessonProgressCard
            completionPercent={completionPercent}
            completedLessonPercent={completedLessonPercent}
            openedLessonPercent={openedLessonPercent}
          />
        </div>
      </div>
    </div>
  );
}
