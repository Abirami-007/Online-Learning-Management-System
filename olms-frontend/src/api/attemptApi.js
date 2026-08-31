import api from './apiClient';

export const getAllAttempts = () => api.get('/assessment-attempts');
export const getAttemptById = (id) => api.get(`/assessment-attempts/${id}`);
export const getAttemptsByAssessmentId = (assessmentId) => api.get(`/assessment-attempts/assessment/${assessmentId}`);
export const getAttemptsByUserId = (userId) => api.get(`/assessment-attempts/user/${userId}`);
export const createAttempt = (data) => api.post('/assessment-attempts', data);
export const updateAttempt = (id, data) => api.put(`/assessment-attempts/${id}`, data);
export const deleteAttempt = (id) => api.delete(`/assessment-attempts/${id}`);
