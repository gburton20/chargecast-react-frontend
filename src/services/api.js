import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://chargecast-backend.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const carbonAPI = {
  health: () => api.get('/health/'),
  getHistory7d: (postcode) => api.get('/carbon/regional/history-7d/', { params: { postcode } }),
  getCurrent30m: (postcode) => api.get('/carbon/regional/current-30m/', { params: { postcode } }),
  getForecast48h: (postcode) => api.get('/carbon/regional/forecast-48h/', { params: { postcode } }),
};

export default api;