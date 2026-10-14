import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App.jsx';
import './index.css';

// Set global Axios baseURL from VITE_API_URL environment variable
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}

// Global request interceptor to attach JWT Bearer token across all pages
axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('sitamu_token') || localStorage.getItem('sitamu_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor to handle session expiration (401/403) cleanly
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const isAuthRoute = window.location.pathname.startsWith('/admin');
      const isLoginRequest = error.config?.url?.includes('/api/auth/login');
      const isLoggingRequest = error.config?.url?.includes('/api/logs');

      // Request pencatatan log latar belakang tidak boleh membatalkan sesi login user
      if (isAuthRoute && !isLoginRequest && !isLoggingRequest) {
        sessionStorage.removeItem('sitamu_token');
        sessionStorage.removeItem('sitamu_user');
        sessionStorage.removeItem('sitamu_last_activity');
        sessionStorage.setItem(
          'sitamu_session_expired',
          'Sesi login Anda telah berakhir atau token tidak valid. Silakan login kembali.'
        );
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
