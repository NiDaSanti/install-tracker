import axios from 'axios';
import { getToken, clearToken } from './auth';

const rawBaseUrl = (
  process.env.REACT_APP_API_BASE_URL
  || process.env.REACT_APP_API_URL
  || ''
).trim();
const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: normalizedBaseUrl || undefined
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('install-tracker:unauthorized'));
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
