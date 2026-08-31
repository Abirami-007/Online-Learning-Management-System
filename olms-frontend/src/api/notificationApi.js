import api from './apiClient';

export const getAllNotifications = () => api.get('/notifications');
export const getNotificationById = (id) => api.get(`/notifications/${id}`);
export const createNotification = (data) => api.post('/notifications', data);
export const updateNotification = (id, data) => api.put(`/notifications/${id}`, data);
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
