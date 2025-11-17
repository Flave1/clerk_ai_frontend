import { useState, useEffect, useMemo } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { 
  ArrowLeftIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Axios from 'axios';
import { useUIStore } from '@/store';
import { API_ORIGIN, API_PREFIX } from '@/lib/axios';

interface WebhookResponse {
  success?: boolean;
  [key: string]: any;
}

const WebhookDetailPage: NextPage = () => {
  const router = useRouter();
  const { theme } = useUIStore();
  const { webhookId } = router.query;
  const [manualApiKey, setManualApiKey] = useState<string>('');
  const [response, setResponse] = useState<WebhookResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requestPayload, setRequestPayload] = useState<any>({});

  const webhookConfig = useMemo(() => {
    const origin =
      API_ORIGIN ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_ORIGIN ||
      (typeof window !== 'undefined' ? window.location.origin : '');

    const displayBase = origin ? `${origin.replace(/\/$/, '')}${API_PREFIX}/ws` : `${API_PREFIX}/ws`;
    const requestBase = origin ? `${origin.replace(/\/$/, '')}${API_PREFIX}/ws` : `${API_PREFIX}/ws`;

    return {
      displayBase,
      requestBase,
    };
  }, []);

  const webhooks: Record<string, any> = useMemo(() => ({
    join_meeting: {
      name: 'Join Meeting',
      displayUrl: `${webhookConfig.displayBase}/join_meeting`,
      requestUrl: `${webhookConfig.requestBase}/join_meeting`,
      method: 'POST',
      description: 'Join a meeting with AI assistant capabilities',
      defaultPayload: {
        meeting_url: 'https://teams.live.com/meet/9318960718018?p=J453ke6nEPHvg5kJGq',
        type: 'teams',
        transcript: true,
        audio_record: false,
        video_record: false,
        voice_id: 'f5HLTX707KIM4SzJYzSz',
        bot_name: 'Aurray Bot',
        context_id: null,
      },
    },
    voice_profiles: {
      name: 'Get Voice Profiles',
      displayUrl: `${webhookConfig.displayBase}/voice_profiles`,
      requestUrl: `${webhookConfig.requestBase}/voice_profiles`,
      method: 'GET',
      description: 'Get a list of available voice profiles for TTS',
    },
    meeting_contexts: {
      name: 'Get Meeting Contexts',
      displayUrl: `${webhookConfig.displayBase}/meeting_contexts`,
      requestUrl: `${webhookConfig.requestBase}/meeting_contexts`,
      method: 'GET',
      description: 'Get a list of meeting contexts for the authenticated user',
    },
  }), [webhookConfig]);

  const webhookInfo = webhookId ? webhooks[webhookId as string] : null;

  useEffect(() => {
    if (webhookInfo && webhookInfo.defaultPayload) {
      setRequestPayload(webhookInfo.defaultPayload);
    }
  }, [webhookId]);

  const handleTestWebhook = async () => {
    if (!webhookId || !webhookInfo) return;

    if (!manualApiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    try {
      setIsLoading(true);
      setResponse(null);

      const webhookUrl = webhookInfo.requestUrl;
      
      const config: any = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${manualApiKey.trim()}`,
        },
        timeout: 60000,
      };

      let result;
      if (webhookInfo.method === 'GET') {
        result = await Axios.get(webhookUrl, config);
      } else {
        result = await Axios.post(webhookUrl, requestPayload, config);
      }
      
      setResponse(result.data);
      toast.success('Webhook test completed successfully!');
    } catch (error: any) {
      console.error('Webhook test failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to test webhook');
      
      setResponse({
        success: false,
        error: error.response?.data?.detail || 'Failed to test webhook',
        message: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (!webhookInfo) {
    return (
      <>
        <Head>
          <title>Webhook Not Found - Aurray</title>
        </Head>
        <Header />
        <div className={`min-h-screen flex items-center justify-center ${
          theme === 'dark' ? 'bg-[#0D1117]' : 'bg-[#F7FAFC]'
        }`}>
          <div className="text-center">
            <h1 className={`text-2xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Webhook Not Found
            </h1>
            <Link href="/developer/webhooks">
              <button className="text-primary-600 dark:text-primary-400 hover:underline">
                Back to Webhooks
              </button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{webhookInfo.name} - Aurray</title>
      </Head>
      <Header />
      
      <div className={`min-h-screen ${
        theme === 'dark' ? 'bg-[#0D1117]' : 'bg-[#F7FAFC]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link href="/developer/webhooks">
            <button className={`inline-flex items-center text-sm mb-6 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Webhooks
            </button>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className={`text-3xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {webhookInfo.name}
              </h1>
              <span className={`px-3 py-1 text-sm font-medium rounded ${
                webhookInfo.method === 'GET'
                  ? theme === 'dark'
                    ? 'bg-blue-900 text-blue-200'
                    : 'bg-blue-100 text-blue-800'
                  : theme === 'dark'
                    ? 'bg-green-900 text-green-200'
                    : 'bg-green-100 text-green-800'
              }`}>
                {webhookInfo.method}
              </span>
            </div>
            <p className={`mb-2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {webhookInfo.description}
            </p>
            <div className="flex items-center space-x-2">
              <code className={`px-3 py-1.5 rounded text-sm font-mono ${
                theme === 'dark'
                  ? 'bg-[#161B22] text-gray-100'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {webhookInfo.displayUrl}
              </code>
              <button
                onClick={() => copyToClipboard(webhookInfo.displayUrl)}
                className={`p-1.5 ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Copy URL"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div className={`rounded-lg shadow-sm border p-6 mb-6 ${
            theme === 'dark'
              ? 'bg-[#161B22] border-gray-700/50'
              : 'bg-white border-gray-200'
          }`}>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={manualApiKey}
              onChange={(e) => setManualApiKey(e.target.value)}
              placeholder="Enter your API key (sk_live_...)"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm font-mono ${
                theme === 'dark'
                  ? 'bg-[#0D1117] border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <p className={`mt-1 text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Your API key is used to authenticate requests to this endpoint
            </p>
          </div>

          {/* Request Payload (for POST requests) */}
          {webhookInfo.method === 'POST' && (
            <div className={`rounded-lg shadow-sm border p-6 mb-6 ${
              theme === 'dark'
                ? 'bg-[#161B22] border-gray-700/50'
                : 'bg-white border-gray-200'
            }`}>
              <h2 className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Request Payload
              </h2>
              <textarea
                value={JSON.stringify(requestPayload, null, 2)}
                onChange={(e) => {
                  try {
                    setRequestPayload(JSON.parse(e.target.value));
                  } catch (err) {
                    // Invalid JSON, ignore
                  }
                }}
                rows={12}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm font-mono ${
                  theme === 'dark'
                    ? 'bg-[#0D1117] border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          )}

          {/* Test Button */}
          <div className="mb-6">
            <button
              onClick={handleTestWebhook}
              disabled={isLoading || !manualApiKey.trim()}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Testing...
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Test Webhook
                </>
              )}
            </button>
          </div>

          {/* Response */}
          {response && (
            <div className={`rounded-lg shadow-sm border p-6 ${
              theme === 'dark'
                ? 'bg-[#161B22] border-gray-700/50'
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Response
                </h2>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                  className={`inline-flex items-center text-sm ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-100'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                  Copy
                </button>
              </div>
              <div className={`rounded-lg p-4 overflow-x-auto ${
                theme === 'dark' ? 'bg-[#0D1117]' : 'bg-gray-50'
              }`}>
                <pre className={`text-sm whitespace-pre-wrap ${
                  theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WebhookDetailPage;

