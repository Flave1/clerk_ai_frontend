import React from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * TopBar component that displays user greeting and welcome message
 */
export default function TopBar() {
  const { user } = useAuth();

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.name || 'User';

  return (
    <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
      <div className="flex items-center justify-start ml-7">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 font-semibold text-lg">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {getGreeting()}, {userName}!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome back to Auray
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

