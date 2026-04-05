import React, { useEffect, useMemo } from "react";
import { Clock3 } from "lucide-react";
import { buildLessonQuestions, formatSeconds, getLessonDurationSeconds } from "../../features/training/helpers";
import type { LessonAttempt, NormalizedLessonDetail } from "../../features/training/types";

type Props = {
  lessonDetail: NormalizedLessonDetail | null;
  latestAttempt: LessonAttempt | null;
  quizVisible: boolean;
  setQuizVisible: (value: boolean) => void;
  quizAnswers: Record<number, number>;
  setQuizAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  quizTimeLeft: number;
  setQuizTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  submitting: boolean;
  canStartQuiz: boolean;
  passScore: number;
  onSubmit: (durationSeconds: number, answers: Array<{ questionId: string; selectedOptionIndex: number }>) => Promise<void>;
  onRetry: () => void;
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
  canStartQuiz,
  passScore,
  onSubmit,
  onRetry,
}: Props) {
  const lessonQuestions = useMemo(() => buildLessonQuestions(lessonDetail), [lessonDetail]);

  useEffect(() => {
    if (!quizVisible || !lessonDetail) return;
    if (latestAttempt?.passed || latestAttempt?.submittedAt) return;
    if (quizTimeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setQuizTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [quizVisible, lessonDetail, latestAttempt, quizTimeLeft, setQuizTimeLeft]);

  async function handleSubmit() {
    if (!lessonDetail) return;
    const answers = lessonQuestions.map((question, index) => ({
      questionId: question.id,
      selectedOptionIndex: Number.isInteger(quizAnswers[index]) ? quizAnswers[index] : -1,
    }));
    const durationSeconds = getLessonDurationSeconds(lessonDetail.quizPrompts) - quizTimeLeft;
    await onSubmit(durationSeconds, answers);
  }

  if (!lessonDetail) return null;

  return (
    <section className="section-card">
      {!quizVisible ? (
        <div className="quiz-entry">
          <div>
            <h3 className="section-title">Bài kiểm tra cuối bài</h3>
            <p className="section-subtitle">
              Bài kiểm tra chỉ hiển thị sau khi học viên đọc hết các phần bắt buộc và mở các học liệu bắt buộc.
            </p>

            {!canStartQuiz && (
              <div className="inline-note warning">
                Cần hoàn thành phần nội dung bắt buộc trước khi bắt đầu làm bài.
              </div>
            )}

            {canStartQuiz && latestAttempt && (
              <div className={`inline-note ${latestAttempt.passed ? "success" : "danger"}`}>
                Lần gần nhất: {latestAttempt.scorePercent}% {latestAttempt.passed ? "• Đạt" : "• Chưa đạt"}
              </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            disabled={!canStartQuiz}
            onClick={() => {
              setQuizVisible(true);
              setQuizTimeLeft(getLessonDurationSeconds(lessonDetail.quizPrompts));
            }}
          >
            Sẵn sàng làm bài kiểm tra
          </button>
        </div>
      ) : (
        <>
          <div className="quiz-topbar">
            <div>
              <h3 className="section-title">Bài kiểm tra cuối bài</h3>
              <p className="section-subtitle">Đạt từ {passScore}% để mở khóa bài học tiếp theo.</p>
            </div>

            <div className={`status-chip ${quizTimeLeft <= 30 ? "locked" : "open"}`}>
              <Clock3 size={14} />
              {formatSeconds(quizTimeLeft)}
            </div>
          </div>

          <div className="quiz-question-list">
            {lessonQuestions.map((question, index) => (
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
                        type="button"
                        className={`quiz-option ${selected ? "selected" : ""}`}
                        onClick={() =>
                          setQuizAnswers((prev) => ({
                            ...prev,
                            [index]: optionIndex,
                          }))
                        }
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
            <button className="btn btn-primary" disabled={submitting} onClick={() => void handleSubmit()}>
              {submitting ? "Đang nộp..." : "Nộp bài kiểm tra"}
            </button>
            <button className="btn btn-secondary" disabled={submitting} onClick={onRetry}>
              Làm lại
            </button>
            <button className="btn btn-secondary" disabled={submitting} onClick={() => setQuizVisible(false)}>
              Ẩn bài kiểm tra
            </button>
          </div>

          {latestAttempt && (
            <div className={`attempt-box ${latestAttempt.passed ? "success" : "danger"}`}>
              <div className="pill-row">
                <span className={`status-chip ${latestAttempt.passed ? "success" : "locked"}`}>
                  {latestAttempt.passed ? "Đạt" : "Chưa đạt"}
                </span>
                <span className="status-chip open">
                  {latestAttempt.correctCount}/{latestAttempt.totalQuestions} câu đúng
                </span>
                <span className="status-chip open">Điểm {latestAttempt.scorePercent}%</span>
              </div>

              <div className="attempt-text">
                {latestAttempt.passed
                  ? "Bạn có thể tiếp tục sang bài tiếp theo trong lộ trình."
                  : `Bạn cần đạt từ ${passScore}% để mở khóa bài học tiếp theo.`}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
