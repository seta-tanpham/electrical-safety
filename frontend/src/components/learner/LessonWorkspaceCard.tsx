import React from "react";
import { getLessonTypeLabel } from "../../features/training/helpers";
import type { NormalizedLessonDetail } from "../../features/training/types";

type Props = {
  lessonDetail: NormalizedLessonDetail | null;
  totalLessons: number;
  currentLessonIndex: number;
  completionPercent: number;
  passScore: number;
  loading: boolean;
};

export default function LessonWorkspaceCard({
  lessonDetail,
  totalLessons,
  currentLessonIndex,
  completionPercent,
  passScore,
  loading,
}: Props) {
  if (loading) {
    return <section className="section-card">Đang tải bài học...</section>;
  }

  if (!lessonDetail) {
    return <section className="section-card">Chọn một bài học để bắt đầu.</section>;
  }

  return (
    <section className="section-card">
      <div className="workspace-head">
        <div className="pill-row">
          <span className="pill pill-primary">
            Bài {currentLessonIndex}/{totalLessons}
          </span>
          {lessonDetail.moduleTitle && <span className="pill">{lessonDetail.moduleTitle}</span>}
          <span className="pill">{getLessonTypeLabel(lessonDetail.lessonType)}</span>
        </div>

        <h2 className="workspace-title">{lessonDetail.title}</h2>
        <p className="workspace-subtitle">{lessonDetail.objective}</p>
      </div>

      <div className="workspace-meta-grid">
        <div className="summary-card">
          <div className="summary-label">Yêu cầu pass</div>
          <div className="summary-value">{passScore}%</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Ý chính</div>
          <div className="summary-value">{lessonDetail.sections.length}</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Tiến độ khóa học</div>
          <div className="summary-value">{completionPercent}%</div>
        </div>
      </div>
    </section>
  );
}
