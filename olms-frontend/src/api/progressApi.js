import api from './apiClient';

export const getAllProgress = () => api.get('/lesson-progress');
export const getProgressById = (id) => api.get(`/lesson-progress/${id}`);
export const createProgress = (data) => api.post('/lesson-progress', data);
export const updateProgress = (id, data) => api.put(`/lesson-progress/${id}`, data);
export const deleteProgress = (id) => api.delete(`/lesson-progress/${id}`);

// ── Sequential Lock APIs ──────────────────────────────────────────────────────

/** Mark a lesson complete — backend validates prerequisites and returns 403 if locked. */
export const completeLessonApi = (userId, lessonId) =>
    api.post(`/lesson-progress/complete?userId=${userId}&lessonId=${lessonId}`, { userId, lessonId });

/** Full course progress tree: lock flags, completion %, unlock hints — one call. */
export const getCourseProgressApi = (userId, courseId) =>
    api.get(`/lesson-progress/course/${courseId}?userId=${userId}`);

/** Quick lock status check for a single lesson. Returns { unlocked: boolean }. */
export const checkLessonUnlock = (userId, lessonId) =>
    api.get(`/lesson-progress/check-unlock?userId=${userId}&lessonId=${lessonId}`);
