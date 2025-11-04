import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store';
import { getUser, isAuthenticated, getCurrentUser, getLastTokenSetTime } from '@/lib/auth';

// Shared flag to prevent concurrent getCurrentUser calls across all useAuth instances
let isVerifyingToken = false;
let verificationPromise: Promise<void> | null = null;
let hasVerifiedGlobally = false; // Track if token has been verified globally
const VERIFICATION_SKIP_WINDOW_MS = 2000; // Skip verification for 2 seconds after login

// Export function to reset verification state (called after login/register)
export const resetAuthVerification = () => {
  hasVerifiedGlobally = false;
};

/**
 * Hook for managing authentication state
 */
export const useAuth = () => {
  const router = useRouter();
  const { user, isAuthenticated: isAuth, setUser, setIsAuthenticated, logout } = useAuthStore();

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = getUser();
      const hasToken = isAuthenticated();
      
      if (storedUser && hasToken) {
        setUser(storedUser);
        setIsAuthenticated(true);
        
        // Only verify token if:
        // 1. Not already verifying globally
        // 2. Hasn't been verified globally yet
        // 3. Not within the skip window after login (token was just set)
        // This prevents duplicate API calls and race conditions
        const timeSinceTokenSet = Date.now() - getLastTokenSetTime();
        const shouldSkipVerification = timeSinceTokenSet < VERIFICATION_SKIP_WINDOW_MS;
        
        if (shouldSkipVerification) {
          // Token was just set (login/register), skip verification for now
          // Mark as verified temporarily to prevent immediate re-verification
          hasVerifiedGlobally = true;
          
          // Schedule verification after skip window expires
          setTimeout(() => {
            hasVerifiedGlobally = false;
            // Trigger re-check by re-running this effect if needed
          }, VERIFICATION_SKIP_WINDOW_MS - timeSinceTokenSet);
        } else if (!hasVerifiedGlobally && !isVerifyingToken) {
          // Time to verify the token
          isVerifyingToken = true;
          
          verificationPromise = getCurrentUser()
            .then((userData) => {
              // Update user data if it changed
              if (userData) {
                setUser({
                  user_id: userData.user_id,
                  email: userData.email,
                  name: userData.name,
                });
              }
              hasVerifiedGlobally = true; // Mark as verified on success
            })
            .catch((error) => {
              // Token invalid, clear auth state
              console.error('[useAuth] Token verification failed:', error);
              hasVerifiedGlobally = false;
              logout();
            })
            .finally(() => {
              isVerifyingToken = false;
              verificationPromise = null;
            });
        } else if (verificationPromise && !hasVerifiedGlobally) {
          // Another instance is verifying, wait for it
          verificationPromise
            .catch((error) => {
              // If verification failed, clear auth
              console.error('[useAuth] Token verification failed (waiting):', error);
              hasVerifiedGlobally = false;
              logout();
            });
        }
      } else {
        hasVerifiedGlobally = false; // Reset if no token
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, [setUser, setIsAuthenticated, logout]);

  const signOut = () => {
    logout();
    router.push('/login');
  };

  return {
    user,
    isAuthenticated: isAuth,
    signOut,
  };
};

/**
 * Hook for protecting routes - redirects to login if not authenticated
 */
export const useRequireAuth = () => {
  const router = useRouter();
  const { isAuthenticated: isAuth, isLoading } = useAuthStore();
  const isAuthFromStorage = typeof window !== 'undefined' && isAuthenticated();

  useEffect(() => {
    if (!isLoading && !isAuth && !isAuthFromStorage) {
      router.push('/login');
    }
  }, [isAuth, isAuthFromStorage, isLoading, router]);

  return { isAuthenticated: isAuth || isAuthFromStorage };
};

