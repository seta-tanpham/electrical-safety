import React from "react";
import { Progress } from "../../components/ui/Progress";
import type { ProgressLesson } from "../../features/training/types";

type Props = {
  completionPercent: number;
  progressLessons: ProgressLesson[];
  totalLessons: number;
};

export default function LessonProgressCard({
  completionPercent,
  progressLessons,
  totalLessons,
}: Props) {
  const completedPercent = Math.round(
    (progressLessons.filter((item) => item.status === "completed").length / Math.max(1, totalLessons)) * 100
  );
  const unlockedPercent = Math.round(
    (progressLessons.filter((item) => item.unlocked).length / Math.max(1, totalLessons)) * 100
  );

  return (
    <section className="section-card">
      <div className="section-header compact">
        <div>
          <h3 className="section-title">Tiến độ học bài</h3>
          <p className="section-subtitle">Theo dõi tiến độ tổng thể và trạng thái mở khóa.</p>
        </div>
      </div>

      <div className="progress-card-grid">
        <div className="progress-metric">
          <div className="progress-row">
            <span>Tiến độ toàn khóa</span>
            <span>{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} />
        </div>

        <div className="progress-metric">
          <div className="progress-row">
            <span>Bài đã hoàn thành</span>
            <span>{completedPercent}%</span>
          </div>
          <Progress value={completedPercent} />
        </div>

        <div className="progress-metric">
          <div className="progress-row">
            <span>Bài đã mở khóa</span>
            <span>{unlockedPercent}%</span>
          </div>
          <Progress value={unlockedPercent} />
        </div>
      </div>
    </section>
  );
}
