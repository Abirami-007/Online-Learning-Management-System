import api from './apiClient';

export const getAllProgress = () => api.get('/lesson-progress');
export const getProgressById = (id) => api.get(`/lesson-progress/${id}`);
export const createProgress = (data) => api.post('/lesson-progress', data);
export const updateProgress = (id, data) => api.put(`/lesson-progress/${id}`, data);
export const deleteProgress = (id) => api.delete(`/lesson-progress/${id}`);
