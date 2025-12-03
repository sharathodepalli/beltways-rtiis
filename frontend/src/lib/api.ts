import axios from "axios";

// Production backend URL (no port - Railway handles routing)
const PRODUCTION_API_URL = 'https://beltways-rtiis-production.up.railway.app';

// Determine API base URL based on environment
const getApiBaseUrl = (): string => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Production detection - if on railway.app or any HTTPS, use production backend
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('railway.app') || 
        window.location.protocol === 'https:') {
      return PRODUCTION_API_URL;
    }
  }
  
  // Local development
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});
