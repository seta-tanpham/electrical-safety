import React from "react";
import { Progress } from "../../components/ui/Progress";

type Props = {
  completionPercent: number;
  progressLessons: any[];
  totalLessons: number;
};

export default function LessonProgressCard({
  completionPercent,
  progressLessons,
  totalLessons,
}: Props) {
  const completedPercent = Math.round(
    (progressLessons.filter((x: any) => x.status === "completed").length / Math.max(1, totalLessons)) * 100
  );

  const openedPercent = Math.round(
    (progressLessons.filter((x: any) => x.unlocked).length / Math.max(1, totalLessons)) * 100
  );

  return (
    <section className="section-card progress-card">
      <div className="section-title">Tiến độ học bài</div>

      <div className="progress-grid">
        <div>
          <div className="progress-row">
            <span>Tiến độ toàn khóa</span>
            <span>{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} />
        </div>

        <div>
          <div className="progress-row">
            <span>Bài đã hoàn thành</span>
            <span>{completedPercent}%</span>
          </div>
          <Progress value={completedPercent} />
        </div>

        <div>
          <div className="progress-row">
            <span>Bài đã mở khóa</span>
            <span>{openedPercent}%</span>
          </div>
          <Progress value={openedPercent} />
        </div>
      </div>
    </section>
  );
}
