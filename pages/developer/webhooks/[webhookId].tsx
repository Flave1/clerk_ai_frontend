import { useState, useEffect } from 'react';
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
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import Axios from 'axios';

interface WebhookResponse {
  success?: boolean;
  [key: string]: any;
}

const WebhookDetailPage: NextPage = () => {
  const router = useRouter();
  const { webhookId } = router.query;
  const [manualApiKey, setManualApiKey] = useState<string>('');
  const [response, setResponse] = useState<WebhookResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requestPayload, setRequestPayload] = useState<any>({});

  const webhooks: Record<string, any> = {
    join_meeting: {
      name: 'Join Meeting',
      url: '/v1/api.auray.net/join_meeting',
      method: 'POST',
      description: 'Join a meeting with AI assistant capabilities',
      defaultPayload: {
        meeting_url: 'https://us04web.zoom.us/wc/75103094141/join?fromPWA=1&pwd=eJkC8PPZLIQKpoWFv90CiKgnKeKZk7.1',
        type: 'zoom',
        transcript: true,
        audio_record: false,
        video_record: false,
        voice_id: 'voice_123',
        bot_name: 'Auray Bot',
        context_id: null,
      },
    },
    voice_profiles: {
      name: 'Get Voice Profiles',
      url: '/v1/api.auray.net/voice_profiles',
      method: 'GET',
      description: 'Get a list of available voice profiles for TTS',
    },
    meeting_contexts: {
      name: 'Get Meeting Contexts',
      url: '/v1/api.auray.net/meeting_contexts',
      method: 'GET',
      description: 'Get a list of meeting contexts for the authenticated user',
    },
  };

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

      // Construct the webhook URL for the proxy
      // webhookInfo.url is like '/v1/api.auray.net/join_meeting'
      // We need to call it via /api/v1/api.auray.net/join_meeting
      const webhookUrl = `/api${webhookInfo.url}`;
      
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
          <title>Webhook Not Found - Auray</title>
        </Head>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
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
        <title>{webhookInfo.name} - Auray</title>
      </Head>
      <Header />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link href="/developer/webhooks">
            <button className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Webhooks
            </button>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {webhookInfo.name}
              </h1>
              <span className={`px-3 py-1 text-sm font-medium rounded ${
                webhookInfo.method === 'GET' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}>
                {webhookInfo.method}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {webhookInfo.description}
            </p>
            <div className="flex items-center space-x-2">
              <code className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-900 dark:text-gray-100">
                {webhookInfo.url}
              </code>
              <button
                onClick={() => copyToClipboard(webhookInfo.url)}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Copy URL"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={manualApiKey}
              onChange={(e) => setManualApiKey(e.target.value)}
              placeholder="Enter your API key (sk_live_...)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm font-mono"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Your API key is used to authenticate requests to this endpoint
            </p>
          </div>

          {/* Request Payload (for POST requests) */}
          {webhookInfo.method === 'POST' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm font-mono"
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Response
                </h2>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                  className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                  Copy
                </button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
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

