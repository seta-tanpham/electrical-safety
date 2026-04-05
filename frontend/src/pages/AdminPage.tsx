import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Users, Siren } from "lucide-react";
import { api } from "../api/client";
import type { AdminStats, LessonSummary, Module, OverviewCourse } from "../features/training/types";

const COURSE_ID = "electrical-safety-foundation";

export default function AdminPage() {
  const [course, setCourse] = useState<OverviewCourse | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const derivedAdminStats = useMemo<AdminStats>(() => {
    if (adminStats) return adminStats;
    return {
      totalLearners: 126,
      passedLearners: 82,
      inProgressLearners: 29,
      passRate: 65,
      averageScore: 84,
    };
  }, [adminStats]);

  const loadAdmin = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewPayload, lessonsPayload, adminPayload] = await Promise.all([
        api.getOverview(COURSE_ID),
        api.getLessons(COURSE_ID),
        api.getAdminStats(COURSE_ID),
      ]);
      setCourse(overviewPayload.data.course);
      setModules(overviewPayload.data.modules ?? []);
      setLessons(lessonsPayload.data ?? []);
      setAdminStats(adminPayload?.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu quản trị.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdmin();
  }, [loadAdmin]);

  if (loading) {
    return <div className="page-shell">Đang tải dữ liệu quản trị...</div>;
  }

  return (
    <div className="page-shell">
      {error && <div className="error-box">{error}</div>}

      <div className="admin-grid">
        <section className="section-card">
          <div className="section-header">
            <div className="icon-circle">
              <Users size={18} />
            </div>
            <div>
              <h2 className="section-title">{course?.title ?? "Tổng quan đào tạo"}</h2>
              <p className="section-subtitle">Theo dõi các chỉ số học tập và hiệu quả đào tạo</p>
            </div>
          </div>

          <div className="summary-grid admin-summary-grid">
            <div className="summary-card">
              <div className="summary-label">Tổng số học viên</div>
              <div className="summary-value">{derivedAdminStats.totalLearners}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Số người đạt</div>
              <div className="summary-value">{derivedAdminStats.passedLearners}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Tỷ lệ đạt</div>
              <div className="summary-value">{derivedAdminStats.passRate}%</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Điểm trung bình</div>
              <div className="summary-value">{derivedAdminStats.averageScore}%</div>
            </div>
          </div>

          <div className="two-card-grid">
            <div className="content-box">
              <div className="content-box-title">Chỉ số vận hành</div>
              <div className="content-box-item">Đang học: <strong>{derivedAdminStats.inProgressLearners}</strong></div>
              <div className="content-box-item">Module trong khóa: <strong>{course?.moduleCount ?? modules.length}</strong></div>
              <div className="content-box-item">Bài học trong khóa: <strong>{course?.lessonCount ?? lessons.length}</strong></div>
            </div>

            <div className="content-box warning">
              <div className="content-box-title">Ghi chú thiết kế</div>
              <ul className="reader-list">
                <li>Nội dung học và học liệu được tách riêng để thuận tiện mở rộng.</li>
                <li>Bài kiểm tra chỉ xuất hiện sau khi người học hoàn thành nội dung bắt buộc.</li>
                <li>Reader panel và resource panel hỗ trợ trải nghiệm đào tạo nội bộ thực tế hơn.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section-card">
          <div className="section-header">
            <div className="icon-circle">
              <Siren size={18} />
            </div>
            <div>
              <h2 className="section-title">Trạng thái triển khai</h2>
              <p className="section-subtitle">Các điểm cần nối backend thật</p>
            </div>
          </div>

          <div className="content-box-item">Sections và resources cho từng lesson.</div>
          <div className="content-box-item">Tracking hoàn thành video/tài liệu bắt buộc.</div>
          <div className="content-box-item">Quy tắc unlock bài kiểm tra dựa trên mức độ hoàn thành học liệu.</div>
        </section>
      </div>
    </div>
  );
}
