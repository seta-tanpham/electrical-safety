import React from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import type { NormalizedLessonDetail } from "../../features/training/types";

type Props = {
  lessonDetail: NormalizedLessonDetail | null;
  selectedSectionIndex: number;
  onSelectSection: (index: number) => void;
  completedSectionIds: string[];
  onCompleteSection: (sectionId: string) => void;
};

export default function LessonReaderPanel({
  lessonDetail,
  selectedSectionIndex,
  onSelectSection,
  completedSectionIds,
  onCompleteSection,
}: Props) {
  const activeSection = lessonDetail?.sections[selectedSectionIndex] ?? null;
  const sectionCount = lessonDetail?.sections.length ?? 0;

  if (!lessonDetail || !activeSection) {
    return <section className="section-card">Chưa có nội dung bài học.</section>;
  }

  const isCompleted = completedSectionIds.includes(activeSection.id);

  return (
    <section className="section-card reader-card reader-card-polished">
      <div className="reader-layout-v2 reader-layout-polished">
        <aside className="reader-outline-v2 reader-outline-polished">
          <div className="reader-pane-header">
            <div>
              <h3 className="section-title">Mục lục bài học</h3>
              <p className="section-subtitle">Mỗi lần chỉ tập trung một phần để học sâu hơn</p>
            </div>
          </div>

          <div className="reader-outline-list-v2">
            {lessonDetail.sections.map((section, index) => {
              const completed = completedSectionIds.includes(section.id);
              return (
                <button
                  key={section.id}
                  type="button"
                  className={`reader-outline-item-v2 ${selectedSectionIndex === index ? "active" : ""}`}
                  onClick={() => onSelectSection(index)}
                >
                  <div className="reader-outline-index-v2">{String(index + 1).padStart(2, "0")}</div>
                  <div className="reader-outline-content-v2">
                    <div className="reader-outline-title-v2">{section.title}</div>
                    <div className="reader-outline-summary-v2">{section.summary}</div>
                  </div>
                  {completed && <CheckCircle2 size={16} />}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="reader-document-v2 reader-document-polished">
          <div className="reader-toolbar sticky-toolbar reader-toolbar-polished">
            <div>
              <div className="reader-toolbar-kicker">
                Phần {selectedSectionIndex + 1}/{sectionCount}
              </div>
              <div className="reader-toolbar-title">{activeSection.title}</div>
            </div>

            <div className="reader-toolbar-actions">
              <button
                className="btn btn-secondary"
                type="button"
                disabled={selectedSectionIndex === 0}
                onClick={() => onSelectSection(Math.max(0, selectedSectionIndex - 1))}
              >
                <ChevronLeft size={16} />
                Phần trước
              </button>

              <button
                className="btn btn-secondary"
                type="button"
                disabled={selectedSectionIndex === sectionCount - 1}
                onClick={() => onSelectSection(Math.min(sectionCount - 1, selectedSectionIndex + 1))}
              >
                Phần tiếp theo
                <ChevronRight size={16} />
              </button>

              <button className="btn btn-primary" type="button" onClick={() => onCompleteSection(activeSection.id)}>
                {isCompleted ? "Đã đọc" : "Đánh dấu đã đọc"}
              </button>
            </div>
          </div>

          <div className="reader-document-body reader-document-body-polished">
            <div className="reader-document-title-v2">{activeSection.summary}</div>

            <div className="reader-section-block-v2">
              <div className="reader-section-title-v2">Giải thích chi tiết</div>
              <div className="reader-paragraphs-v2">
                {activeSection.content.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            {(activeSection.examples?.length ?? 0) > 0 && (
              <div className="reader-section-grid-v2">
                <div className="reader-surface-box polished-surface-box">
                  <div className="reader-section-title-v2">Ví dụ thực tế</div>
                  <ul className="reader-list-v2">
                    {(activeSection.examples ?? []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="reader-surface-box warning polished-surface-box">
                  <div className="reader-section-title-v2">Cảnh báo</div>
                  <p className="reader-warning-text">
                    {activeSection.warning ?? "Không có cảnh báo bổ sung."}
                  </p>
                </div>
              </div>
            )}

            {activeSection.checklist.length > 0 && (
              <div className="reader-section-block-v2">
                <div className="reader-section-title-v2">Checklist cần ghi nhớ</div>
                <ul className="reader-list-v2">
                  {activeSection.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
