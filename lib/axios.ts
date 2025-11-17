import Axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, removeAccessToken } from './auth';

function resolveApiOrigin(): string {
  // Only use NEXT_PUBLIC_* variables for static export compatibility
  // Check if env var exists and is not empty
  const envOrigin = process.env.NEXT_PUBLIC_API_URL;
  const origin = (envOrigin && envOrigin.trim()) || 'https://api.auray.net';

  // Always return a valid URL - never return empty string
  if (origin && origin.trim()) {
    return origin.replace(/\/$/, '');
  }

  // Fallback to window.location.origin if in browser
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin.replace(/\/$/, '');
  }

  // Final fallback - never return empty string
  return 'https://api.auray.net';
}

function resolveApiPrefix(): string {
  const prefix =
    process.env.NEXT_PUBLIC_API_PREFIX ||
    process.env.API_PREFIX ||
    '/api/v1';

  if (!prefix) {
    return '';
  }

  const normalized = prefix.startsWith('/') ? prefix : `/${prefix}`;
  return normalized.replace(/\/$/, '');
}

export const API_ORIGIN = resolveApiOrigin();
export const API_PREFIX = resolveApiPrefix();
export const API_BASE_URL = API_ORIGIN;

// Helper function to validate and normalize a URL
function getValidatedBaseURL(url: string): string {
  if (!url || url.trim() === '') {
    console.warn('[Axios Config] URL is empty, using default');
    return 'https://api.auray.net';
  }
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    console.warn('[Axios Config] URL is not absolute, prepending https://');
    return `https://${trimmed}`;
  }
  return trimmed;
}

// Validate and ensure baseURL is a valid absolute URL
const validatedBaseURL = getValidatedBaseURL(API_BASE_URL);

