import React, { useEffect, useMemo } from "react";
import { api } from "../../api/client";
import {
  buildLessonQuestions,
  COURSE_ID,
  DEMO_USER_ID,
  formatSeconds,
  getLessonDurationSeconds,
} from "../../features/training/helpers";
import type { LessonAttempt, LessonDetail } from "../../features/training/types";

type Props = {
  lessonDetail: LessonDetail | null;
  latestAttempt: LessonAttempt | null;
  quizVisible: boolean;
  setQuizVisible: (value: boolean) => void;
  quizAnswers: Record<number, number>;
  setQuizAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  quizTimeLeft: number;
  setQuizTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  submitting: boolean;
  setSubmitting: (value: boolean) => void;
  passScore: number;
  onSubmitted: () => Promise<void>;
};

export default function LessonQuizCard({
  lessonDetail,
  latestAttempt,
  quizVisible,
  setQuizVisible,
  quizAnswers,
  setQuizAnswers,
  quizTimeLeft,
  setQuizTimeLeft,
  submitting,
  setSubmitting,
  passScore,
  onSubmitted,
}: Props) {
  const lessonQuestions = useMemo(() => buildLessonQuestions(lessonDetail), [lessonDetail]);

  useEffect(() => {
    if (!lessonDetail || !quizVisible) return;
    if (latestAttempt?.passed || latestAttempt?.submittedAt) return;
    if (quizTimeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setQuizTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [lessonDetail, quizVisible, quizTimeLeft, latestAttempt, setQuizTimeLeft]);

  useEffect(() => {
    if (!quizVisible || quizTimeLeft > 0 || !lessonDetail || latestAttempt?.submittedAt) return;
    void handleSubmitQuiz(true);
  }, [quizVisible, quizTimeLeft, lessonDetail, latestAttempt]);

  async function handleSubmitQuiz(forcedTimeout = false) {
    if (!lessonDetail || !lessonQuestions.length) return;
    setSubmitting(true);

    try {
      const answers = lessonQuestions.map((question, index) => ({
        questionId: question.id,
        selectedOptionIndex: quizAnswers[index] ?? -1,
      }));

      await api.submitLessonQuiz(
        COURSE_ID,
        lessonDetail.id,
        DEMO_USER_ID,
        getLessonDurationSeconds(lessonDetail) - quizTimeLeft,
        answers
      );

      await onSubmitted();
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetryQuiz() {
    if (!lessonDetail) return;
    setQuizAnswers({});
    setQuizTimeLeft(getLessonDurationSeconds(lessonDetail));
  }

  if (!lessonDetail) return null;

  return (
    <section className="section-card">
      {!quizVisible ? (
        <div className="quiz-entry">
          <div>
            <div className="quiz-card-title">Bài kiểm tra cuối bài</div>
            <div className="quiz-card-subtitle">
              Sau khi học xong nội dung, học viên có thể bắt đầu làm bài kiểm tra.
            </div>
            {latestAttempt && (
              <div className={`status-pill ${latestAttempt.passed ? "done" : "locked"}`} style={{ marginTop: 10 }}>
                Lần gần nhất: {latestAttempt.scorePercent}% {latestAttempt.passed ? "• Đạt" : "• Chưa đạt"}
              </div>
            )}
          </div>

          <button className="btn btn-primary" onClick={() => setQuizVisible(true)}>
            Sẵn sàng làm bài kiểm tra
          </button>
        </div>
      ) : (
        <>
          <div className="quiz-topbar">
            <div>
              <div className="quiz-card-title">Bài kiểm tra cuối bài</div>
              <div className="quiz-card-subtitle">
                Đạt từ {passScore}% để mở khóa bài học tiếp theo.
              </div>
            </div>
            <div className="pill pill-primary">{formatSeconds(quizTimeLeft)}</div>
          </div>

          <div className="quiz-question-list">
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
            <button className="btn btn-primary" onClick={() => void handleSubmitQuiz()} disabled={submitting}>
              {submitting ? "Đang nộp..." : "Nộp bài kiểm tra"}
            </button>
            <button className="btn btn-secondary" onClick={handleRetryQuiz} disabled={submitting}>
              Làm lại
            </button>
            <button className="btn btn-secondary" onClick={() => setQuizVisible(false)} disabled={submitting}>
              Ẩn bài kiểm tra
            </button>
          </div>
        </>
      )}
    </section>
  );
}
