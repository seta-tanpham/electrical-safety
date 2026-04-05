import React from "react";
import { RefreshCw } from "lucide-react";
import { Progress } from "../../components/ui/Progress";
import { getStatusLabel } from "../../features/training/helpers";
import { OverviewCourse } from "../../features/training/types";

type Props = {
  course: OverviewCourse | null;
  enrollment: any;
  completionPercent: number;
  completedLessons: number;
  onReload: () => void;
  onEnroll: () => void;
};

export default function HeaderOverviewCard({
  course,
  enrollment,
  completionPercent,
  completedLessons,
  onReload,
  onEnroll,
}: Props) {
  return (
    <section className="section-card header-card">
      <div className="header-top">
        <div className="header-left">
          <div className="pill-row">
            <span className="pill pill-primary">Đào tạo bắt buộc</span>
            <span className="pill">An toàn điện</span>
          </div>

          <div className="action-row">
            <button className="btn btn-secondary" onClick={onReload}>
              <RefreshCw size={16} />
              Tải lại dữ liệu
            </button>

            <button className="btn btn-primary" onClick={onEnroll}>
              Ghi danh học viên demo
            </button>

            {enrollment && (
              <span className="pill">
                demo_user_001 • {getStatusLabel(enrollment.status)} • {enrollment.progressPercent}%
              </span>
            )}
          </div>
        </div>

        <div className="header-right">
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Trạng thái</div>
              <div className="kpi-value">{getStatusLabel(enrollment?.status)}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Hoàn thành</div>
              <div className="kpi-value">
                {completedLessons}/{course?.lessonCount ?? 0}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Tiến độ</div>
              <div className="kpi-value">{enrollment?.progressPercent ?? completionPercent}%</div>
              <Progress value={enrollment?.progressPercent ?? completionPercent} />
            </div>

            <div className="kpi-card kpi-warm">
              <div className="kpi-label">Đánh giá cuối bài</div>
              <div className="kpi-value">--</div>
              <div className="kpi-note">Hiển thị khi học viên bắt đầu.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-label">Module</div>
          <div className="summary-value">{course?.moduleCount ?? 0}</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Bài học</div>
          <div className="summary-value">{course?.lessonCount ?? 0}</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Tiến độ toàn khóa</div>
          <div className="summary-value">{enrollment?.progressPercent ?? completionPercent}%</div>
        </div>

        <div className="summary-card summary-info">
          <div className="summary-label">Hướng dẫn</div>
          <div className="summary-text">
            Chọn từng ý chính trong mục lục để đọc nội dung chi tiết.
          </div>
        </div>
      </div>
    </section>
  );
}
