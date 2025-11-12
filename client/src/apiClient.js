import axios from 'axios';

const rawBaseUrl = (process.env.REACT_APP_API_BASE_URL || '').trim();
const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: normalizedBaseUrl || undefined
});

export default apiClient;
