import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Search, Users } from "lucide-react";
import { api } from "../api/client";
import { getFallbackAdminLearners } from "../mock/adminLearnerRoster";
import type {
  AdminLearner,
  AdminStats,
  LessonSummary,
  Module,
  OverviewCourse,
} from "../features/training/types";

const COURSE_ID = "electrical-safety-foundation";

const STATUS_LABELS: Record<AdminLearner["status"], string> = {
  not_started: "Chưa bắt đầu",
  in_progress: "Đang học",
  completed: "Hoàn thành",
  failed: "Chưa đạt",
};

const STATUS_CLASSNAMES: Record<AdminLearner["status"], string> = {
  not_started: "neutral",
  in_progress: "open",
  completed: "success",
  failed: "danger",
};

function formatDate(value?: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function AdminPage() {
  const [course, setCourse] = useState<OverviewCourse | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [learners, setLearners] = useState<AdminLearner[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const derivedAdminStats = useMemo<AdminStats>(() => {
    if (adminStats) return adminStats;
    const completedCount = learners.filter((learner) => learner.status === "completed").length;
    const inProgressCount = learners.filter((learner) => learner.status === "in_progress").length;
    const scoreList = learners
      .map((learner) => learner.scorePercent)
      .filter((score): score is number => typeof score === "number");
    const averageScore = scoreList.length
      ? Math.round(scoreList.reduce((sum, score) => sum + score, 0) / scoreList.length)
      : 0;

    return {
      totalLearners: learners.length,
      passedLearners: completedCount,
      inProgressLearners: inProgressCount,
      passRate: learners.length ? Math.round((completedCount / learners.length) * 100) : 0,
      averageScore,
    };
  }, [adminStats, learners]);

  const filteredLearners = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return learners;
    return learners.filter((learner) => {
      const haystack = [
        learner.fullName,
        learner.userId,
        learner.department,
        learner.position,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [learners, search]);

  const statusBreakdown = useMemo(() => {
    const items = [
      {
        key: "completed" as const,
        label: "Hoàn thành",
        count: learners.filter((learner) => learner.status === "completed").length,
        tone: "success",
      },
      {
        key: "in_progress" as const,
        label: "Đang học",
        count: learners.filter((learner) => learner.status === "in_progress").length,
        tone: "open",
      },
      {
        key: "failed" as const,
        label: "Chưa đạt",
        count: learners.filter((learner) => learner.status === "failed").length,
        tone: "danger",
      },
      {
        key: "not_started" as const,
        label: "Chưa bắt đầu",
        count: learners.filter((learner) => learner.status === "not_started").length,
        tone: "neutral",
      },
    ];

    return items.map((item) => ({
      ...item,
      percent: learners.length ? Math.round((item.count / learners.length) * 100) : 0,
    }));
  }, [learners]);

  const departmentMetrics = useMemo(() => {
    const departmentMap = new Map<string, { total: number; passed: number; averageScores: number[] }>();

    learners.forEach((learner) => {
      if (!departmentMap.has(learner.department)) {
        departmentMap.set(learner.department, { total: 0, passed: 0, averageScores: [] });
      }

      const item = departmentMap.get(learner.department)!;
      item.total += 1;
      if (learner.status === "completed") item.passed += 1;
      if (typeof learner.scorePercent === "number") item.averageScores.push(learner.scorePercent);
    });

    return [...departmentMap.entries()]
      .map(([department, value]) => ({
        department,
        total: value.total,
        passed: value.passed,
        passRate: value.total ? Math.round((value.passed / value.total) * 100) : 0,
        averageScore: value.averageScores.length
          ? Math.round(value.averageScores.reduce((sum, score) => sum + score, 0) / value.averageScores.length)
          : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [learners]);

  const loadAdmin = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewPayload, lessonsPayload, adminPayload, learnersPayload] = await Promise.all([
        api.getOverview(COURSE_ID),
        api.getLessons(COURSE_ID),
        api.getAdminStats(COURSE_ID),
        api.getAdminLearners(COURSE_ID),
      ]);

      setCourse(overviewPayload.data.course);
      setModules(overviewPayload.data.modules ?? []);
      setLessons(lessonsPayload.data ?? []);
      setAdminStats(adminPayload?.data ?? null);
      setLearners(learnersPayload?.data?.learners ?? getFallbackAdminLearners());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu quản trị.");
      setLearners(getFallbackAdminLearners());
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

      <div className="admin-page-stack">
        <section className="section-card admin-hero-card">
          <div className="admin-hero-head">
            <div>
              <div className="pill-row" style={{ marginBottom: 10 }}>
                <span className="pill pill-primary">Bảng điều khiển quản trị</span>
                <span className="pill">An toàn điện</span>
              </div>
              <h2 className="admin-hero-title">{course?.title ?? "Tổng quan đào tạo"}</h2>
              <p className="admin-hero-subtitle">
                Theo dõi tiến độ học tập, tỷ lệ hoàn thành và kết quả của từng học viên trong toàn khóa học.
              </p>
            </div>

            <div className="admin-hero-meta">
              <div className="kpi-card compact">
                <div className="kpi-label">Module</div>
                <div className="kpi-value">{course?.moduleCount ?? modules.length}</div>
              </div>
              <div className="kpi-card compact">
                <div className="kpi-label">Bài học</div>
                <div className="kpi-value">{course?.lessonCount ?? lessons.length}</div>
              </div>
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
        </section>

        <div className="admin-dashboard-grid">
          <section className="section-card">
            <div className="section-header">
              <div className="icon-circle">
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 className="section-title">Thông số chung toàn khóa học</h3>
                <p className="section-subtitle">Tập trung vào phân bố trạng thái học tập và hiệu quả theo phòng ban.</p>
              </div>
            </div>

            <div className="admin-analytics-grid">
              <div className="analytics-card">
                <div className="analytics-card-title">Phân bố trạng thái học viên</div>
                <div className="analytics-bars">
                  {statusBreakdown.map((item) => (
                    <div key={item.key} className="analytics-row">
                      <div className="analytics-row-meta">
                        <span>{item.label}</span>
                        <strong>{item.count}</strong>
                      </div>
                      <div className="analytics-track">
                        <div
                          className={`analytics-fill ${item.tone}`}
                          style={{ width: `${Math.max(item.percent, item.count ? 8 : 0)}%` }}
                        />
                      </div>
                      <div className="analytics-row-percent">{item.percent}%</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="analytics-card">
                <div className="analytics-card-title">Hiệu quả theo phòng ban</div>
                <div className="analytics-bars department">
                  {departmentMetrics.map((item) => (
                    <div key={item.department} className="department-row">
                      <div className="department-row-top">
                        <div>
                          <div className="department-name">{item.department}</div>
                          <div className="department-note">{item.total} học viên</div>
                        </div>
                        <div className="department-score">{item.passRate}% đạt</div>
                      </div>
                      <div className="analytics-track">
                        <div className="analytics-fill success" style={{ width: `${Math.max(item.passRate, item.total ? 8 : 0)}%` }} />
                      </div>
                      <div className="department-footer">
                        <span>{item.passed}/{item.total} hoàn thành</span>
                        <span>Điểm TB: {item.averageScore || "--"}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="section-card admin-users-card">
            <div className="section-header admin-users-header">
              <div className="section-heading-inline">
                <div className="icon-circle">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="section-title">Danh sách học viên</h3>
                  <p className="section-subtitle">Theo dõi chi tiết từng học viên, phòng ban, tiến độ và kết quả học tập.</p>
                </div>
              </div>

              <label className="admin-search-box">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo tên, ID, phòng ban..."
                />
              </label>
            </div>

            <div className="admin-table-shell">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Học viên</th>
                    <th>Mã ID</th>
                    <th>Phòng ban</th>
                    <th>Vị trí</th>
                    <th>Tiến độ</th>
                    <th>Điểm</th>
                    <th>Trạng thái</th>
                    <th>Hoạt động gần nhất</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLearners.map((learner) => (
                    <tr key={learner.id}>
                      <td>
                        <div className="learner-cell-main">
                          <div className="learner-name">{learner.fullName}</div>
                          <div className="learner-subtext">
                            {learner.completedLessons}/{learner.totalLessons} bài hoàn thành
                          </div>
                        </div>
                      </td>
                      <td className="mono-text">{learner.userId}</td>
                      <td>{learner.department}</td>
                      <td>{learner.position}</td>
                      <td>
                        <div className="table-progress-cell">
                          <span>{learner.progressPercent}%</span>
                          <div className="table-progress-track">
                            <div className="table-progress-fill" style={{ width: `${learner.progressPercent}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>{typeof learner.scorePercent === "number" ? `${learner.scorePercent}%` : "--"}</td>
                      <td>
                        <span className={`status-chip ${STATUS_CLASSNAMES[learner.status]}`}>
                          {STATUS_LABELS[learner.status]}
                        </span>
                      </td>
                      <td>{formatDate(learner.lastActivityAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
