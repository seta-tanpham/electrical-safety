import React from "react";
import { BookOpen, FileText, ClipboardCheck } from "lucide-react";
import { getLessonTypeLabel } from "../../features/training/helpers";
import type { NormalizedLessonDetail } from "../../features/training/types";

type WorkspaceTab = "content" | "resources" | "quiz";

type Props = {
  lessonDetail: NormalizedLessonDetail | null;
  totalLessons: number;
  currentLessonIndex: number;
  completionPercent: number;
  passScore: number;
  loading: boolean;
  activeTab: WorkspaceTab;
  onChangeTab: (tab: WorkspaceTab) => void;
  canStartQuiz: boolean;
  completedRequiredSectionCount: number;
  totalRequiredSections: number;
  completedRequiredResourceCount: number;
  totalRequiredResources: number;
};

const tabs = [
  { id: "content", label: "Nội dung", icon: BookOpen },
  { id: "resources", label: "Học liệu", icon: FileText },
  { id: "quiz", label: "Bài kiểm tra", icon: ClipboardCheck },
] as const;

export default function LessonWorkspaceCard({
  lessonDetail,
  totalLessons,
  currentLessonIndex,
  completionPercent,
  passScore,
  loading,
  activeTab,
  onChangeTab,
  canStartQuiz,
  completedRequiredSectionCount,
  totalRequiredSections,
  completedRequiredResourceCount,
  totalRequiredResources,
}: Props) {
  if (loading) {
    return <section className="section-card">Đang tải bài học...</section>;
  }

  if (!lessonDetail) {
    return <section className="section-card">Chọn một bài học để bắt đầu.</section>;
  }

  return (
    <section className="section-card workspace-card">
      <div className="workspace-head">
        <div className="pill-row">
          <span className="pill pill-primary">Bài {currentLessonIndex}/{totalLessons}</span>
          {lessonDetail.moduleTitle && <span className="pill">{lessonDetail.moduleTitle}</span>}
          <span className="pill">{getLessonTypeLabel(lessonDetail.lessonType)}</span>
        </div>

        <div className="workspace-title-row">
          <div>
            <h2 className="workspace-title">{lessonDetail.title}</h2>
            <p className="workspace-subtitle">{lessonDetail.objective}</p>
          </div>

          <div className="workspace-meta-grid">
            <div className="summary-card compact-summary workspace-meta-card">
              <div className="summary-label">Yêu cầu pass</div>
              <div className="summary-value">{passScore}%</div>
            </div>

            <div className="summary-card compact-summary workspace-meta-card">
              <div className="summary-label">Tiến độ khóa học</div>
              <div className="summary-value">{completionPercent}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="workspace-strip-grid">
        <div className="workspace-strip-card">
          <div className="summary-label">Phần nội dung bắt buộc</div>
          <div className="workspace-strip-value">
            {completedRequiredSectionCount}/{totalRequiredSections}
          </div>
        </div>

        <div className="workspace-strip-card">
          <div className="summary-label">Học liệu bắt buộc</div>
          <div className="workspace-strip-value">
            {completedRequiredResourceCount}/{totalRequiredResources}
          </div>
        </div>

        <div className={`workspace-strip-card ${canStartQuiz ? "ready" : "locked"}`}>
          <div className="summary-label">Điều kiện làm bài kiểm tra</div>
          <div className="workspace-strip-text">
            {canStartQuiz ? "Đã sẵn sàng" : "Chưa hoàn thành đủ phần học bắt buộc"}
          </div>
        </div>
      </div>

      <div className="workspace-tabs" role="tablist" aria-label="Các chế độ học tập">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isQuizLocked = tab.id === "quiz" && !canStartQuiz;
          return (
            <button
              key={tab.id}
              type="button"
              className={`workspace-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => onChangeTab(tab.id)}
              aria-selected={activeTab === tab.id}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {isQuizLocked && <span className="workspace-tab-hint">Chưa sẵn sàng</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
