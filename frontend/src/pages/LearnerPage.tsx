import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import HeaderOverviewCard from "../components/learner/HeaderOverviewCard";
import LearningSidebarCard from "../components/learner/LearningSidebarCard";
import LessonProgressCard from "../components/learner/LessonProgressCard";
import LessonQuizCard from "../components/learner/LessonQuizCard";
import LessonReaderPanel from "../components/learner/LessonReaderPanel";
import LessonWorkspaceCard from "../components/learner/LessonWorkspaceCard";
import {
  buildProgressFallback,
  COURSE_ID,
  DEMO_USER_ID,
  getLessonDurationSeconds,
  PASS_SCORE,
} from "../features/training/helpers";
import type { LessonAttempt, LessonDetail, LessonSummary, Module, OverviewCourse, ProgressLesson } from "../features/training/types";

export default function LearnerPage() {
  const [course, setCourse] = useState<OverviewCourse | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [progressLessons, setProgressLessons] = useState<ProgressLesson[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [enrollment, setEnrollment] = useState<{ status?: string; progressPercent?: number } | null>(null);
  const [latestAttempt, setLatestAttempt] = useState<LessonAttempt | null>(null);
  const [quizVisible, setQuizVisible] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizTimeLeft, setQuizTimeLeft] = useState(0);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const completionPercent = useMemo(() => {
    if (!course?.lessonCount) return 0;
    return Math.round(
      (progressLessons.filter((item) => item.status === "completed").length / course.lessonCount) * 100
    );
  }, [course, progressLessons]);

  const completedLessonsCount = useMemo(
    () => progressLessons.filter((item) => item.status === "completed").length,
    [progressLessons]
  );

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

      const firstUnlockedLesson =
        normalizedProgressLessons.find((lesson) => lesson.unlocked) ??
        normalizedProgressLessons[0] ??
        null;

      if (firstUnlockedLesson) {
        setCurrentLessonId((prev) => prev ?? firstUnlockedLesson.lessonId);
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

      setLessonDetail(detailPayload.data);
      setLatestAttempt(latestAttemptPayload?.data?.latestQuizAttempt ?? null);
      setQuizVisible(false);
      setQuizAnswers({});
      setQuizTimeLeft(getLessonDurationSeconds(detailPayload.data));
      setSelectedSectionIndex(0);
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

  async function handleEnroll() {
    try {
      await api.enroll(COURSE_ID, DEMO_USER_ID);
      await loadBaseData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể ghi danh.");
    }
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
      />

      {error && <div className="error-box">{error}</div>}

      <div className="learner-layout">
        <LearningSidebarCard
          modules={modules}
          lessons={lessons}
          progressLessons={progressLessons}
          currentLessonId={currentLessonId}
          onSelectLesson={setCurrentLessonId}
        />

        <div className="workspace-stack">
          <LessonWorkspaceCard
            lessonDetail={lessonDetail}
            lessons={lessons}
            currentLessonId={currentLessonId}
            passScore={PASS_SCORE}
            loading={loadingLesson}
          />

          <LessonReaderPanel
            lessonDetail={lessonDetail}
            selectedSectionIndex={selectedSectionIndex}
            onSelectSection={setSelectedSectionIndex}
          />

          <LessonProgressCard
            completionPercent={completionPercent}
            progressLessons={progressLessons}
            totalLessons={lessons.length}
          />

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
            setSubmitting={setSubmitting}
            passScore={PASS_SCORE}
            onSubmitted={async () => {
              await loadBaseData();
              if (currentLessonId) await loadLesson(currentLessonId);
            }}
          />
        </div>
      </div>
    </div>
  );
}
