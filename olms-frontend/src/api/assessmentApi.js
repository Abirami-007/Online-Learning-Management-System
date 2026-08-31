import api from './apiClient';

export const getAllAssessments = () => api.get('/assessments');
export const getAssessmentById = (id) => api.get(`/assessments/${id}`);
export const getAssessmentsByModuleId = (moduleId) => api.get(`/assessments/module/${moduleId}`);
export const createAssessment = (data) => api.post('/assessments', data);
export const updateAssessment = (id, data) => api.put(`/assessments/${id}`, data);
export const deleteAssessment = (id) => api.delete(`/assessments/${id}`);
