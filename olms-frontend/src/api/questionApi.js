import api from './apiClient';

export const getAllQuestions = () => api.get('/questions');
export const getQuestionById = (id) => api.get(`/questions/${id}`);
export const getQuestionsByAssessmentId = (assessmentId) => api.get(`/questions/assessment/${assessmentId}`);
export const createQuestion = (data) => api.post('/questions', data);
export const updateQuestion = (id, data) => api.put(`/questions/${id}`, data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);
