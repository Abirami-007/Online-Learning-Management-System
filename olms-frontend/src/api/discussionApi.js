import api from './apiClient';

export const getAllDiscussions = () => api.get('/discussions');
export const getDiscussionById = (id) => api.get(`/discussions/${id}`);
export const createDiscussion = (data) => api.post('/discussions', data);
export const updateDiscussion = (id, data) => api.put(`/discussions/${id}`, data);
export const deleteDiscussion = (id) => api.delete(`/discussions/${id}`);
