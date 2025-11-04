/**
 * Authentication service for managing user authentication
 */
import axiosInstance from './axios';

export interface User {
  user_id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  name: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  timezone?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface GoogleOAuthRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  timezone?: string;
}

const TOKEN_KEY = 'clerk_access_token';
const USER_KEY = 'clerk_user';

// Global timestamp for when token was last set (used to skip verification right after login)
let lastTokenSetTime = 0;

/**
 * Get the timestamp when token was last set
 */
export const getLastTokenSetTime = (): number => {
  return lastTokenSetTime;
};

/**
 * Store access token in localStorage
 */
export const setAccessToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    // Update timestamp to skip verification right after login
    lastTokenSetTime = Date.now();
  }
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

/**
 * Remove access token from localStorage
 */
export const removeAccessToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

/**
 * Store user info in localStorage
 */
export const setUser = (user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

/**
 * Get user info from localStorage
 */
export const getUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getAccessToken() !== null;
};

/**
 * Register a new user
 */
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  try {
    const baseURL = axiosInstance.defaults.baseURL || 'unknown';
    console.log('[Auth] Registering user:', data.email);
    console.log('[Auth] API Base URL:', baseURL);
    console.log('[Auth] Full URL will be:', `${baseURL}/auth/register`);
    
    const response = await axiosInstance.post('/auth/register', data, {
      timeout: 60000, // 60 seconds timeout for registration
    });
    
    const authData: AuthResponse = response.data;
    
    if (!authData.access_token) {
      throw new Error('No access token received from server');
    }
    
    // Store token and user info
    setAccessToken(authData.access_token);
    setUser({
      user_id: authData.user_id,
      email: authData.email,
      name: authData.name,
    });
    
    console.log('[Auth] Registration successful for:', authData.email);
    return authData;
  } catch (error: any) {
    console.error('[Auth] Registration error:', error);
    console.error('[Auth] Error details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      config: error.config,
    });
    throw error;
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async (data: SignInRequest): Promise<AuthResponse> => {
  try {
    console.log('[Auth] Signing in user:', data.email);
    const response = await axiosInstance.post('/auth/signin', data, {
      timeout: 60000, // 60 seconds timeout for sign in
    });
    const authData: AuthResponse = response.data;
    
    if (!authData.access_token) {
      throw new Error('No access token received from server');
    }
    
    // Store token and user info
    setAccessToken(authData.access_token);
    setUser({
      user_id: authData.user_id,
      email: authData.email,
      name: authData.name,
    });
    
    console.log('[Auth] Sign in successful for:', authData.email);
    return authData;
  } catch (error: any) {
    console.error('[Auth] Sign in error:', error);
    throw error;
  }
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async (data: GoogleOAuthRequest): Promise<AuthResponse> => {
  const response = await axiosInstance.post('/auth/google', data);
  const authData: AuthResponse = response.data;
  
  // Store token and user info
  setAccessToken(authData.access_token);
  setUser({
    user_id: authData.user_id,
    email: authData.email,
    name: authData.name,
  });
  
  return authData;
};

/**
 * Get current user info
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await axiosInstance.get('/auth/me');
  const user: User = response.data;
  
  // Update stored user info
  setUser(user);
  
  return user;
};

/**
 * Sign out current user
 */
export const signOut = (): void => {
  removeAccessToken();
  
  // Redirect to login if on client side
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};
