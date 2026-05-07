import axios from 'axios';

const API = axios.create({
  // For local dev this defaults to your current setup.
  // On Render, set `VITE_API_BASE_URL` to your backend URL at build time.
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;