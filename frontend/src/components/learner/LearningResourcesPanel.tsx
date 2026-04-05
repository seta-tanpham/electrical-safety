import React, { useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Film,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import type { LessonResource, NormalizedLessonDetail } from "../../features/training/types";

type Props = {
  lessonDetail: NormalizedLessonDetail | null;
  completedResourceIds: string[];
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
    case "external_link":
      return <ExternalLink size={16} />;
    default:
      return <LinkIcon size={16} />;
  }
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  video: "Video",
  pdf: "PDF",
  image: "Hình ảnh",
  document: "Tài liệu",
  download: "Tải về",
  external_link: "Liên kết",
};

export default function LearningResourcesPanel({
  lessonDetail,
  completedResourceIds,
  onCompleteResource,
}: Props) {
  const [activeResourceId, setActiveResourceId] = useState<string | null>(null);
  const resources = lessonDetail?.allResources ?? [];

  const activeResource = useMemo(() => {
    if (!resources.length) return null;
    return resources.find((resource) => resource.id === activeResourceId) ?? resources[0];
  }, [resources, activeResourceId]);

  if (!lessonDetail) {
    return <section className="section-card">Chưa có học liệu cho bài học.</section>;
  }

  return (
    <section className="section-card resources-card resources-card-polished">
      <div className="resources-layout resources-layout-polished">
        <aside className="resources-list-pane resources-list-pane-polished">
          <div className="reader-pane-header">
            <div>
              <h3 className="section-title">Học liệu liên quan</h3>
              <p className="section-subtitle">Video, PDF, SOP, biểu mẫu và tài liệu tham khảo</p>
            </div>
          </div>

          <div className="resource-list-v2">
            {resources.map((resource) => {
              const completed = completedResourceIds.includes(resource.id);
              return (
                <button
                  key={resource.id}
                  type="button"
                  className={`resource-card-v2 ${activeResource?.id === resource.id ? "active" : ""}`}
                  onClick={() => setActiveResourceId(resource.id)}
                >
                  <div className="resource-card-top-v2">
                    <div className="resource-icon">{getResourceIcon(resource.type)}</div>
                    <div className="resource-type-chip">{RESOURCE_TYPE_LABELS[resource.type]}</div>
                  </div>

                  <div className="resource-card-title-v2">{resource.title}</div>
                  {resource.description && <div className="resource-card-desc-v2">{resource.description}</div>}

                  <div className="resource-card-footer-v2">
                    {resource.isRequired && <span className="status-chip locked">Bắt buộc</span>}
                    {completed && <span className="status-chip success">Đã hoàn thành</span>}
                  </div>
                </button>
              );
            })}

            {!resources.length && <div className="resource-empty">Bài học này chưa có học liệu đính kèm.</div>}
          </div>
        </aside>

        <div className="resource-viewer-v2 resource-viewer-polished">
          {activeResource ? (
            <>
              <div className="resource-viewer-head-v2 sticky-toolbar resource-viewer-head-polished">
                <div>
                  <div className="reader-toolbar-kicker">{RESOURCE_TYPE_LABELS[activeResource.type]}</div>
                  <div className="reader-toolbar-title">{activeResource.title}</div>
                  {activeResource.description && (
                    <div className="resource-card-desc-v2">{activeResource.description}</div>
                  )}
                </div>

                <button className="btn btn-primary" onClick={() => onCompleteResource(activeResource.id)}>
                  {completedResourceIds.includes(activeResource.id)
                    ? "Đã hoàn thành"
                    : activeResource.type === "video"
                    ? "Đánh dấu đã xem"
                    : "Đánh dấu đã mở"}
                </button>
              </div>

              <div className="resource-viewer-body-v2 resource-viewer-body-polished">
                <div className="resource-preview-box-v2 polished-preview-box">
                  {getResourceIcon(activeResource.type)}
                  <div className="resource-preview-title-v2">Khu vực xem học liệu</div>
                  <div className="resource-preview-note-v2">
                    {activeResource.type === "video" &&
                      "Có thể nhúng player video, lưu thời điểm xem dở và tính tỷ lệ hoàn thành."}
                    {activeResource.type === "pdf" &&
                      "Có thể xem nhanh PDF/SOP, mở toàn màn hình hoặc tải về."}
                    {activeResource.type === "image" &&
                      "Có thể hiển thị ảnh minh họa, sơ đồ thao tác hoặc biển cảnh báo an toàn."}
                    {(activeResource.type === "document" || activeResource.type === "download") &&
                      "Có thể hiển thị tài liệu nội bộ, checklist tải về hoặc biểu mẫu xác nhận."}
                    {activeResource.type === "external_link" &&
                      "Có thể mở sang cổng tài liệu nội bộ hoặc hệ thống SOP riêng."}
                  </div>
                </div>

                <div className="resource-meta-panel">
                  <div className="resource-meta-item">
                    <span>Loại học liệu</span>
                    <strong>{RESOURCE_TYPE_LABELS[activeResource.type]}</strong>
                  </div>
                  <div className="resource-meta-item">
                    <span>Mức độ bắt buộc</span>
                    <strong>{activeResource.isRequired ? "Bắt buộc" : "Tham khảo"}</strong>
                  </div>
                </div>

                <div className="resource-actions-grid-v2">
                  <button className="btn btn-secondary" type="button">Xem nhanh</button>
                  <button className="btn btn-secondary" type="button">Mở toàn màn hình</button>
                  <button className="btn btn-secondary" type="button">Tải xuống / Mở liên kết</button>
                </div>
              </div>
            </>
          ) : (
            <div className="resource-empty">Chưa chọn học liệu.</div>
          )}
        </div>
      </div>
    </section>
  );
}
