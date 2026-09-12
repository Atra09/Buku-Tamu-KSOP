import axios from 'axios';

// Create central Axios instance using VITE_API_URL from .env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Request interceptor to attach bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sitamu_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Export backend base URL variable matching Manajemen Arsip Digital pattern
export const backendURL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export default api;
