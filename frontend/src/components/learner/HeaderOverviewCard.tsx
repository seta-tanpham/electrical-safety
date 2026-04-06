import React from "react";
import { Progress } from "../ui/Progress";
import { getStatusLabel } from "../../features/training/helpers";
import type { OverviewCourse } from "../../features/training/types";

type Props = {
  course: OverviewCourse | null;
  enrollment: any;
  completionPercent: number;
  completedLessons: number;
};

export default function HeaderOverviewCard({
  course,
  enrollment,
  completionPercent,
  completedLessons,
}: Props) {
  return (
    <section className="section-card header-card header-card-flat">
      <div className="header-top-flat">
        <div className="header-top-left-flat">
          <div className="pill-row compact-gap">
            <span className="pill pill-primary">Đào tạo bắt buộc</span>
            <span className="pill">An toàn điện</span>
          </div>

          {enrollment && (
            <div className="header-inline-status">
              <span className="header-inline-label">Học viên demo</span>
              <span className="header-inline-value">
                demo_user_001 • {getStatusLabel(enrollment.status)} • {enrollment.progressPercent}%
              </span>
            </div>
          )}
        </div>

        <div className="kpi-grid header-kpi-grid-flat">
          <div className="kpi-card compact-card flat-card">
            <div className="kpi-label">Trạng thái</div>
            <div className="kpi-value">{getStatusLabel(enrollment?.status)}</div>
          </div>

          <div className="kpi-card compact-card flat-card">
            <div className="kpi-label">Hoàn thành</div>
            <div className="kpi-value">
              {completedLessons}/{course?.lessonCount ?? 0}
            </div>
          </div>

          <div className="kpi-card compact-card flat-card">
            <div className="kpi-label">Tiến độ</div>
            <div className="kpi-value">{enrollment?.progressPercent ?? completionPercent}%</div>
            <Progress value={enrollment?.progressPercent ?? completionPercent} />
          </div>

          <div className="kpi-card kpi-warm compact-card flat-card">
            <div className="kpi-label">Đánh giá cuối bài</div>
            <div className="kpi-value">--</div>
            <div className="kpi-note">Mở khi hoàn thành nội dung bắt buộc.</div>
          </div>
        </div>
      </div>

      <div className="summary-grid header-summary-grid-flat">
        <div className="summary-card compact-summary-card flat-summary-card">
          <div className="summary-label">Module</div>
          <div className="summary-value">{course?.moduleCount ?? 0}</div>
        </div>

        <div className="summary-card compact-summary-card flat-summary-card">
          <div className="summary-label">Bài học</div>
          <div className="summary-value">{course?.lessonCount ?? 0}</div>
        </div>

        <div className="summary-card compact-summary-card flat-summary-card">
          <div className="summary-label">Tiến độ toàn khóa</div>
          <div className="summary-value">{enrollment?.progressPercent ?? completionPercent}%</div>
        </div>

        <div className="summary-card summary-info compact-summary-card flat-summary-card">
          <div className="summary-label">Hướng dẫn</div>
          <div className="summary-text">
            Chọn từng ý chính trong mục lục để đọc nội dung chi tiết.
          </div>
        </div>
      </div>
    </section>
  );
}
