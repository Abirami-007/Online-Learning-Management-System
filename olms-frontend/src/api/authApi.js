import axios from 'axios';
import api from './apiClient';

const AUTH_BASE = '/api/auth';

export const loginUser = async (email, password) => {
  const res = await axios.post(`${AUTH_BASE}/login`, { email, password }, {
    headers: { 'Content-Type': 'application/json' },
  });
  return res.data;
};

export const registerUser = async (userData) => {
  const res = await axios.post(`${AUTH_BASE}/register`, userData, {
    headers: { 'Content-Type': 'application/json' },
  });
  return res.data;
};

export const getMe = () => api.get('/auth/me');
