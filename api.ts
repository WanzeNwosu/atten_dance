// src/utils/api.ts
import axios from 'axios';
import toast from 'react-hot-toast';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach stored token on startup
const stored = localStorage.getItem('attendx-auth');
if (stored) {
  try {
    const { state } = JSON.parse(stored);
    if (state?.accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
    }
  } catch { /* ignore */ }
}

// Response interceptor — auto-refresh on 401
let isRefreshing = false;
let failedQueue: any[] = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const stored = localStorage.getItem('attendx-auth');
        const { state } = JSON.parse(stored || '{}');
        const refreshToken = state?.refreshToken;

        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );
        const { accessToken, refreshToken: newRefresh } = res.data.data;

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        // Update persisted store
        const { useAuthStore } = await import('../store/authStore');
        useAuthStore.getState().setTokens(accessToken, newRefresh);

        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        const { useAuthStore } = await import('../store/authStore');
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Show error toast for non-401 errors
    const message = error.response?.data?.error || error.message || 'An error occurred';
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);
