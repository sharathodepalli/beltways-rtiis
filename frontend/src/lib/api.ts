import axios from "axios";

// Determine API base URL based on environment
const getApiBaseUrl = (): string => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Production detection - if on railway.app, use HTTPS backend
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('railway.app')) {
      // Always use HTTPS for Railway
      return 'https://beltways-rtiis-production.up.railway.app';
    }
    // If on any HTTPS site, ensure we use HTTPS for API
    if (window.location.protocol === 'https:') {
      return 'https://beltways-rtiis-production.up.railway.app';
    }
  }
  
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL); // Debug log

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});
