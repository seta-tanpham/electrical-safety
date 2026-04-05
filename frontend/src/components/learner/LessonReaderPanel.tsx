import React, { useMemo } from "react";
import { buildDetailedSections } from "../../features/training/helpers";
import type { LessonDetail } from "../../features/training/types";

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
  const sections = useMemo(() => buildDetailedSections(lessonDetail), [lessonDetail]);
  const active = sections[selectedSectionIndex] ?? null;

  if (!lessonDetail) return null;

  return (
    <section className="section-card reader-card">
      <div className="reader-grid">
        <div className="reader-outline">
          <div className="reader-outline-head">
            <div className="reader-heading">Các ý chính</div>
            <div className="reader-note">Bấm để mở nội dung chi tiết của từng ý.</div>
          </div>

          <div className="reader-outline-list">
            {sections.map((section, index) => (
              <button
                key={section.id}
                className={`outline-item ${selectedSectionIndex === index ? "active" : ""}`}
                onClick={() => onSelectSection(index)}
              >
                <div className="outline-item-index">0{index + 1}</div>
                <div className="outline-item-body">
                  <div className="outline-item-title">{section.navTitle}</div>
                  <div className="outline-item-summary">{section.summary}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="reader-content">
          {active ? (
            <>
              <div className="reader-content-head">
                <span className="pill">{active.navTitle}</span>
                <h3 className="reader-content-title">{active.summary}</h3>
              </div>

              <div className="reader-block">
                <div className="reader-block-title">Giải thích chi tiết</div>
                <div className="reader-paragraph-list">
                  {active.details.map((detail) => (
                    <p key={detail} className="reader-paragraph">{detail}</p>
                  ))}
                </div>
              </div>

              <div className="reader-two-col">
                <div className="reader-block soft">
                  <div className="reader-block-title">Áp dụng tại hiện trường</div>
                  <ul className="reader-list">
                    {active.fieldGuide.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>

                <div className="reader-block warm">
                  <div className="reader-block-title">Lưu ý quan trọng</div>
                  <p className="reader-paragraph">{active.warning}</p>
                </div>
              </div>

              <div className="reader-block">
                <div className="reader-block-title">Checklist liên quan</div>
                <ul className="reader-list">
                  {active.relatedChecklist.map((item) => (
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
