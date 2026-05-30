/**
 * AttendX - API Service
 * Axios instance with interceptors for auth tokens, base URL, and error handling.
 */
import axios from 'axios';
import { toast } from 'react-toastify';

/* Base API URL - points to the Express backend */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Create a pre-configured Axios instance.
 */
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Attaches auth token to every outgoing request.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('attendx_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles 401 (expired token), 403 (forbidden), network errors, etc.
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Network error
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    switch (status) {
      case 401:
        // Unauthorized - token expired or invalid
        localStorage.removeItem('attendx_token');
        delete api.defaults.headers.common['Authorization'];

        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
        }
        break;

      case 403:
        toast.error('You do not have permission to perform this action.');
        break;

      case 404:
        // Let the calling code handle 404s as needed
        break;

      case 422:
        // Validation errors
        if (data?.errors) {
          Object.values(data.errors).forEach((err) => {
            toast.error(Array.isArray(err) ? err[0] : err);
          });
        }
        break;

      case 500:
        toast.error('Server error. Please try again later.');
        break;

      default:
        break;
    }

    return Promise.reject(error);
  }
);

export default api;
