import React from "react";
import { CheckCircle2 } from "lucide-react";
import { buildDetailedSections } from "../../features/training/helpers";
import { LessonDetail } from "../../features/training/types";

type Props = {
  lessonDetail: LessonDetail | null;
  selectedSectionIndex: number;
  onSelectSection: (index: number) => void;
};

export default function LessonReaderPanel({
  lessonDetail,
  selectedSectionIndex,
  onSelectSection,
}: Props) {
  if (!lessonDetail) return null;

  const sections = buildDetailedSections(lessonDetail);
  const activeSection = sections[selectedSectionIndex] ?? null;

  return (
    <section className="section-card">
      <div className="reader-grid">
        <div className="reader-outline">
          <div className="reader-outline-head">
            <div className="reader-outline-title">Mục lục nội dung</div>
            <div className="reader-outline-subtitle">Chọn từng ý chính để xem nội dung chi tiết</div>
          </div>

          <div className="reader-outline-list">
            {sections.map((section, index) => {
              const active = selectedSectionIndex === index;
              return (
                <button
                  key={section.id}
                  className={`reader-nav-item ${active ? "active" : ""}`}
                  onClick={() => onSelectSection(index)}
                >
                  <div className="reader-nav-number">0{index + 1}</div>
                  <div className="reader-nav-content">
                    <div className="reader-nav-title">{section.navTitle}</div>
                    <div className="reader-nav-summary">{section.summary}</div>
                  </div>
                  {active && <CheckCircle2 size={16} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="reader-document">
          {activeSection ? (
            <>
              <div className="reader-document-head">
                <div className="pill-row">
                  <span className="pill pill-primary">{activeSection.navTitle}</span>
                  <span className="pill">Khung đọc tài liệu</span>
                </div>
                <h3 className="reader-document-title">{activeSection.summary}</h3>
              </div>

              <div className="reader-section">
                <div className="reader-section-title">Giải thích chi tiết</div>
                <div className="reader-paragraphs">
                  {activeSection.details.map((detail) => (
                    <p key={detail} className="reader-paragraph">
                      {detail}
                    </p>
                  ))}
                </div>
              </div>

              <div className="reader-two-col">
                <div className="reader-soft-card">
                  <div className="reader-section-title">Áp dụng tại hiện trường</div>
                  <ul className="reader-list">
                    {activeSection.fieldGuide.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="reader-warn-card">
                  <div className="reader-section-title">Lưu ý quan trọng</div>
                  <p className="reader-paragraph">{activeSection.warning}</p>
                </div>
              </div>

              <div className="reader-section">
                <div className="reader-section-title">Checklist liên quan</div>
                <ul className="reader-list">
                  {activeSection.relatedChecklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div>Chưa có nội dung chi tiết.</div>
          )}
        </div>
      </div>
    </section>
  );
}
