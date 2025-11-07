import { useState } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { register } from '@/lib/auth';
import { isAuthenticated } from '@/lib/auth';
import LaunchingSoonBanner from '@/components/ui/LaunchingSoonBanner';
import EarlyAccessModal from '@/components/ui/EarlyAccessModal';
import { useUIStore } from '@/store';

export default function Register() {
  const router = useRouter();
  const { theme } = useUIStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEarlyAccessModalOpen, setIsEarlyAccessModalOpen] = useState(false);

  // Redirect if already authenticated
  if (typeof window !== 'undefined' && isAuthenticated()) {
    router.push('/dashboard');
    return null;
  }

  // Password validation helper - simple: alphanumeric + special characters
  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (password.length > 72) {
      return 'Password must be no longer than 72 characters';
    }
    // Check if password contains at least one alphanumeric character
    if (!/[a-zA-Z0-9]/.test(password)) {
      return 'Password must contain at least one letter or number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Frontend validation
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    
    try {
      const result = await register({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
      });
      
      if (result && result.access_token) {
        toast.success('Account created successfully!');
        // Small delay to ensure token is stored
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
      } else {
        throw new Error('Registration failed - no token received');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed';
      let detailString = '';
      
      if (error.timeout) {
        errorMessage = 'Request timeout. Please check your connection and try again.';
      } else if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        // Handle different detail formats
        if (typeof detail === 'string') {
          errorMessage = detail;
          detailString = detail;
        } else if (Array.isArray(detail) && detail.length > 0) {
          // Extract messages from validation errors
          errorMessage = detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
          detailString = detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
        } else if (typeof detail === 'object') {
          errorMessage = detail.msg || detail.message || JSON.stringify(detail);
          detailString = String(detail.msg || detail.message || JSON.stringify(detail));
        } else {
          errorMessage = String(detail);
          detailString = String(detail);
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.isNetworkError) {
        errorMessage = `Unable to connect to server. Please check if the backend is running at ${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL}`;
      }
      
      toast.error(errorMessage);
      
      // Set field-specific errors if available
      if (detailString) {
        const detailLower = detailString.toLowerCase();
        if (detailLower.includes('email') || detailLower.includes('already exists')) {
          setErrors({ email: detailString });
        } else if (detailLower.includes('password')) {
          setErrors({ password: detailString });
        } else if (detailLower.includes('name')) {
          setErrors({ name: detailString });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up - Aurray</title>
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

        {/* Register Form */}
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
              Create your account to get started
            </p>
          </div>

          {/* Register Card */}
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
            {/* Launching Soon Banner */}
            <div className="mb-6">
              <LaunchingSoonBanner onJoinWaitlist={() => setIsEarlyAccessModalOpen(true)} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  required
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all duration-300 disabled:opacity-50 ${
                    errors.name
                      ? 'border-red-500/50'
                      : theme === 'dark'
                        ? 'bg-[#0D1117]/50 border-primary-500/20 text-white'
                        : 'bg-white border-primary-500/30 text-gray-900'
                  }`}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  required
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all duration-300 disabled:opacity-50 ${
                    errors.email
                      ? 'border-red-500/50'
                      : theme === 'dark'
                        ? 'bg-[#0D1117]/50 border-primary-500/20 text-white'
                        : 'bg-white border-primary-500/30 text-gray-900'
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Phone <span className={`text-xs ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>(Optional)</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all duration-300 disabled:opacity-50 ${
                    theme === 'dark'
                      ? 'bg-[#0D1117]/50 border-primary-500/20 text-white'
                      : 'bg-white border-primary-500/30 text-gray-900'
                  }`}
                  placeholder="+1234567890"
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  required
                  minLength={6}
                  maxLength={72}
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all duration-300 disabled:opacity-50 ${
                    errors.password
                      ? 'border-red-500/50'
                      : theme === 'dark'
                        ? 'bg-[#0D1117]/50 border-primary-500/20 text-white'
                        : 'bg-white border-primary-500/30 text-gray-900'
                  }`}
                  placeholder="••••••••"
                />
                {errors.password ? (
                  <p className="mt-1 text-xs text-red-400">{errors.password}</p>
                ) : (
                  <p className={`mt-1 text-xs ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Must be 6-72 characters with letters, numbers, and/or special characters
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                  }}
                  required
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all duration-300 disabled:opacity-50 ${
                    errors.confirmPassword
                      ? 'border-red-500/50'
                      : theme === 'dark'
                        ? 'bg-[#0D1117]/50 border-primary-500/20 text-white'
                        : 'bg-white border-primary-500/30 text-gray-900'
                  }`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>
                )}
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
                    <span>Creating account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </motion.button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Already have an account?{' '}
                <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors duration-200">
                  Sign in
                </Link>
              </span>
            </div>
          </motion.div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
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
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Early Access Modal */}
      <EarlyAccessModal
        isOpen={isEarlyAccessModalOpen}
        onClose={() => setIsEarlyAccessModalOpen(false)}
      />
    </>
  );
}

