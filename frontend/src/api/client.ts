const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || "/api";

async function fetchJson(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || "API request failed.");
  }

  return payload;
}

async function fetchOptionalJson(path: string) {
  try {
    return await fetchJson(path);
  } catch {
    return null;
  }
}

export const api = {
  getHealth: () => fetchJson("/../health"),
  getOverview: (courseId: string) => fetchJson(`/courses/${courseId}/overview`),
  getLessons: (courseId: string) => fetchJson(`/courses/${courseId}/lessons`),
  getLesson: (courseId: string, lessonId: string) => fetchJson(`/courses/${courseId}/lessons/${lessonId}?includeBlocks=true`),
  getResources: (courseId: string) => fetchJson(`/courses/${courseId}/resources`),
  enroll: (courseId: string, userId: string) =>
    fetchJson(`/courses/${courseId}/enrollments`, {
      method: "POST",
      body: JSON.stringify({ userId, startNow: true }),
    }),
  getProgress: (courseId: string, userId: string) =>
    fetchOptionalJson(`/courses/${courseId}/users/${userId}/progress`),
  getLatestLessonQuizAttempt: (courseId: string, lessonId: string, userId: string) =>
    fetchOptionalJson(`/courses/${courseId}/lessons/${lessonId}/users/${userId}/quiz-attempts/latest`),
  submitLessonQuiz: (
    courseId: string,
    lessonId: string,
    userId: string,
    durationSeconds: number,
    answers: Array<{ questionId: string; selectedOptionIndex: number }>
  ) =>
    fetchJson(`/courses/${courseId}/lessons/${lessonId}/quiz-attempts`, {
      method: "POST",
      body: JSON.stringify({ userId, durationSeconds, answers }),
    }),
  getAdminStats: (courseId: string) => fetchOptionalJson(`/courses/${courseId}/admin-stats`),
};
