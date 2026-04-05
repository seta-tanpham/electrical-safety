import React, { useEffect, useMemo } from "react";
import { Clock3 } from "lucide-react";
import {
  buildLessonQuestions,
  formatSeconds,
  getLessonDurationSeconds,
} from "../../features/training/helpers";
import { LessonDetail, LessonAttempt } from "../../features/training/types";

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
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  passScore: number;
  onSubmit: (payload: { questionId: string; selectedOptionIndex: number }[], durationSeconds: number) => Promise<void>;
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
  onSubmit,
}: Props) {
  const questions = useMemo(() => buildLessonQuestions(lessonDetail), [lessonDetail]);

  useEffect(() => {
    if (!lessonDetail) return;
    setQuizTimeLeft(getLessonDurationSeconds(lessonDetail));
  }, [lessonDetail, setQuizTimeLeft]);

  useEffect(() => {
    if (!quizVisible || !lessonDetail) return;
    if (latestAttempt?.passed || latestAttempt?.submittedAt) return;
    if (quizTimeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setQuizTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [lessonDetail, quizVisible, quizTimeLeft, latestAttempt, setQuizTimeLeft]);

  async function handleSubmit() {
    if (!lessonDetail || !questions.length) return;

    setSubmitting(true);

    try {
      const payload = questions.map((question, index) => ({
        questionId: question.id,
        selectedOptionIndex: Number.isInteger(quizAnswers[index]) ? quizAnswers[index] : -1,
      }));

      const durationSeconds = getLessonDurationSeconds(lessonDetail) - quizTimeLeft;
      await onSubmit(payload, durationSeconds);
    } finally {
      setSubmitting(false);
    }
  }

  if (!lessonDetail) return null;

  return (
    <section className="section-card quiz-card">
      {!quizVisible ? (
        <div className="quiz-entry">
          <div>
            <div className="section-title">Bài kiểm tra cuối bài</div>
            <p className="section-subtitle">
              Sau khi học xong nội dung, bấm nút bên phải để bắt đầu làm bài kiểm tra có tính thời gian.
            </p>

            {latestAttempt && (
              <div className={`pill ${latestAttempt.passed ? "pill-success" : "pill-danger"}`}>
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
              <div className="section-title">Bài kiểm tra cuối bài</div>
              <p className="section-subtitle">
                Đạt từ {passScore}% để mở khóa bài học tiếp theo.
              </p>
            </div>

            <div className="pill pill-primary">
              <Clock3 size={14} />
              {formatSeconds(quizTimeLeft)}
            </div>
          </div>

          <div className="quiz-question-list">
            {questions.map((question, index) => (
              <div key={question.id} className="quiz-question-card">
                <div className="quiz-question-title">
                  {index + 1}. {question.question}
                </div>

                <div className="quiz-options">
                  {question.options.map((option, optionIndex) => {
                    const selected = quizAnswers[index] === optionIndex;
                    const locked = submitting || Boolean(latestAttempt?.passed);

                    return (
                      <button
                        key={option}
                        className={`quiz-option ${selected ? "selected" : ""}`}
                        disabled={locked}
                        onClick={() =>
                          setQuizAnswers((prev) => ({
                            ...prev,
                            [index]: optionIndex,
                          }))
                        }
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="quiz-actions">
            <button className="btn btn-primary" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? "Đang nộp..." : "Nộp bài kiểm tra"}
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                setQuizAnswers({});
                setQuizTimeLeft(getLessonDurationSeconds(lessonDetail));
              }}
              disabled={submitting}
            >
              Làm lại
            </button>

            <button className="btn btn-secondary" onClick={() => setQuizVisible(false)} disabled={submitting}>
              Ẩn bài kiểm tra
            </button>
          </div>

          {latestAttempt && (
            <div className={`attempt-box ${latestAttempt.passed ? "success" : "danger"}`}>
              <div className="pill-row">
                <span className={`pill ${latestAttempt.passed ? "pill-success" : "pill-danger"}`}>
                  {latestAttempt.passed ? "Pass" : "Chưa đạt"}
                </span>
                <span className="pill">
                  {latestAttempt.correctCount}/{latestAttempt.totalQuestions} câu đúng
                </span>
                <span className="pill">Điểm {latestAttempt.scorePercent}%</span>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
