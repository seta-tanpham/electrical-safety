import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import HeaderOverviewCard from "../components/learner/HeaderOverviewCard";
import LearningSidebarCard from "../components/learner/LearningSidebarCard";
import LessonProgressCard from "../components/learner/LessonProgressCard";
import LessonQuizCard from "../components/learner/LessonQuizCard";
import LessonReaderPanel from "../components/learner/LessonReaderPanel";
import LessonWorkspaceCard from "../components/learner/LessonWorkspaceCard";
import {
  buildEnrichedModules,
  buildProgressFallback,
} from "../features/training/helpers";
import {
  EnrichedModule,
  LessonAttempt,
  LessonDetail,
  LessonSummary,
  Module,
  OverviewCourse,
  ProgressLesson,
} from "../features/training/types";

const COURSE_ID = "electrical-safety-foundation";
const DEMO_USER_ID = "demo_user_001";
const PASS_SCORE = 75;

export default function LearnerPage() {
  const [course, setCourse] = useState<OverviewCourse | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [progressLessons, setProgressLessons] = useState<ProgressLesson[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [latestAttempt, setLatestAttempt] = useState<LessonAttempt | null>(null);
  const [quizVisible, setQuizVisible] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizTimeLeft, setQuizTimeLeft] = useState(0);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const visibleModules = useMemo<EnrichedModule[]>(() => {
    return buildEnrichedModules(modules, lessons, progressLessons);
  }, [modules, lessons, progressLessons]);

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
    } catch (err: any) {
      setError(err?.message || "Không tải được dữ liệu.");
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
      setSelectedSectionIndex(0);
      setCurrentLessonId(lessonId);
    } catch (err: any) {
      setError(err?.message || "Không tải được bài học.");
    } finally {
      setLoadingLesson(false);
    }
  }, []);

  useEffect(() => {
    void loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    if (currentLessonId) {
      void loadLesson(currentLessonId);
    }
  }, [currentLessonId, loadLesson]);

  const completionPercent = useMemo(() => {
    if (!course?.lessonCount) return 0;
    return Math.round(
      (progressLessons.filter((x) => x.status === "completed").length / course.lessonCount) * 100
    );
  }, [course, progressLessons]);

  const completedLessons = useMemo(() => {
    return progressLessons.filter((x) => x.status === "completed").length;
  }, [progressLessons]);

  if (loading) {
    return <div className="page-shell">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="page-shell">
      <HeaderOverviewCard
        course={course}
        enrollment={enrollment}
        completionPercent={completionPercent}
        completedLessons={completedLessons}
        onReload={() => void loadBaseData()}
        onEnroll={async () => {
          await api.enroll(COURSE_ID, DEMO_USER_ID);
          await loadBaseData();
        }}
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
            lessons={lessons}
            currentLessonId={currentLessonId}
            passScore={PASS_SCORE}
            completionPercent={completionPercent}
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
            onSubmit={async (payload, durationSeconds) => {
              const response = await api.submitLessonQuiz(
                COURSE_ID,
                lessonDetail!.id,
                DEMO_USER_ID,
                durationSeconds,
                payload
              );

              const attempt =
                response?.data?.attempt ??
                response?.data?.latestQuizAttempt ??
                response?.data ??
                null;

              setLatestAttempt(attempt);
              setEnrollment(response?.data?.enrollment ?? enrollment);
              await loadBaseData();
              if (currentLessonId) {
                await loadLesson(currentLessonId);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
