import React from "react";
import { BookOpen, Lock as LockIcon } from "lucide-react";
import { EnrichedModule } from "../../features/training/types";

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
            Học theo lộ trình tuần tự, đọc tài liệu chi tiết và hoàn thành đánh giá cuối bài.
          </p>
        </div>
      </div>

      <div className="module-stack">
        {modules.map((module) => (
          <div key={module.id} className="module-box">
            <div className="module-box-head">
              <div>
                <div className="module-title">{module.title}</div>
                <div className="module-meta">
                  {module.duration ?? "-"} • {module.lessonCount} bài học
                </div>
              </div>
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
