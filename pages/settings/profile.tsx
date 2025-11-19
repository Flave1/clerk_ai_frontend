import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  GlobeAltIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import TopBar from '@/components/layout/TopBar';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ProfilePage: NextPage = () => {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    timezone: 'UTC',
  });

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const userData = await apiClient.getCurrentUser();
        setProfile(userData);
        setFormData({
          name: userData.name || '',
          phone: userData.phone || '',
          timezone: userData.timezone || 'UTC',
        });
      } catch (error: any) {
        console.error('Failed to load profile:', error);
        toast.error('Failed to load profile information');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setSaving(true);
      const updatedProfile = await apiClient.updateUserProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        timezone: formData.timezone,
      });

      setProfile(updatedProfile);
      
      // Update auth store with new name
      if (authUser) {
        setUser({
          ...authUser,
          name: updatedProfile.name,
        });
      }

      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Common timezones
  const timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  ];

  if (loading) {
    return (
      <>
        <Head>
          <title>Profile - Aurray</title>
        </Head>
        <TopBar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your personal information and account details
          </p>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {formData.name.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {formData.name || 'User'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.email}</p>
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center space-x-2">
                    <UserCircleIcon className="h-5 w-5" />
                    <span>Full Name</span>
                  </div>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Email Field (Read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center space-x-2">
                    <EnvelopeIcon className="h-5 w-5" />
                    <span>Email Address</span>
                  </div>
                </label>
                <input
                  type="email"
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Email cannot be changed
                </p>
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center space-x-2">
                    <PhoneIcon className="h-5 w-5" />
                    <span>Phone Number</span>
                  </div>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your phone number (optional)"
                />
              </div>

              {/* Timezone Field */}
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center space-x-2">
                    <GlobeAltIcon className="h-5 w-5" />
                    <span>Timezone</span>
                  </div>
                </label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Info */}
              {profile && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Account Created</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Last Updated</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {new Date(profile.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ scale: saving ? 1 : 1.02 }}
                whileTap={{ scale: saving ? 1 : 0.98 }}
                className="px-6 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default ProfilePage;
