import { useMemo } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '@/components/layout/Header';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useUIStore } from '@/store';
import { API_ORIGIN, API_PREFIX } from '@/lib/axios';

interface Webhook {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST';
  description: string;
}

const WebhooksIndexPage: NextPage = () => {
  const router = useRouter();
  const { theme } = useUIStore();

  const webhookDisplayBase = useMemo(() => {
    const envOrigin =
      API_ORIGIN ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_ORIGIN ||
      '';

    if (envOrigin) {
      return `${envOrigin.replace(/\/$/, '')}${API_PREFIX}/ws`;
    }

    if (typeof window !== 'undefined') {
      return `${window.location.origin}${API_PREFIX}/ws`;
    }

    return `${API_PREFIX}/ws`;
  }, []);

  const webhooks: Webhook[] = [
    {
      id: 'voice_profiles',
      name: 'Get Voice Profiles',
      url: `${webhookDisplayBase}/voice_profiles`,
      method: 'GET',
      description: 'Get a list of available voice profiles for TTS',
    },
    {
      id: 'meeting_contexts',
      name: 'Get Meeting Contexts',
      url: `${webhookDisplayBase}/meeting_contexts`,
      method: 'GET',
      description: 'Get a list of meeting contexts for the authenticated user',
    },
    {
      id: 'join_meeting',
      name: 'Join Meeting',
      url: `${webhookDisplayBase}/join_meeting`,
      method: 'POST',
      description: 'Join a meeting with AI assistant capabilities',
    },
  ];

  const handleWebhookClick = (webhookId: string) => {
    router.push(`/developer/webhooks/${webhookId}`);
  };

  return (
    <>
      <Head>
        <title>Available Webhooks - Aurray</title>
      </Head>
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold flex items-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            <GlobeAltIcon className={`h-8 w-8 mr-3 ${
              theme === 'dark' ? 'text-primary-400' : 'text-primary-600'
            }`} />
            Available Webhooks
          </h1>
          <p className={`mt-2 text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Browse and test available API endpoints
          </p>
        </div>

        {/* Webhooks List */}
        <div className={`rounded-lg border shadow-lg overflow-hidden ${
          theme === 'dark'
            ? 'bg-[#161B22] border-gray-700/50'
            : 'bg-white border-gray-200'
        }`}>
          <div className={`px-6 py-4 border-b ${
            theme === 'dark'
              ? 'bg-[#0D1117] border-gray-700/50'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Available Webhooks</h2>
          </div>
          
          <div className={`divide-y ${
            theme === 'dark' ? 'divide-gray-700/50' : 'divide-gray-200'
          }`}>
            {webhooks.map((webhook, index) => (
              <button
                key={webhook.id}
                onClick={() => handleWebhookClick(webhook.id)}
                className={`w-full text-left p-6 transition-colors ${
                  index === 0
                    ? theme === 'dark'
                      ? 'bg-[#0D1117] border-l-4 border-primary-500'
                      : 'bg-gray-50 border-l-4 border-primary-500'
                    : theme === 'dark'
                      ? 'bg-[#161B22] hover:bg-[#0D1117]'
                      : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`text-xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{webhook.name}</h3>
                  <span className={`px-3 py-1 text-xs font-medium rounded ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {webhook.method}
                  </span>
                </div>
                <p className={`text-sm font-mono mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {webhook.url}
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {webhook.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default WebhooksIndexPage;

