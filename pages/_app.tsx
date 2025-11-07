import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';
import { useWebSocketStore, useUIStore, useAuthStore } from '@/store';
import wsClient from '@/lib/ws';
import Header from '@/components/layout/Header';
import TopBar from '@/components/layout/TopBar';
import { getUser, isAuthenticated } from '@/lib/auth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function App({ Component, pageProps, router }: AppProps) {
  const { setConnected, setConnecting, setError } = useWebSocketStore();
  const { theme, setTheme, sidebarCollapsed } = useUIStore();
  const { setUser, setIsAuthenticated } = useAuthStore();
  
  // Initialize auth state from localStorage (without verifying token - let useAuth handle that)
  // This prevents duplicate getCurrentUser calls
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = getUser();
      const hasToken = isAuthenticated();
      
      if (storedUser && hasToken) {
        setUser(storedUser);
        setIsAuthenticated(true);
        // Don't call getCurrentUser here - let useAuth hook handle token verification
        // This prevents duplicate API calls and race conditions
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, [setUser, setIsAuthenticated]);
  
  // Check if current page should have layout
  const shouldShowLayout = router.pathname !== '/standalone-call' 
    && router.pathname !== '/login'
    && router.pathname !== '/register'
    && router.pathname !== '/'
    && !router.pathname.startsWith('/join/');

  useEffect(() => {
    // Set up WebSocket event handlers
    const unsubscribeConnect = wsClient.onConnect(() => {
      setConnected(true);
      setConnecting(false);
      setError(null);
    });

    const unsubscribeDisconnect = wsClient.onDisconnect(() => {
      setConnected(false);
      setConnecting(false);
    });

    const unsubscribeError = wsClient.onError((error) => {
      setError('WebSocket connection error');
      setConnected(false);
      setConnecting(false);
    });

    // Clean up on unmount
    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeError();
    };
  }, [setConnected, setConnecting, setError]);

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Default to light theme
      setTheme('light');
    }
  }, [setTheme]);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save theme to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <>
      <Head>
        <title>Aurray Dashboard</title>
        <meta name="description" content="Aurray and Meeting Assistant Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {shouldShowLayout ? (
        <div className="min-h-screen bg-[#F7FAFC] dark:bg-[#0D1117] transition-colors duration-200">
          <Header />
          
          {/* Main Content Area */}
          <main className={`transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'ml-0' : 'ml-80'
          }`}>
            <ProtectedRoute>
              <TopBar />
              <Component {...pageProps} />
            </ProtectedRoute>
          </main>
        </div>
      ) : (
        // Standalone page without layout
        <Component {...pageProps} />
      )}
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme === 'dark' ? '#1f2937' : '#363636',
            color: '#fff',
            border: theme === 'dark' ? '1px solid #374151' : 'none',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}
