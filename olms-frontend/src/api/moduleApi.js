import api from './apiClient';

export const getAllModules = () => api.get('/course-modules');
export const getModuleById = (id) => api.get(`/course-modules/${id}`);
export const getModulesByCourseId = (courseId) => api.get(`/course-modules/course/${courseId}`);
export const createModule = (data) => api.post('/course-modules', data);
export const updateModule = (id, data) => api.put(`/course-modules/${id}`, data);
export const deleteModule = (id) => api.delete(`/course-modules/${id}`);
