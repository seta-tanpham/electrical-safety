import React, { useMemo } from "react";
import type { EnrichedLesson, EnrichedModule, LessonSummary, Module, ProgressLesson } from "../../features/training/types";

type Props = {
  modules: Module[];
  lessons: LessonSummary[];
  progressLessons: ProgressLesson[];
  currentLessonId: string | null;
  onSelectLesson: (lessonId: string) => void;
};

export default function LearningSidebarCard({
  modules,
  lessons,
  progressLessons,
  currentLessonId,
  onSelectLesson,
}: Props) {
  const visibleModules = useMemo<EnrichedModule[]>(() => {
    const lessonMap = new Map<string, EnrichedLesson[]>();

    for (const lesson of lessons) {
      const progress = progressLessons.find((p) => p.lessonId === lesson.id);
      const enriched: EnrichedLesson = {
        ...lesson,
        unlocked: progress?.unlocked ?? false,
        completed: progress?.status === "completed",
        passed: progress?.passed ?? false,
      };

      if (!lessonMap.has(lesson.moduleId)) lessonMap.set(lesson.moduleId, []);
      lessonMap.get(lesson.moduleId)!.push(enriched);
    }

    return modules.map((module) => {
      const moduleLessons = (lessonMap.get(module.id) ?? []).sort((a, b) => a.orderIndex - b.orderIndex);
      return {
        ...module,
        lessons: moduleLessons,
        unlocked: moduleLessons.some((item) => item.unlocked) || moduleLessons.length === 0,
        completed: moduleLessons.length > 0 && moduleLessons.every((item) => item.completed),
      };
    });
  }, [modules, lessons, progressLessons]);

  return (
    <aside className="section-card sidebar-card">
      <div className="section-header">
        <div className="icon-circle">1</div>
        <div>
          <h3 className="section-title">Lộ trình học</h3>
          <p className="section-subtitle">Các bài học được mở khóa theo tiến độ hoàn thành.</p>
        </div>
      </div>

      <div className="module-stack">
        {visibleModules.map((module) => (
          <div key={module.id} className={`module-box ${module.completed ? "done" : ""}`}>
            <div className="module-box-head">
              <div>
                <div className="module-title">{module.title}</div>
                <div className="module-meta">{module.duration ?? "-"} • {module.lessonCount} bài học</div>
              </div>

              <span className={`status-pill ${module.completed ? "done" : module.unlocked ? "open" : "locked"}`}>
                {module.completed ? "Đã xong" : module.unlocked ? "Đang mở" : "Khóa"}
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
                  <div className="lesson-item-title">Bài {idx + 1}. {lesson.title}</div>
                  <div className="lesson-item-meta">
                    {lesson.completed ? "Đã hoàn thành" : lesson.unlocked ? "Đang mở" : "Đã khóa"}
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
