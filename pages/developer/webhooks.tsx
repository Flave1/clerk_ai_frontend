import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Header from '@/components/layout/Header';
import { 
  GlobeAltIcon,
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import apiClient from '@/lib/api';
import { JoinMeetingRequest, JoinMeetingResponse } from '@/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

const WebhooksPage: NextPage = () => {
  const { user } = useAuth();
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>('join_meeting');
  const [manualApiKey, setManualApiKey] = useState<string>('');
  
  // Default meeting URLs for each platform
  const defaultMeetingUrls = {
    zoom: 'https://us04web.zoom.us/wc/75103094141/join?fromPWA=1&pwd=eJkC8PPZLIQKpoWFv90CiKgnKeKZk7.1',
    google_meet: 'https://meet.google.com/cmq-mujv-kgg',
    microsoft_teams: 'https://teams.live.com/meet/9318960718018?p=J453ke6nEPHvg5kJGq',
  };
  
  const [requestPayload, setRequestPayload] = useState<JoinMeetingRequest>({
    meeting_url: defaultMeetingUrls.zoom,
    type: 'zoom',
    transcript: true,
    audio_record: false,
    video_record: false,
    voice_id: 'voice_123',
    bot_name: user?.name || 'Auray Bot',
  });
  
  // Update bot_name when user changes
  useEffect(() => {
    if (user?.name) {
      setRequestPayload(prev => ({ ...prev, bot_name: user.name }));
    }
  }, [user?.name]);
  
  // Update meeting_url when type changes
  useEffect(() => {
    const url = defaultMeetingUrls[requestPayload.type as keyof typeof defaultMeetingUrls];
    if (url) {
      setRequestPayload(prev => ({ ...prev, meeting_url: url }));
    }
  }, [requestPayload.type]);
  const [response, setResponse] = useState<JoinMeetingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showJsonExample, setShowJsonExample] = useState(false);
  const [responseHistory, setResponseHistory] = useState<{
    request: JoinMeetingRequest;
    response: JoinMeetingResponse;
    timestamp: string;
  }[]>([]);

  // Available webhooks (can be expanded later)
  const webhooks = [
    {
      id: 'join_meeting',
      name: 'Join Meeting',
      url: '/v1/api.auray.net/join_meeting',
      method: 'POST',
      description: 'Join a meeting with AI assistant capabilities',
    },
  ];

  const selectedWebhookInfo = webhooks.find(w => w.id === selectedWebhook);

  const handleTestWebhook = async () => {
    if (!selectedWebhook) return;

    if (!manualApiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    try {
      setIsLoading(true);
      setResponse(null);

      const result = await apiClient.testJoinMeetingWebhook(requestPayload, manualApiKey.trim());
      
      setResponse(result);
      setResponseHistory([
        {
          request: { ...requestPayload },
          response: result,
          timestamp: new Date().toISOString(),
        },
        ...responseHistory,
      ]);
      
      toast.success('Webhook test completed successfully!');
    } catch (error: any) {
      console.error('Webhook test failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to test webhook');
      
      // Set error response
      setResponse({
        success: false,
        message: 'Failed to join meeting',
        status: 'error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <>
      <Head>
        <title>Webhooks - Auray</title>
      </Head>
      <Header />
      
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <GlobeAltIcon className="h-8 w-8 mr-3 text-primary-600 dark:text-primary-400" />
            Webhooks
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Test and manage webhook endpoints for real-time integrations
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Webhook List & Request Form */}
          <div className="lg:col-span-1 space-y-6">
            {/* Available Webhooks */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Available Webhooks</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {webhooks.map((webhook) => (
                  <button
                    key={webhook.id}
                    onClick={() => setSelectedWebhook(webhook.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedWebhook === webhook.id 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{webhook.name}</h3>
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        {webhook.method}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-1">{webhook.url}</p>
                    {webhook.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">{webhook.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Request Form */}
            {selectedWebhook === 'join_meeting' && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request Payload</h2>
                  <button
                    onClick={() => setShowJsonExample(!showJsonExample)}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                  >
                    {showJsonExample ? 'Hide' : 'Show'} JSON Example
                  </button>
                </div>
                {/* URL and API Key Section */}
                <div className="p-4 space-y-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  {/* Webhook URL */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Webhook URL
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                        {selectedWebhookInfo?.url}
                      </code>
                      <button
                        onClick={() => {
                          if (selectedWebhookInfo) {
                            const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                            const cleanBase = baseURL.replace(/\/$/, '').replace(/\/api\/v1$/, '');
                            const fullUrl = `${cleanBase}${selectedWebhookInfo.url}`;
                            navigator.clipboard.writeText(fullUrl);
                            toast.success('URL copied to clipboard!');
                          }
                        }}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title="Copy URL"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {/* API Key Input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      API Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={manualApiKey}
                      onChange={(e) => setManualApiKey(e.target.value)}
                      placeholder="Enter your API key (sk_live_...)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-white dark:text-gray-900 text-sm font-mono"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Paste your full API key here. <a href="/developer/api-keys" className="text-primary-600 dark:text-primary-400 hover:underline">Get API keys</a>
                    </p>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {/* JSON View */}
                  {showJsonExample ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">JSON Payload:</span>
                        <button
                          onClick={() => setShowJsonExample(false)}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                        >
                          Show Form
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">URL:</span>
                          <code className="block mt-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono break-all">
                            {selectedWebhookInfo?.url}
                          </code>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">API Key:</span>
                          <code className="block mt-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                            {manualApiKey ? manualApiKey.substring(0, 12) + '***' : 'Not set'}
                          </code>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Payload:</span>
                          <pre className="mt-1 text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto border border-gray-200 dark:border-gray-700">
                            {JSON.stringify(requestPayload, null, 2)}
                          </pre>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-end">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(requestPayload, null, 2));
                            toast.success('JSON copied to clipboard!');
                          }}
                          className="inline-flex items-center text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                          Copy JSON
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Form Fields */}
                      <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <select
                      value={requestPayload.type}
                      onChange={(e) => setRequestPayload({ ...requestPayload, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                    >
                      <option value="zoom">Zoom</option>
                      <option value="google_meet">Google Meet</option>
                      <option value="microsoft_teams">Microsoft Teams</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Selecting a type will automatically set the corresponding meeting URL
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Meeting URL
                    </label>
                    <input
                      type="text"
                      value={requestPayload.meeting_url}
                      onChange={(e) => setRequestPayload({ ...requestPayload, meeting_url: e.target.value })}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-400 text-sm cursor-not-allowed opacity-75"
                      placeholder="Meeting URL is set automatically based on type"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Meeting URL is automatically set based on the selected platform type
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Voice ID
                    </label>
                    <input
                      type="text"
                      value={requestPayload.voice_id}
                      onChange={(e) => setRequestPayload({ ...requestPayload, voice_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="voice_123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bot Name
                    </label>
                    <input
                      type="text"
                      value={requestPayload.bot_name}
                      onChange={(e) => setRequestPayload({ ...requestPayload, bot_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Bot Name"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      The name that will appear for the bot in the meeting
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Options</label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={requestPayload.transcript}
                        onChange={(e) => setRequestPayload({ ...requestPayload, transcript: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Transcript</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={requestPayload.audio_record}
                        onChange={(e) => setRequestPayload({ ...requestPayload, audio_record: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Audio Record</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={requestPayload.video_record}
                        onChange={(e) => setRequestPayload({ ...requestPayload, video_record: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Video Record</span>
                    </label>
                  </div>

                      <button
                        onClick={handleTestWebhook}
                        disabled={isLoading}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Testing...
                          </>
                        ) : (
                          <>
                            <PlayIcon className="h-5 w-5 mr-2" />
                            Test Webhook
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Response Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Response</h2>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Processing webhook request...</p>
                  </div>
                ) : response ? (
                  <div>
                    {/* Response Status */}
                    <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(response.status)}`}>
                            {response.status}
                          </span>
                          {response.success && (
                            <CheckCircleIcon className="h-6 w-6 text-green-500" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(response.timestamp), 'HH:mm:ss')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{response.message}</p>
                      {response.meeting_id && (
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Meeting ID:</span>
                            <code className="ml-2 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                              {response.meeting_id}
                            </code>
                          </div>
                          {response.meeting_url && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Meeting URL:</span>
                              <code className="ml-2 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded font-mono text-xs">
                                {response.meeting_url}
                              </code>
                            </div>
                          )}
                          {response.platform && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Platform:</span>
                              <span className="ml-2 text-gray-900 dark:text-gray-100">{response.platform}</span>
                            </div>
                          )}
                          {response.voice_id && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Voice ID:</span>
                              <code className="ml-2 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                                {response.voice_id}
                              </code>
                            </div>
                          )}
                          {response.capabilities && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Capabilities:</span>
                              <div className="mt-1 space-y-1">
                                {response.capabilities.transcript_enabled && (
                                  <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs mr-2">
                                    Transcript
                                  </span>
                                )}
                                {response.capabilities.audio_recording_enabled && (
                                  <span className="inline-block px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs mr-2">
                                    Audio Recording
                                  </span>
                                )}
                                {response.capabilities.video_recording_enabled && (
                                  <span className="inline-block px-2 py-0.5 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded text-xs mr-2">
                                    Video Recording
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Raw Response */}
                    <details className="mt-6">
                      <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100">
                        View Raw Response
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto">
                        {JSON.stringify(response, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <GlobeAltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No response yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Select a webhook and click "Test Webhook" to see the response
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Request History */}
            {responseHistory.length > 0 && (
              <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request History</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {responseHistory.slice(0, 5).map((history, index) => (
                    <button
                      key={index}
                      onClick={() => setResponse(history.response)}
                      className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {history.request.type} - {history.request.meeting_url.slice(-20)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(history.timestamp), 'MMM d, HH:mm:ss')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          history.response.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : history.response.status === 'error'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {history.response.status}
                        </span>
                        {history.response.meeting_id && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {history.response.meeting_id.slice(0, 15)}...
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default WebhooksPage;
