import React from "react";
import { Progress } from "../ui/Progress";

type Props = {
  completionPercent: number;
  completedLessonPercent: number;
  openedLessonPercent: number;
};

export default function LessonProgressCard({
  completionPercent,
  completedLessonPercent,
  openedLessonPercent,
}: Props) {
  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Tiến độ học tập</h3>
          <p className="section-subtitle">Theo dõi tiến độ khóa học và mức độ mở khóa nội dung</p>
        </div>
      </div>

      <div className="progress-grid">
        <div className="progress-card">
          <div className="progress-label-row">
            <span>Tiến độ toàn khóa</span>
            <span>{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} />
        </div>

        <div className="progress-card">
          <div className="progress-label-row">
            <span>Bài đã hoàn thành</span>
            <span>{completedLessonPercent}%</span>
          </div>
          <Progress value={completedLessonPercent} />
        </div>

        <div className="progress-card">
          <div className="progress-label-row">
            <span>Bài đã mở khóa</span>
            <span>{openedLessonPercent}%</span>
          </div>
          <Progress value={openedLessonPercent} />
        </div>
      </div>
    </section>
  );
}
