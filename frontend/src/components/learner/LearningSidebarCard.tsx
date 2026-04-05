import React from "react";
import { BookOpen, Lock as LockIcon } from "lucide-react";
import type { EnrichedModule } from "../../features/training/types";
import { getLessonTypeLabel } from "../../features/training/helpers";

type Props = {
  modules: EnrichedModule[];
  currentLessonId: string | null;
  onSelectLesson: (lessonId: string) => void;
};

export default function LearningSidebarCard({
  modules,
  currentLessonId,
  onSelectLesson,
}: Props) {
  return (
    <aside className="section-card sidebar-card">
      <div className="section-header">
        <div className="icon-circle">
          <BookOpen size={18} />
        </div>
        <div>
          <h3 className="section-title">Lộ trình học</h3>
          <p className="section-subtitle">
            Học theo lộ trình tuần tự, hoàn thành bài trước để mở khóa bài tiếp theo.
          </p>
        </div>
      </div>

      <div className="module-stack">
        {modules.map((module) => (
          <div key={module.id} className={`module-box ${module.unlocked ? "" : "disabled"}`}>
            <div className="module-box-head">
              <div>
                <div className="module-title">{module.title}</div>
                <div className="module-meta">
                  {module.duration ?? "-"} • {module.lessonCount} bài học
                </div>
              </div>
              <span className={`status-chip ${
                module.completed ? "success" : module.unlocked ? "open" : "locked"
              }`}>
                {module.completed ? "Hoàn thành" : module.unlocked ? "Đang mở" : "Đã khóa"}
              </span>
            </div>

            <div className="lesson-stack">
              {module.lessons.map((lesson, idx) => (
                <button
                  key={lesson.id}
                  className={`lesson-item ${currentLessonId === lesson.id ? "active" : ""}`}
                  disabled={!lesson.unlocked}
                  onClick={() => onSelectLesson(lesson.id)}
                >
                  <div className="lesson-item-title">
                    Bài {idx + 1}. {lesson.title}
                  </div>
                  <div className="lesson-item-meta">
                    {getLessonTypeLabel(lesson.lessonType)} •{" "}
                    {lesson.completed ? "Đã hoàn thành" : lesson.unlocked ? "Đang mở" : "Đã khóa"}
                    {!lesson.unlocked && <LockIcon size={12} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
