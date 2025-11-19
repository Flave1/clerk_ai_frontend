import { useState } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
// Google button disabled - removed import
import toast from 'react-hot-toast';
import { signIn, isAuthenticated } from '@/lib/auth';
import EarlyAccessModal from '@/components/ui/EarlyAccessModal';
import { useUIStore } from '@/store';

export default function Login() {
  const router = useRouter();
  const { theme } = useUIStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEarlyAccessModalOpen, setIsEarlyAccessModalOpen] = useState(false);

  // Redirect if already authenticated
  if (typeof window !== 'undefined' && isAuthenticated()) {
    router.push('/dashboard');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await signIn({ email, password });
      
      if (result && result.access_token) {
        toast.success('Signed in successfully!');
        // Verify token is in localStorage before redirecting
        const { getAccessToken } = await import('@/lib/auth');
        const token = getAccessToken();
        if (!token) {
          console.error('[Login] Token not found in localStorage after sign in!');
          throw new Error('Token storage failed');
        }
        // Small delay to ensure everything is ready
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
      } else {
        throw new Error('Sign in failed - no token received');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      let errorMessage = 'Sign in failed';
      
      if (error.timeout) {
        errorMessage = 'Request timeout. Please check your connection and try again.';
      } else if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        // Handle different detail formats
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail) && detail.length > 0) {
          // Extract messages from validation errors
          errorMessage = detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
        } else if (typeof detail === 'object') {
          errorMessage = detail.msg || detail.message || JSON.stringify(detail);
        } else {
          errorMessage = String(detail);
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.isNetworkError) {
        errorMessage = `Unable to connect to server. Please check if the backend is running at ${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Head>
        <title>Login - Aurray</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-200 ${
        theme === 'dark'
          ? 'bg-[#0D1117] text-[#E5E7EB]'
          : 'bg-[#F7FAFC] text-[#1C1C1C]'
      }`}>
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-accent-500/10 to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full filter blur-3xl animate-pulse delay-700" />
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-md px-6"
        >
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent mb-2"
            >
              Aurray
            </motion.h1>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Welcome back! Sign in to continue.
            </p>
          </div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`backdrop-blur-lg border rounded-2xl p-8 shadow-xl ${
              theme === 'dark'
                ? 'bg-[#161B22]/50 border-primary-500/20'
                : 'bg-white border-primary-500/30'
            }`}
          >
            {/* Google Sign-in Button - Disabled */}
            <motion.button
              whileHover={{ scale: 1 }}
              whileTap={{ scale: 1 }}
              onClick={(e) => {
                e.preventDefault();
                toast.error('Google sign-in is currently disabled');
              }}
              disabled={true}
              className={`w-full py-3 px-4 border rounded-xl font-medium flex items-center justify-center gap-3 transition-all duration-300 mb-6 opacity-50 cursor-not-allowed ${
                theme === 'dark'
                  ? 'bg-white/5 border-white/10'
                  : 'bg-gray-100 border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#4285F4' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google (Disabled)</span>
            </motion.button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${
                  theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                }`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-4 ${
                  theme === 'dark'
                    ? 'bg-[#161B22]/50 text-gray-400'
                    : 'bg-white text-gray-600'
                }`}>Or continue with email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email/Username Field */}
              <div>
                <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email or Username
                </label>
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="off"
                  className={`w-full px-4 py-3 border rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all duration-300 disabled:opacity-50 ${
                    theme === 'dark'
                      ? 'bg-[#0D1117]/50 border-primary-500/20 text-white'
                      : 'bg-white border-primary-500/30 text-gray-900'
                  }`}
                  placeholder="you@example.com"
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="off"
                  className={`w-full px-4 py-3 border rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all duration-300 disabled:opacity-50 ${
                    theme === 'dark'
                      ? 'bg-[#0D1117]/50 border-primary-500/20 text-white'
                      : 'bg-white border-primary-500/30 text-gray-900'
                  }`}
                  placeholder="••••••••"
                />
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-end">
                <a
                  href="#"
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors duration-200"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl font-semibold text-white shadow-lg shadow-primary-500/50 hover:shadow-primary-500/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Don't have an account?{' '}
                <button
                  onClick={() => setIsEarlyAccessModalOpen(true)}
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors duration-200"
                >
                  Sign up
                </button>
              </span>
            </div>
          </motion.div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className={`text-sm transition-colors duration-200 flex items-center justify-center gap-2 ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </a>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>

      {/* Early Access Modal */}
      <EarlyAccessModal
        isOpen={isEarlyAccessModalOpen}
        onClose={() => setIsEarlyAccessModalOpen(false)}
      />
    </>
  );
}

