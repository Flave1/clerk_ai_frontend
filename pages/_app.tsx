import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';
import { useWebSocketStore, useUIStore } from '@/store';
import wsClient from '@/lib/ws';
import Header from '@/components/layout/Header';

export default function App({ Component, pageProps, router }: AppProps) {
  const { setConnected, setConnecting, setError } = useWebSocketStore();
  const { theme, setTheme, sidebarCollapsed } = useUIStore();
  
  // Check if current page should have layout
  const shouldShowLayout = router.pathname !== '/standalone-call' 
    && router.pathname !== '/landing'
    && router.pathname !== '/login'
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
      // Default to dark theme
      setTheme('dark');
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
        <title>AI Receptionist Dashboard</title>
        <meta name="description" content="AI Receptionist and Meeting Assistant Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {shouldShowLayout ? (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Header />
          
          {/* Main Content Area */}
          <main className={`transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'ml-0' : 'ml-64'
          }`}>
            <Component {...pageProps} />
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
