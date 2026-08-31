import api from './apiClient';

export const getAllCertificates = () => api.get('/certificates');
export const getMyCertificates = () => api.get('/certificates/my');
export const getCertificateById = (id) => api.get(`/certificates/${id}`);
export const createCertificate = (data) => api.post('/certificates', data);
export const updateCertificate = (id, data) => api.put(`/certificates/${id}`, data);
export const deleteCertificate = (id) => api.delete(`/certificates/${id}`);