const axiosInstance = Axios.create({
  baseURL: validatedBaseURL,
  timeout: 60000, // Increased to 60 seconds to prevent premature timeouts
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add access token to headers
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      // Ensure baseURL is valid and absolute (runtime validation)
      if (!config.baseURL || config.baseURL.trim() === '') {
        console.error('[Axios Request] Invalid baseURL:', config.baseURL);
        config.baseURL = validatedBaseURL;
      } else {
        config.baseURL = getValidatedBaseURL(config.baseURL);
      }
      
      // Validate that baseURL is a valid URL
      if (config.baseURL) {
        try {
          new URL(config.baseURL);
        } catch (e) {
          console.error('[Axios Request] baseURL is not a valid URL:', config.baseURL, e);
          config.baseURL = validatedBaseURL;
        }
      }
      
      if (config.url && !config.url.startsWith('http') && !config.url.startsWith('/')) {
        config.url = `/${config.url}`;
      }
      
      // Validate the full URL construction
      if (config.baseURL && config.url) {
        try {
          const testUrl = config.url.startsWith('http') 
            ? config.url 
            : `${config.baseURL}${config.url}`;
          new URL(testUrl);
        } catch (e) {
          console.error('[Axios Request] Invalid URL construction:', {
            baseURL: config.baseURL,
            url: config.url,
            error: e
          });
          // Fallback: ensure we have a valid baseURL
          config.baseURL = validatedBaseURL;
        }
      }
    } catch (error) {
      console.error('[Axios Request] Error in request interceptor:', error);
      // Ensure we always have a valid baseURL
      config.baseURL = validatedBaseURL;
    }

    // Don't add auth token for public auth endpoints (register, signin, google oauth, newsletter)
    // But DO add it for protected endpoints like /auth/me
    const publicAuthEndpoints = [
      `${API_PREFIX}/auth/register`,
      `${API_PREFIX}/auth/signin`,
      `${API_PREFIX}/auth/google`,
      `${API_PREFIX}/newsletter`,
    ];
    const isPublicAuthEndpoint = config.url && publicAuthEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (!isPublicAuthEndpoint) {
      // Get token from localStorage
      const token = getAccessToken();
      
      // Add Authorization header if token exists
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        // Log in development to debug token issues
        if (process.env.NODE_ENV !== 'production') {
          // console.log(`[API Request] Adding Authorization header for ${config.url}`);
          // console.log(`[API Request] Token present: ${!!token}, Token length: ${token.length}`);
        }
      } else {
        // Log warning if token is missing for protected endpoint (always log this - critical for debugging)
        // // console.warn(`[API Request] No token found for protected endpoint: ${config.url}`);
        // console.warn(`[API Request] Token check: ${!!token}, isPublicAuthEndpoint: ${isPublicAuthEndpoint}`);
        // console.warn(`[API Request] localStorage check:`, typeof window !== 'undefined' ? localStorage.getItem('clerk_access_token') : 'N/A (SSR)');
      }
    }
    
    // Build full URL for logging
    const fullUrl = config.url?.startsWith('http')
      ? config.url
      : `${config.baseURL || API_ORIGIN}${config.url || ''}`;
    
    // Log request in development (always log headers to debug auth issues)
    if (process.env.NODE_ENV !== 'production') {
      const authHeader = config.headers?.Authorization;
      const authHeaderStr = typeof authHeader === 'string' ? authHeader : String(authHeader || '');
    //   console.log(`[API Request] ${config.method?.toUpperCase()} ${fullUrl}`);
    //   console.log('[API Request] Headers:', {
    //     ...config.headers,
    //     Authorization: authHeaderStr ? `${authHeaderStr.substring(0, 20)}...` : 'NOT SET'
    //   });
    //   console.log('[API Request] Data:', config.data);
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
      // console.log(`[API Response] ${res.config.method?.toUpperCase()} ${res.config.url} - ${res.status}`);
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
    // But don't redirect if it's a public auth endpoint (register/signin/newsletter) or /auth/me (used to check auth status)
    // Also don't redirect if we're on the landing page or other public pages
    const publicAuthEndpoints = [
      `${API_PREFIX}/auth/register`,
      `${API_PREFIX}/auth/signin`,
      `${API_PREFIX}/auth/google`,
      `${API_PREFIX}/newsletter`,
      `${API_PREFIX}/auth/me`,
    ];
    const isPublicAuthEndpoint = error?.config?.url && publicAuthEndpoints.some(endpoint => error.config.url?.includes(endpoint));
    const publicPages = ['/', '/login', '/register'];
    const isPublicPage = typeof window !== 'undefined' && publicPages.some(page => window.location.pathname === page);
    
    // Check if this is a 401 (authentication required) vs 403 (authorization denied)
    // 401 means token is missing/invalid - but only redirect if token was actually sent
    // If no token was sent, it might be a race condition - don't redirect immediately
    if (error.response?.status === 401 && !isPublicAuthEndpoint && !isPublicPage) {
      const token = getAccessToken();
      const hadToken = !!token;
      const authHeader = error?.config?.headers?.Authorization || error?.config?.headers?.authorization;
      const tokenWasSent = !!authHeader;
      
      console.warn(`[API Auth Error] 401 - Authentication failed`);
      console.warn(`[API Auth Error] Request URL: ${error?.config?.url}`);
      console.warn(`[API Auth Error] Token in localStorage: ${hadToken}`);
      console.warn(`[API Auth Error] Token was sent in request: ${tokenWasSent}`);
      console.warn(`[API Auth Error] Error detail:`, error.response?.data);
      
      // Only redirect if:
      // 1. Token was sent but still got 401 (token is invalid/expired), OR
      // 2. No token exists and we're not on a public page (user needs to login)
      // Don't redirect if token exists but wasn't sent (race condition - let it retry)
      if (tokenWasSent || !hadToken) {
        console.warn(`[API Auth Error] Token was ${tokenWasSent ? 'sent but invalid' : 'missing'}. Clearing and redirecting.`);
        
        // Remove invalid/missing token
        removeAccessToken();
        
        // Redirect to login if not already there (only on client side)
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      } else {
        // Token exists but wasn't sent - might be a race condition
        // Log but don't redirect - the request will likely retry with token
        console.warn(`[API Auth Error] Token exists but wasn't sent. This might be a race condition. Not redirecting.`);
      }
    } else if (error.response?.status === 403 && !isPublicAuthEndpoint && !isPublicPage) {
      // 403 Forbidden - log details but don't redirect immediately
      // This could be a temporary authorization issue or the backend still returning 403
      console.error(`[API Auth Error] 403 Forbidden - Authorization denied`);
      console.error(`[API Auth Error] Request URL: ${error?.config?.url}`);
      console.error(`[API Auth Error] Response:`, error.response?.data);
      console.error(`[API Auth Error] Token present: ${!!getAccessToken()}`);
      
      // Only redirect if we're sure the token is invalid (e.g., "Invalid authentication credentials")
      const errorData = error.response?.data as any;
      const errorDetail = (errorData?.detail || errorData?.message || '').toString();
      if (errorDetail.includes('Invalid') || errorDetail.includes('authentication') || errorDetail.includes('token')) {
        console.warn(`[API Auth Error] Token appears invalid based on error message. Clearing and redirecting.`);
        removeAccessToken();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      } else {
        // For other 403 errors, just log - might be authorization issue, not authentication
        console.warn(`[API Auth Error] 403 may be an authorization issue, not redirecting. Error: ${errorDetail}`);
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


