import Axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, removeAccessToken } from './auth';

// Use relative path '/api' - Next.js rewrites handle forwarding to backend
// This allows simple API calls like: fetch('/api/auth/signin')
function resolveBaseUrl(): string {
  return '/api';
}

const axiosInstance = Axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 60000, // Increased to 60 seconds to prevent premature timeouts
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add access token to headers
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Don't add auth token for public auth endpoints (register, signin, google oauth, newsletter)
    // But DO add it for protected endpoints like /auth/me
    const publicAuthEndpoints = ['/auth/register', '/auth/signin', '/auth/google', '/newsletter'];
    const isPublicAuthEndpoint = config.url && publicAuthEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (!isPublicAuthEndpoint) {
      // Get token from localStorage
      const token = getAccessToken();
      
      // Add Authorization header if token exists
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Build full URL for logging
    const fullUrl = `${config.baseURL}${config.url}`;
    
    // Log request in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${fullUrl}`);
      console.log('[API Request] Headers:', config.headers);
      console.log('[API Request] Data:', config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token expiration
axiosInstance.interceptors.response.use(
  (res) => {
    // Log successful response in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[API Response] ${res.config.method?.toUpperCase()} ${res.config.url} - ${res.status}`);
    }
    return res;
  },
  (error: AxiosError) => {
    // Build full URL for logging
    const fullUrl = error?.config ? `${error.config.baseURL}${error.config.url}` : 'unknown';
    
    // Handle network errors (CORS, connection refused, etc.)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('[API Network Error]', {
        fullUrl,
        method: error?.config?.method,
        code: error.code,
        message: error.message,
        baseURL: error?.config?.baseURL,
        url: error?.config?.url,
      });
      
      // Provide helpful error message
      const networkError = {
        ...error,
        message: `Network error: Unable to connect to ${error?.config?.baseURL || 'the server'}. Please check if the server is running and accessible.`,
        isNetworkError: true,
      };
      
      return Promise.reject(networkError);
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('[API Timeout]', {
        fullUrl,
        method: error?.config?.method,
        timeout: error?.config?.timeout,
      });
      // Don't redirect on timeout, just return error
      return Promise.reject({
        ...error,
        message: 'Request timeout. Please try again.',
        timeout: true,
      });
    }
    
    // Handle 401 Unauthorized and 403 Forbidden - token expired, invalid, or insufficient permissions
    // But don't redirect if it's a public auth endpoint (register/signin/newsletter)
    const publicAuthEndpoints = ['/auth/register', '/auth/signin', '/auth/google', '/newsletter'];
    const isPublicAuthEndpoint = error?.config?.url && publicAuthEndpoints.some(endpoint => error.config.url?.includes(endpoint));
    
    if ((error.response?.status === 401 || error.response?.status === 403) && !isPublicAuthEndpoint) {
      console.warn(`[API Auth Error] ${error.response?.status} - Clearing token and redirecting to login`);
      // Remove invalid token
      removeAccessToken();
      
      // Redirect to login if not already there (only on client side)
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Surface useful debug info in dev
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[API Error]', {
        fullUrl,
        method: error?.config?.method,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message,
        code: error.code,
        request: error?.request,
      });
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;


