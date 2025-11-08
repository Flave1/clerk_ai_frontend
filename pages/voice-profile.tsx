import { NextPage } from 'next';
import Head from 'next/head';
import Header from '@/components/layout/Header';
import { MicrophoneIcon } from '@heroicons/react/24/outline';

const VoiceProfile: NextPage = () => {
  return (
    <>
      <Head>
        <title>Voice Profile - Aurray</title>
      </Head>

      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 mb-6">
              <MicrophoneIcon className="h-12 w-12 text-primary-600 dark:text-primary-400" />
            </div>
            
            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Voice Profile
            </h1>
            
            {/* Coming Soon Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
              Coming Soon
            </div>
            
            {/* Description */}
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
              We're working on bringing you an amazing voice profile feature. 
              This will allow you to customize and personalize your AI assistant's voice settings.
            </p>
            
            {/* Feature Preview */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
              <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="text-primary-600 dark:text-primary-400 mb-3">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Voice Customization
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Customize pitch, speed, and tone to match your preferences
                </p>
              </div>
              
              <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="text-primary-600 dark:text-primary-400 mb-3">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Voice Cloning
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Train the AI to speak in your voice for a personalized experience
                </p>
              </div>
              
              <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="text-primary-600 dark:text-primary-400 mb-3">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Settings Sync
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your voice preferences sync across all your devices
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VoiceProfile;

