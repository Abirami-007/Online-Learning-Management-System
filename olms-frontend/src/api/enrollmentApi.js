import api from './apiClient';

export const getAllEnrollments = () => api.get('/enrollments');
export const getMyEnrollments = () => api.get('/enrollments/my');
export const getEnrollmentById = (id) => api.get(`/enrollments/${id}`);
export const createEnrollment = (data) => api.post('/enrollments', data);
export const checkEnrollmentApi = (courseId) => api.get(`/enrollments/check?courseId=${courseId}`);
export const deleteEnrollment = (id) => api.delete(`/enrollments/${id}`);

