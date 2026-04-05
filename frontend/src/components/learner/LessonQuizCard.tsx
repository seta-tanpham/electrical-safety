import React, { useEffect, useMemo, useState } from "react";
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
  onSubmit: (
    durationSeconds: number,
    answers: Array<{ questionId: string; selectedOptionIndex: number }>
  ) => Promise<void>;
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [lessonDetail?.id, quizVisible]);

  useEffect(() => {
    if (!quizVisible || !lessonDetail) return;
    if (latestAttempt?.passed || latestAttempt?.submittedAt) return;
    if (quizTimeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setQuizTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [quizVisible, lessonDetail, latestAttempt, quizTimeLeft, setQuizTimeLeft]);

  useEffect(() => {
    if (!quizVisible || quizTimeLeft > 0 || !lessonDetail || latestAttempt?.submittedAt) return;
    void handleSubmit();
  }, [quizVisible, quizTimeLeft, lessonDetail, latestAttempt]);

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

  const answeredCount = lessonQuestions.filter((_, index) => Number.isInteger(quizAnswers[index])).length;
  const currentQuestion = lessonQuestions[currentQuestionIndex] ?? null;
  const isLastQuestion = currentQuestionIndex === lessonQuestions.length - 1;

  return (
    <section className="section-card quiz-card-v2">
      {!quizVisible ? (
        <div className="quiz-entry">
          <div>
            <h3 className="section-title">Bài kiểm tra cuối bài</h3>
            <p className="section-subtitle">
              Bài kiểm tra chỉ hiển thị sau khi học viên đọc hết phần bắt buộc và mở các học liệu bắt buộc.
            </p>

            {!canStartQuiz && (
              <div className="inline-note warning">
                Cần hoàn thành phần nội dung và học liệu bắt buộc trước khi bắt đầu làm bài.
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
            Bắt đầu bài kiểm tra
          </button>
        </div>
      ) : (
        <>
          <div className="quiz-sticky-bar sticky-toolbar">
            <div>
              <div className="reader-toolbar-kicker">Bài kiểm tra cuối bài</div>
              <div className="reader-toolbar-title">{answeredCount}/{lessonQuestions.length} câu đã trả lời</div>
            </div>

            <div className="quiz-sticky-actions">
              <span className={`status-chip ${quizTimeLeft <= 30 ? "locked" : "open"}`}>
                <Clock3 size={14} />
                {formatSeconds(quizTimeLeft)}
              </span>
              <button className="btn btn-primary" disabled={submitting} onClick={() => void handleSubmit()}>
                {submitting ? "Đang nộp..." : "Nộp bài"}
              </button>
            </div>
          </div>

          {!canStartQuiz ? (
            <div className="quiz-locked-box">Cần hoàn thành phần học bắt buộc trước khi làm bài.</div>
          ) : currentQuestion ? (
            <>
              <div className="quiz-shell-v2">
                <aside className="quiz-navigator-v2">
                  <div className="reader-pane-header">
                    <h3 className="section-title">Điều hướng câu hỏi</h3>
                    <p className="section-subtitle">Chọn nhanh từng câu để trả lời</p>
                  </div>

                  <div className="quiz-nav-grid">
                    {lessonQuestions.map((question, index) => {
                      const answered = Number.isInteger(quizAnswers[index]);
                      const active = currentQuestionIndex === index;
                      return (
                        <button
                          key={question.id}
                          type="button"
                          className={`quiz-nav-item ${active ? "active" : ""} ${answered ? "answered" : ""}`}
                          onClick={() => setCurrentQuestionIndex(index)}
                        >
                          <span>Câu {index + 1}</span>
                          <small>{answered ? "Đã chọn" : "Chưa chọn"}</small>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <div className="quiz-question-focus">
                  <div className="quiz-question-card sticky-question-card">
                    <div className="quiz-question-title">Câu {currentQuestionIndex + 1}</div>
                    <div className="quiz-question-text">{currentQuestion.question}</div>

                    <div className="quiz-options">
                      {currentQuestion.options.map((option, optionIndex) => {
                        const selected = quizAnswers[currentQuestionIndex] === optionIndex;
                        const locked = submitting || Boolean(latestAttempt?.passed);
                        return (
                          <button
                            key={option}
                            type="button"
                            className={`quiz-option ${selected ? "selected" : ""}`}
                            onClick={() =>
                              setQuizAnswers((prev) => ({
                                ...prev,
                                [currentQuestionIndex]: optionIndex,
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

                  <div className="quiz-footer-actions">
                    <button
                      className="btn btn-secondary"
                      type="button"
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    >
                      Câu trước
                    </button>

                    {!isLastQuestion ? (
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => setCurrentQuestionIndex((prev) => Math.min(lessonQuestions.length - 1, prev + 1))}
                      >
                        Câu tiếp theo
                      </button>
                    ) : (
                      <button className="btn btn-primary" disabled={submitting} onClick={() => void handleSubmit()}>
                        {submitting ? "Đang nộp..." : "Hoàn tất và nộp bài"}
                      </button>
                    )}

                    <button className="btn btn-secondary" disabled={submitting} onClick={onRetry}>
                      Làm lại
                    </button>

                    <button className="btn btn-secondary" disabled={submitting} onClick={() => setQuizVisible(false)}>
                      Ẩn bài kiểm tra
                    </button>
                  </div>
                </div>
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
          ) : null}
        </>
      )}
    </section>
  );
}
