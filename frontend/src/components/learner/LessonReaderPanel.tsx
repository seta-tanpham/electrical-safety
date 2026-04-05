import React, { useMemo, useState } from "react";
import { FileText, Film, Image as ImageIcon, Link as LinkIcon, Download, ExternalLink, CheckCircle2 } from "lucide-react";
import type { LessonResource, NormalizedLessonDetail } from "../../features/training/types";

type Props = {
  lessonDetail: NormalizedLessonDetail | null;
  selectedSectionIndex: number;
  onSelectSection: (index: number) => void;
  completedSectionIds: string[];
  completedResourceIds: string[];
  onCompleteSection: (sectionId: string) => void;
  onCompleteResource: (resourceId: string) => void;
};

function getResourceIcon(type: LessonResource["type"]) {
  switch (type) {
    case "video":
      return <Film size={16} />;
    case "pdf":
    case "document":
      return <FileText size={16} />;
    case "image":
      return <ImageIcon size={16} />;
    case "download":
      return <Download size={16} />;
    default:
      return <LinkIcon size={16} />;
  }
}

export default function LessonReaderPanel({
  lessonDetail,
  selectedSectionIndex,
  onSelectSection,
  completedSectionIds,
  completedResourceIds,
  onCompleteSection,
  onCompleteResource,
}: Props) {
  const [activeResourceId, setActiveResourceId] = useState<string | null>(null);

  const activeSection = lessonDetail?.sections[selectedSectionIndex] ?? null;
  const activeResource = useMemo(
    () => activeSection?.resources.find((resource) => resource.id === activeResourceId) ?? activeSection?.resources[0] ?? null,
    [activeSection, activeResourceId]
  );

  if (!lessonDetail || !activeSection) {
    return <section className="section-card">Chưa có nội dung bài học.</section>;
  }

  return (
    <section className="section-card">
      <div className="reader-layout">
        <div className="reader-outline">
          <div className="reader-header">
            <h3 className="section-title">Mục lục nội dung</h3>
            <p className="section-subtitle">Bấm từng ý chính để đọc sâu hơn</p>
          </div>

          <div className="reader-outline-list">
            {lessonDetail.sections.map((section, index) => {
              const completed = completedSectionIds.includes(section.id);
              return (
                <button
                  key={section.id}
                  className={`reader-outline-item ${selectedSectionIndex === index ? "active" : ""}`}
                  onClick={() => onSelectSection(index)}
                >
                  <div className="reader-outline-index">0{index + 1}</div>
                  <div className="reader-outline-body">
                    <div className="reader-outline-title">{section.title}</div>
                    <div className="reader-outline-summary">{section.summary}</div>
                  </div>
                  {completed && <CheckCircle2 size={16} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="reader-document">
          <div className="reader-document-head">
            <div className="pill-row">
              <span className="pill pill-primary">{activeSection.title}</span>
              <span className="pill">{activeSection.isRequired ? "Bắt buộc" : "Tham khảo"}</span>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => onCompleteSection(activeSection.id)}
            >
              {completedSectionIds.includes(activeSection.id) ? "Đã đọc" : "Đánh dấu đã đọc"}
            </button>
          </div>

          <div className="reader-document-title">{activeSection.summary}</div>

          <div className="reader-section-block">
            <div className="reader-section-title">Diễn giải chi tiết</div>
            <div className="reader-paragraphs">
              {activeSection.content.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          {activeSection.examples && activeSection.examples.length > 0 && (
            <div className="reader-section-block soft">
              <div className="reader-section-title">Ví dụ thực tế</div>
              <ul className="reader-list">
                {activeSection.examples.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {activeSection.warning && (
            <div className="reader-callout">
              <div className="reader-section-title">Cảnh báo</div>
              <p>{activeSection.warning}</p>
            </div>
          )}

          {activeSection.checklist.length > 0 && (
            <div className="reader-section-block">
              <div className="reader-section-title">Checklist liên quan</div>
              <ul className="reader-list">
                {activeSection.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="resource-panel">
          <div className="reader-header">
            <h3 className="section-title">Học liệu liên quan</h3>
            <p className="section-subtitle">Video, PDF, SOP, hình ảnh và tài liệu tham khảo</p>
          </div>

          <div className="resource-list">
            {activeSection.resources.map((resource) => {
              const completed = completedResourceIds.includes(resource.id);
              return (
                <button
                  key={resource.id}
                  className={`resource-card ${activeResource?.id === resource.id ? "active" : ""}`}
                  onClick={() => setActiveResourceId(resource.id)}
                >
                  <div className="resource-card-top">
                    <div className="resource-icon">{getResourceIcon(resource.type)}</div>
                    <div className="resource-badges">
                      <span className="status-chip open">{resource.type.toUpperCase()}</span>
                      {resource.isRequired && <span className="status-chip locked">Bắt buộc</span>}
                    </div>
                  </div>
                  <div className="resource-title">{resource.title}</div>
                  {resource.description && <div className="resource-description">{resource.description}</div>}
                  {completed && <div className="resource-complete">Đã hoàn thành</div>}
                </button>
              );
            })}

            {!activeSection.resources.length && (
              <div className="resource-empty">Bài học này chưa có học liệu đính kèm.</div>
            )}
          </div>

          {activeResource && (
            <div className="resource-viewer">
              <div className="resource-viewer-head">
                <div>
                  <div className="resource-title">{activeResource.title}</div>
                  {activeResource.description && (
                    <div className="resource-description">{activeResource.description}</div>
                  )}
                </div>

                <button
                  className="btn btn-secondary"
                  onClick={() => onCompleteResource(activeResource.id)}
                >
                  {completedResourceIds.includes(activeResource.id)
                    ? "Đã hoàn thành"
                    : activeResource.type === "video"
                    ? "Đánh dấu đã xem"
                    : "Đánh dấu đã mở"}
                </button>
              </div>

              <div className="resource-preview">
                {activeResource.type === "video" && (
                  <div className="resource-preview-box">
                    <Film size={20} />
                    <div>Khung phát video / player embed</div>
                    <div className="resource-preview-note">
                      Khi nối backend thật, có thể lưu thời điểm xem dở và % hoàn thành video.
                    </div>
                  </div>
                )}

                {activeResource.type === "pdf" && (
                  <div className="resource-preview-box">
                    <FileText size={20} />
                    <div>Khung xem nhanh PDF / SOP</div>
                    <div className="resource-preview-note">
                      Có thể mở modal, toàn màn hình hoặc tải về.
                    </div>
                  </div>
                )}

                {(activeResource.type === "document" ||
                  activeResource.type === "download" ||
                  activeResource.type === "external_link") && (
                  <div className="resource-preview-box">
                    <ExternalLink size={20} />
                    <div>Tài liệu tham khảo / biểu mẫu</div>
                    <div className="resource-preview-note">
                      Hiển thị theo card tài liệu, link nội bộ hoặc file tải về.
                    </div>
                  </div>
                )}

                {activeResource.type === "image" && (
                  <div className="resource-preview-box">
                    <ImageIcon size={20} />
                    <div>Khung minh họa hình ảnh / sơ đồ</div>
                    <div className="resource-preview-note">
                      Có thể hiển thị ảnh an toàn điện, sơ đồ quy trình hoặc biển cảnh báo.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
