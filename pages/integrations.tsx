import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '@/components/layout/Header';
import { 
  LinkIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import ComingSoonModal from '@/components/ui/ComingSoonModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getIntegrationDetail } from '@/constants/integrationDetails';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  connected: boolean;
}

const IntegrationsPage: NextPage = () => {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [comingSoonModal, setComingSoonModal] = useState<{
    isOpen: boolean;
    integrationName: string;
  }>({ isOpen: false, integrationName: '' });
  const [disconnectDialog, setDisconnectDialog] = useState<{
    isOpen: boolean;
    integration: Integration | null;
  }>({
    isOpen: false,
    integration: null,
  });
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Load all integrations
  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getIntegrations();
        setIntegrations(data);
        
        // Check for search query param
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const searchParam = params.get('search');
          if (searchParam) {
            setSearchQuery(searchParam);
          }
        }
      } catch (error) {
        console.error('Failed to load integrations:', error);
        toast.error('Failed to load integrations');
      } finally {
        setLoading(false);
      }
    };
    loadIntegrations();
  }, []);

  const handleConnect = async (integration: Integration) => {
    // Disable "Coming Soon" modal for these integrations - allow direct OAuth flow
    const allowedIntegrations = [
      'google_calendar', 'google_gmail', 'google_drive', 'google_docs', 'google_meet',
      'microsoft_email', 'microsoft_calendar', 'microsoft_contacts', 'microsoft_teams', 
      'microsoft_onedrive', 'microsoft_sharepoint', 'microsoft_office',
      'zoom', 'slack'
    ];
    
    // Show coming soon modal for unconnected integrations (except allowed ones)
    if (!integration.connected && !allowedIntegrations.includes(integration.id)) {
      setComingSoonModal({
        isOpen: true,
        integrationName: integration.name,
      });
      return;
    }

    try {
      setConnecting(integration.id);
      
      // Get integration details to check for required integrations
      const integrationDetail = getIntegrationDetail(integration.id);
      const additionalIntegrations = integrationDetail?.requiredWith?.filter(reqId => {
        const reqIntegration = integrations.find(i => i.id === reqId);
        return reqIntegration && !reqIntegration.connected;
      }) || [];
      
      // Get OAuth URL from backend - call the specific integration directly with additional integrations
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
          'google_calendar': 'google_workspace',
          'google_gmail': 'google_workspace',
          'google_drive': 'google_workspace',
          'google_docs': 'google_workspace',
          'google_meet': 'google_workspace',
        };
        const expectedIntegrationId = googleServiceMap[integration.id] || integration.id;
        
        if (event.data?.type === 'OAUTH_SUCCESS' && 
            (event.data?.integration_id === integration.id || event.data?.integration_id === expectedIntegrationId)) {
          if (checkPopup) clearInterval(checkPopup);
          window.removeEventListener('message', handleMessage);
          setConnecting(null);
          
          // Reload integrations to update connection status
          apiClient.getIntegrations().then(data => {
            setIntegrations(data);
            toast.success(`${integration.name} connected successfully!`);
          }).catch(() => {
            toast.error('Failed to verify connection status');
          });
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Also check if popup closed (fallback)
      checkPopup = setInterval(() => {
        if (popup?.closed) {
          if (checkPopup) clearInterval(checkPopup);
          window.removeEventListener('message', handleMessage);
          setConnecting(null);
          
          // Reload integrations to update connection status
          apiClient.getIntegrations().then(data => {
            setIntegrations(data);
          }).catch(() => {
            // Silent fail - user might have closed popup manually
          });
        }
      }, 1000);

      // Cleanup after 5 minutes
      setTimeout(() => {
        if (checkPopup) clearInterval(checkPopup);
        window.removeEventListener('message', handleMessage);
        if (popup && !popup.closed) {
          popup.close();
        }
        setConnecting(null);
      }, 300000);

    } catch (error: any) {
      console.error(`Failed to connect ${integration.name}:`, error);
      toast.error(error?.response?.data?.detail || `Failed to connect ${integration.name}`);
      setConnecting(null);
    }
  };

  const handleDisconnect = (integration: Integration) => {
    setDisconnectDialog({
      isOpen: true,
      integration,
    });
  };

  const handleDisconnectConfirm = async () => {
    if (!disconnectDialog.integration) return;

    try {
      setIsDisconnecting(true);
      await apiClient.disconnectIntegration(disconnectDialog.integration.id);
      toast.success(`${disconnectDialog.integration.name} disconnected successfully!`);
      
      // Update local state
      setIntegrations(prev => 
        prev.map(integ => 
          integ.id === disconnectDialog.integration!.id 
            ? { ...integ, connected: false }
            : integ
        )
      );
      
      // Close dialog
      setDisconnectDialog({ isOpen: false, integration: null });
    } catch (error: any) {
      console.error(`Failed to disconnect ${disconnectDialog.integration.name}:`, error);
      toast.error(error?.response?.data?.detail || `Failed to disconnect ${disconnectDialog.integration.name}`);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleDisconnectCancel = () => {
    setDisconnectDialog({ isOpen: false, integration: null });
  };

  // Filter integrations
  const categories = ['all', ...Array.from(new Set(integrations.map(i => i.category)))];
  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = filter === 'all' || integration.category === filter;
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const connectedCount = integrations.filter(i => i.connected).length;

  if (loading) {
    return (
      <>
        <Head>
          <title>Integrations - Aurray</title>
        </Head>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading integrations...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Integrations - Aurray</title>
      </Head>
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/integrations/connected')}
                className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Integrations</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Connect your favorite tools and services to enhance Aurray's capabilities.
              </p>
            </div>
          </div>
          {connectedCount > 0 && (
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              {connectedCount} {connectedCount === 1 ? 'app connected' : 'apps connected'}
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search integrations by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filter by category:
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => {
                const count = category === 'all' 
                  ? integrations.length 
                  : integrations.filter(i => i.category === category).length;
                const isActive = filter === category;
                
                return (
                  <button
                    key={category}
                    onClick={() => setFilter(category)}
                    className={`group relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-500/50'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                    }`}
                  >
                    <span className="flex items-center">
                      {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                      <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {count}
                      </span>
                    </span>
                    {isActive && (
                      <span className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-sm"></span>
                    )}
                  </button>
                );
              })}
            </div>
            {(filter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setFilter('all');
                  setSearchQuery('');
                }}
                className="ml-auto px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Clear filters
              </button>
            )}
          </div>

          {/* Results Count */}
          {filteredIntegrations.length !== integrations.length && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredIntegrations.length}</span> of <span className="font-semibold text-gray-900 dark:text-gray-100">{integrations.length}</span> integrations
            </div>
          )}
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => (
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
                {integration.connected && (
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                )}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {integration.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                {integration.connected ? (
                  <button
                    onClick={() => handleDisconnect(integration)}
                    className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-md text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Disconnect
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => router.push(`/integration-tool-detail?id=${integration.id}`)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                    >
                      Learn More
                      <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </button>
                    <button
                      onClick={() => handleConnect(integration)}
                      disabled={connecting === integration.id}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {connecting === integration.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Connecting...
                        </>
                      ) : (
                        <>
                          Connect
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12">
            <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No integrations found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={comingSoonModal.isOpen}
        onClose={() => setComingSoonModal({ isOpen: false, integrationName: '' })}
        title="Coming Soon"
        featureName={comingSoonModal.integrationName ? `${comingSoonModal.integrationName} Integration` : undefined}
        message="We're working hard to bring you this integration. Stay tuned for updates!"
      />

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

    </>
  );
};

export default IntegrationsPage;
