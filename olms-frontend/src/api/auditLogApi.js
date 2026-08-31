import api from './apiClient';

export const getAllAuditLogs = () => api.get('/audit-logs');
export const getAuditLogById = (id) => api.get(`/audit-logs/${id}`);
export const createAuditLog = (data) => api.post('/audit-logs', data);
export const updateAuditLog = (id, data) => api.put(`/audit-logs/${id}`, data);
export const deleteAuditLog = (id) => api.delete(`/audit-logs/${id}`);
