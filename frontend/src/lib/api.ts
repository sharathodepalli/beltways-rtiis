import axios from "axios";

// Use environment variable, or detect production URL, or fallback to localhost
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // If running on Railway (production), use the backend URL
  if (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')) {
    return 'https://beltways-rtiis-production.up.railway.app';
  }
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});
