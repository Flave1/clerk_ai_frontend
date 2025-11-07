import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '@/components/layout/Header';
import { 
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface ConnectedIntegration {
  id: string;
  user_id: string;
  integration_id: string;
  status: string;
  connected_at: string | null;
  last_used_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  // Integration details
  name: string;
  description: string;
  category: string;
  image_url: string;
}

const ConnectedAppsPage: NextPage = () => {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<ConnectedIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [disconnectDialog, setDisconnectDialog] = useState<{
    isOpen: boolean;
    integration: ConnectedIntegration | null;
  }>({
    isOpen: false,
    integration: null,
  });
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Load connected integrations
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('[Connected Apps] Loading connected integrations...');
        const connected = await apiClient.getConnectedIntegrations();
        console.log('[Connected Apps] Received integrations:', connected);
        
        setIntegrations(connected);
        
        // Check if redirected from OAuth callback
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const connectedId = params.get('connected');
          if (connectedId) {
            toast.success('Integration connected successfully!');
            // Remove query parameter
            router.replace('/integrations/connected');
          }
        }
      } catch (error: any) {
        console.error('[Connected Apps] Failed to load connected integrations:', error);
        console.error('[Connected Apps] Error details:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
        });
        toast.error(error?.response?.data?.detail || 'Failed to load connected apps');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [router]);

  const handleDisconnectClick = (integration: ConnectedIntegration) => {
    setDisconnectDialog({
      isOpen: true,
      integration,
    });
  };

  const handleDisconnectConfirm = async () => {
    if (!disconnectDialog.integration) return;

    try {
      setIsDisconnecting(true);
      await apiClient.disconnectIntegration(disconnectDialog.integration.integration_id);
      toast.success(`${disconnectDialog.integration.name} disconnected successfully!`);
      
      // Remove from list
      setIntegrations(prev => 
        prev.filter(integ => integ.integration_id !== disconnectDialog.integration!.integration_id)
      );
      
      // Close dialog
      setDisconnectDialog({ isOpen: false, integration: null });
    } catch (error: any) {
      console.error('Failed to disconnect integration:', error);
      toast.error(error?.response?.data?.detail || 'Failed to disconnect integration');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleDisconnectCancel = () => {
    setDisconnectDialog({ isOpen: false, integration: null });
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Connected Apps - Auray</title>
        </Head>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading connected apps...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Connected Apps - Auray</title>
      </Head>
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Connected Apps</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage your connected integrations and services.
              </p>
            </div>
            <button
              onClick={() => router.push('/integrations')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Connect Apps
            </button>
          </div>
          {integrations.length > 0 && (
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              {integrations.length} {integrations.length === 1 ? 'app connected' : 'apps connected'}
            </div>
          )}
        </div>

        {/* Connected Integrations Grid */}
        {integrations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Connected Apps
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You haven't connected any apps yet. Connect your favorite tools and services to enhance Auray's capabilities.
              </p>
              <button
                onClick={() => router.push('/integrations')}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Connect Your First App
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => {
              return (
                <div
                  key={integration.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                          {imageErrors.has(integration.id) ? (
                            <div className="h-10 w-10 bg-primary-500 rounded flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {integration.name.charAt(0)}
                              </span>
                            </div>
                          ) : (
                            <img
                              src={integration.image_url}
                              alt={integration.name}
                              className="h-full w-full object-contain p-1"
                              onError={() => {
                                setImageErrors(prev => new Set(prev).add(integration.id));
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {integration.name}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {integration.category}
                        </span>
                      </div>
                    </div>
                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {integration.description}
                  </p>

                  {integration.connected_at && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Connected {new Date(integration.connected_at).toLocaleDateString()}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleDisconnectClick(integration)}
                      className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-md text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Disconnect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Disconnect Confirmation Dialog */}
        <ConfirmDialog
          isOpen={disconnectDialog.isOpen}
          onClose={handleDisconnectCancel}
          onConfirm={handleDisconnectConfirm}
          title={disconnectDialog.integration ? `Disconnect ${disconnectDialog.integration.name}?` : 'Disconnect Integration?'}
          message={disconnectDialog.integration 
            ? `Are you sure you want to disconnect ${disconnectDialog.integration.name}? You will need to reconnect it to use its features again.`
            : 'Are you sure you want to disconnect this integration?'}
          confirmText="Disconnect"
          cancelText="Cancel"
          confirmButtonColor="red"
          isLoading={isDisconnecting}
        />
      </div>
    </>
  );
};

export default ConnectedAppsPage;
