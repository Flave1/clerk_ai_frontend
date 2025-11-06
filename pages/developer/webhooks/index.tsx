import { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '@/components/layout/Header';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

interface Webhook {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST';
  description: string;
}

const WebhooksIndexPage: NextPage = () => {
  const router = useRouter();

  const webhooks: Webhook[] = [
    {
      id: 'voice_profiles',
      name: 'Get Voice Profiles',
      url: '/v1/api.auray.net/voice_profiles',
      method: 'GET',
      description: 'Get a list of available voice profiles for TTS',
    },
    {
      id: 'meeting_contexts',
      name: 'Get Meeting Contexts',
      url: '/v1/api.auray.net/meeting_contexts',
      method: 'GET',
      description: 'Get a list of meeting contexts for the authenticated user',
    },
    {
      id: 'join_meeting',
      name: 'Join Meeting',
      url: '/v1/api.auray.net/join_meeting',
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
        <title>Available Webhooks - Auray</title>
      </Head>
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <GlobeAltIcon className="h-8 w-8 mr-3 text-primary-600 dark:text-primary-400" />
            Available Webhooks
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Browse and test available API endpoints
          </p>
        </div>

        {/* Webhooks List */}
        <div className="bg-gray-900 dark:bg-gray-950 rounded-lg border border-gray-800 dark:border-gray-800 shadow-lg overflow-hidden">
          <div className="bg-gray-800 dark:bg-gray-900 px-6 py-4 border-b border-gray-700 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-white">Available Webhooks</h2>
          </div>
          
          <div className="divide-y divide-gray-800 dark:divide-gray-800">
            {webhooks.map((webhook, index) => (
              <button
                key={webhook.id}
                onClick={() => handleWebhookClick(webhook.id)}
                className={`w-full text-left p-6 hover:bg-gray-800 dark:hover:bg-gray-800 transition-colors ${
                  index === 0 ? 'bg-gray-800 dark:bg-gray-800 border-l-4 border-blue-500' : 'bg-gray-900 dark:bg-gray-900'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">{webhook.name}</h3>
                  <span className={`px-3 py-1 text-xs font-medium rounded ${
                    webhook.method === 'GET' 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-gray-700 text-white'
                  }`}>
                    {webhook.method}
                  </span>
                </div>
                <p className="text-sm text-gray-300 dark:text-gray-400 font-mono mb-2">
                  {webhook.url}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
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

