import React from "react";
import { getLessonTypeLabel } from "../../features/training/helpers";
import type { LessonDetail, LessonSummary } from "../../features/training/types";

type Props = {
  lessonDetail: LessonDetail | null;
  lessons: LessonSummary[];
  currentLessonId: string | null;
  passScore: number;
  loading: boolean;
};

export default function LessonWorkspaceCard({
  lessonDetail,
  lessons,
  currentLessonId,
  passScore,
  loading,
}: Props) {
  const lessonIndex = Math.max(1, lessons.findIndex((x) => x.id === currentLessonId) + 1);

  if (loading) {
    return <section className="section-card">Đang tải bài học...</section>;
  }

  if (!lessonDetail) {
    return <section className="section-card">Chọn một bài học để bắt đầu.</section>;
  }

  return (
    <section className="section-card workspace-card">
      <div className="pill-row">
        <span className="pill pill-primary">Bài {lessonIndex}/{lessons.length}</span>
        <span className="pill">{lessonDetail.moduleTitle ?? "Bài học"}</span>
        <span className="pill">{getLessonTypeLabel(lessonDetail.lessonType)}</span>
      </div>

      <h2 className="workspace-title">{lessonDetail.title}</h2>
      <p className="workspace-subtitle">{lessonDetail.objective ?? "Nội dung chi tiết bài học"}</p>

      <div className="workspace-meta-grid">
        <div className="summary-card">
          <div className="summary-label">Yêu cầu pass</div>
          <div className="summary-value">{passScore}%</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Thời gian test</div>
          <div className="summary-value">01:30</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Loại bài học</div>
          <div className="summary-value">{getLessonTypeLabel(lessonDetail.lessonType)}</div>
        </div>
      </div>
    </section>
  );
}
