import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '@/components/layout/Header';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  LinkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import { getIntegrationDetail } from '@/constants/integrationDetails';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  connected: boolean;
}

const IntegrationToolDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [allIntegrations, setAllIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get detailed information from state manager
  const integrationDetail = id && typeof id === 'string' ? getIntegrationDetail(id) : undefined;

  // Get required and recommended integrations
  const requiredIntegrations = integrationDetail?.requiredWith
    ?.map(reqId => allIntegrations.find(i => i.id === reqId))
    .filter(Boolean) as Integration[] | undefined;

  const recommendedIntegrations = integrationDetail?.worksWellWith
    ?.map(recId => allIntegrations.find(i => i.id === recId))
    .filter(Boolean) as Integration[] | undefined;

  useEffect(() => {
    const loadIntegration = async () => {
      if (!id || typeof id !== 'string') return;

      try {
        setLoading(true);
        const data = await apiClient.getIntegrations();
        setAllIntegrations(data);
        
        const foundIntegration = data.find((i: Integration) => i.id === id);
        
        if (!foundIntegration) {
          toast.error('Integration not found');
          router.push('/integrations');
          return;
        }

        setIntegration(foundIntegration);
      } catch (error) {
        console.error('Failed to load integration:', error);
        toast.error('Failed to load integration details');
      } finally {
        setLoading(false);
      }
    };

    loadIntegration();
  }, [id, router]);

  const handleConnect = async () => {
    if (!integration) return;

    try {
      setConnecting(true);

      // Collect additional integrations to connect (required ones)
      const additionalIntegrations = integrationDetail?.requiredWith?.filter(reqId => {
        const reqIntegration = allIntegrations.find(i => i.id === reqId);
        return reqIntegration && !reqIntegration.connected;
      }) || [];

      // Get OAuth URL from backend with additional integrations
      const response = await apiClient.getIntegrationOAuthUrl(
        integration.id,
        additionalIntegrations.length > 0 ? additionalIntegrations.join(',') : undefined
      );
      const { oauth_url } = response;

      // Open OAuth popup window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        oauth_url,
        `Connect ${integration.name}`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      let checkPopup: NodeJS.Timeout | null = null;

      // Listen for OAuth success message from popup
      const handleMessage = (event: MessageEvent) => {
        // For Google services, the integration_id will be 'google_workspace' but we want to match our service
        const googleServiceMap: Record<string, string> = {
          google_calendar: 'google_workspace',
          google_gmail: 'google_workspace',
          google_drive: 'google_workspace',
          google_docs: 'google_workspace',
          google_meet: 'google_workspace',
        };
        const expectedIntegrationId = googleServiceMap[integration.id] || integration.id;

        if (
          event.data?.type === 'OAUTH_SUCCESS' &&
          (event.data?.integration_id === integration.id ||
            event.data?.integration_id === expectedIntegrationId)
        ) {
          if (checkPopup) clearInterval(checkPopup);
          window.removeEventListener('message', handleMessage);
          setConnecting(false);

          toast.success(`${integration.name} connected successfully!`);
          
          // Redirect to integrations page or connected apps
          setTimeout(() => {
            router.push('/integrations/connected');
          }, 1000);
        }
      };

      window.addEventListener('message', handleMessage);

      // Also check if popup closed (fallback)
      checkPopup = setInterval(() => {
        if (popup?.closed) {
          if (checkPopup) clearInterval(checkPopup);
          window.removeEventListener('message', handleMessage);
          setConnecting(false);
        }
      }, 1000);

      // Cleanup after 5 minutes
      setTimeout(() => {
        if (checkPopup) clearInterval(checkPopup);
        window.removeEventListener('message', handleMessage);
        if (popup && !popup.closed) {
          popup.close();
        }
        setConnecting(false);
      }, 300000);
    } catch (error: any) {
      console.error(`Failed to connect ${integration.name}:`, error);
      toast.error(error?.response?.data?.detail || `Failed to connect ${integration.name}`);
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Integration Details - Aurray</title>
        </Head>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading integration details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!integration || !integrationDetail) {
    return (
      <>
        <Head>
          <title>Integration Not Found - Aurray</title>
        </Head>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Integration not found</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{integration.name} - Integration Details - Aurray</title>
      </Head>
      <Header />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/integrations')}
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Integrations
          </button>

          {/* Header Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-6">
                {/* Integration Logo */}
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden shadow-md">
                    {imageError ? (
                      <div className="h-16 w-16 bg-primary-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">
                          {integration.name.charAt(0)}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={integration.image_url}
                        alt={integration.name}
                        className="h-full w-full object-contain p-2"
                        onError={() => setImageError(true)}
                      />
                    )}
                  </div>
                </div>

                {/* Integration Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {integration.name}
                    </h1>
                    {integration.connected && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                    {integrationDetail.tagline}
                  </p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                    {integration.category}
                  </span>
                </div>
              </div>

              {/* Connect Button */}
              {!integration.connected && (
                <div className="flex-shrink-0">
                  <button
                    onClick={handleConnect}
                    disabled={connecting || (requiredIntegrations && requiredIntegrations.some(req => !req.connected))}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {connecting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect Now
                        <ArrowRightIcon className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </button>
                  {requiredIntegrations && requiredIntegrations.some(req => !req.connected) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
                      Required integration needed
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              About this integration
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {integrationDetail.fullDescription}
            </p>
          </div>

          {/* Required/Recommended Integrations Section */}
          {(requiredIntegrations && requiredIntegrations.length > 0) || 
           (recommendedIntegrations && recommendedIntegrations.length > 0) ? (
            <div className="mb-6 space-y-4">
              {/* Required Integrations */}
              {requiredIntegrations && requiredIntegrations.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100 mb-2">
                        Required Integration{requiredIntegrations.length > 1 ? 's' : ''}
                      </h3>
                      <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                        {integration.name} requires the following integration{requiredIntegrations.length > 1 ? 's' : ''} to work properly:
                      </p>
                      <div className="space-y-3">
                        {requiredIntegrations.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-200 dark:border-amber-700"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                <img
                                  src={req.image_url}
                                  alt={req.name}
                                  className="h-full w-full object-contain p-1"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {req.name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {req.category}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {req.connected ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  Connected
                                </span>
                              ) : (
                                <button
                                  onClick={() => router.push(`/integration-tool-detail?id=${req.id}`)}
                                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                                >
                                  Connect {req.name}
                                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Integrations */}
              {recommendedIntegrations && recommendedIntegrations.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <LinkIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Works Great With
                      </h3>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                        Enhance your experience by connecting these complementary tools:
                      </p>
                      <div className="space-y-3">
                        {recommendedIntegrations.map((rec) => (
                          <div
                            key={rec.id}
                            className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                <img
                                  src={rec.image_url}
                                  alt={rec.name}
                                  className="h-full w-full object-contain p-1"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {rec.name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {rec.category}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {rec.connected ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  Connected
                                </span>
                              ) : (
                                <button
                                  onClick={() => router.push(`/integration-tool-detail?id=${rec.id}`)}
                                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                >
                                  View Details
                                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Features */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                  <SparklesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Key Features
                </h2>
              </div>
              <ul className="space-y-3">
                {integrationDetail.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Capabilities */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                  <RocketLaunchIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  AI Capabilities
                </h2>
              </div>
              <ul className="space-y-3">
                {integrationDetail.capabilities.map((capability, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-400">{capability}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Use Cases */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center mr-3">
                <LightBulbIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Use Cases
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrationDetail.useCases.map((useCase, index) => (
                <div
                  key={index}
                  className="flex items-start p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex-shrink-0 h-2 w-2 rounded-full bg-primary-500 mt-2 mr-3"></div>
                  <span className="text-gray-600 dark:text-gray-400">{useCase}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          {!integration.connected && (
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-3">
                Ready to get started with {integration.name}?
              </h2>
              <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
                Connect your {integration.name} account now and unlock powerful AI-assisted workflows
                with Aurray.
              </p>
              {requiredIntegrations && requiredIntegrations.some(req => !req.connected) && (
                <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-2xl mx-auto">
                  <p className="text-white text-sm">
                    <ExclamationTriangleIcon className="h-5 w-5 inline-block mr-2 mb-1" />
                    Please connect {requiredIntegrations.filter(req => !req.connected).map(req => req.name).join(' and ')} first
                  </p>
                </div>
              )}
              <button
                onClick={handleConnect}
                disabled={connecting || (requiredIntegrations && requiredIntegrations.some(req => !req.connected))}
                className="inline-flex items-center px-8 py-4 border-2 border-white rounded-lg text-lg font-semibold text-white hover:bg-white hover:text-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connecting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect {integration.name}
                    <ArrowRightIcon className="h-5 w-5 ml-3" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default IntegrationToolDetailPage;

