import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Siren, Users } from "lucide-react";
import { api } from "../api/client";
import { AdminStats, LessonSummary, Module, OverviewCourse } from "../features/training/types";

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
    } catch (err: any) {
      setError(err?.message || "Không tải được dữ liệu quản trị.");
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
      <section className="section-card">
        <div className="section-header">
          <div className="icon-circle">
            <Users size={18} />
          </div>
          <div>
            <h2 className="section-title">{course?.title || "Quản trị đào tạo an toàn điện"}</h2>
            <p className="section-subtitle">Bảng điều khiển dành cho quản trị viên</p>
          </div>
        </div>

        <div className="summary-grid" style={{ marginTop: 18 }}>
          <div className="summary-card">
            <div className="summary-label">Tổng số nhân viên đã học</div>
            <div className="summary-value">{derivedAdminStats.totalLearners}</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Số người pass</div>
            <div className="summary-value">{derivedAdminStats.passedLearners}</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Tỷ lệ pass</div>
            <div className="summary-value">{derivedAdminStats.passRate}%</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Điểm trung bình</div>
            <div className="summary-value">{derivedAdminStats.averageScore}%</div>
          </div>
        </div>
      </section>

      {error && <div className="error-box">{error}</div>}

      <div className="admin-layout">
        <section className="section-card">
          <div className="section-title">Chỉ số vận hành</div>
          <div className="module-stack" style={{ marginTop: 16 }}>
            <div className="summary-card">
              <div className="summary-label">Đang học</div>
              <div className="summary-value">{derivedAdminStats.inProgressLearners}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Module trong khóa</div>
              <div className="summary-value">{course?.moduleCount ?? modules.length}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Bài học trong khóa</div>
              <div className="summary-value">{course?.lessonCount ?? lessons.length}</div>
            </div>
          </div>
        </section>

        <section className="section-card">
          <div className="section-header">
            <div className="icon-circle">
              <Siren size={18} />
            </div>
            <div>
              <div className="section-title">Checklist giao diện</div>
              <div className="section-subtitle">Các điểm chính sau khi refactor component</div>
            </div>
          </div>

          <div className="module-stack" style={{ marginTop: 16 }}>
            {[
              "Giữ giao diện theo từng khung như app nội bộ.",
              "Tách riêng header, sidebar, workspace, reader panel, progress và quiz.",
              "Dễ chỉnh từng phần mà không ảnh hưởng toàn bộ App.tsx.",
            ].map((item) => (
              <div key={item} className="summary-card">
                <div className="summary-text plain">{item}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
