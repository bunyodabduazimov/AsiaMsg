import axios from 'axios';
import { authStore } from '@/stores/auth.store';
import { connectSocket } from '@/services/socket';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

export const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

http.interceptors.request.use(config => {
  const token = authStore.getAccessToken();
  if (token) {
    const headers = (config as any).headers ?? {};
    (config as any).headers = headers;
    headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config as any;
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      throw error;
    }

    const refreshToken = authStore.getRefreshToken();
    if (!refreshToken) {
      authStore.clearSession();
      throw error;
    }

    originalRequest._retry = true;
    try {
      const { data } = await refreshClient.post('/auth/refresh', { refreshToken });
      authStore.saveSession(data);
      connectSocket(data.accessToken);
      const headers = originalRequest.headers ?? {};
      originalRequest.headers = headers;
      headers.Authorization = `Bearer ${data.accessToken}`;
      return http(originalRequest);
    } catch (refreshError) {
      authStore.clearSession();
      throw refreshError;
    }
  }
);
