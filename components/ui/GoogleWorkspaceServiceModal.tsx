import { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';

interface GoogleWorkspaceServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  integrationId: string;
}

interface Service {
  service: string;
  enabled: boolean;
  connected: boolean;
}

const SERVICE_INFO = {
  calendar: {
    name: 'Calendar',
    description: 'Schedule meetings, view events, and manage your calendar',
    icon: '📅',
  },
  gmail: {
    name: 'Gmail',
    description: 'Send and receive emails, manage your inbox',
    icon: '📧',
  },
  drive: {
    name: 'Drive',
    description: 'Access and manage files in Google Drive',
    icon: '📁',
  },
  docs: {
    name: 'Google Docs',
    description: 'Read and access Google Docs documents',
    icon: '📄',
  },
};

export default function GoogleWorkspaceServiceModal({
  isOpen,
  onClose,
  onSuccess,
  integrationId,
}: GoogleWorkspaceServiceModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (isOpen && integrationId === 'google_workspace') {
      loadServices();
    }
  }, [isOpen, integrationId]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getGoogleWorkspaceServices();
      setServices(data);
      // Pre-select connected services
      const connected = data.filter(s => s.connected).map(s => s.service);
      setSelectedServices(connected);
    } catch (error: any) {
      console.error('Failed to load services:', error);
      toast.error('Failed to load Google Workspace services');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceName: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceName)
        ? prev.filter(s => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  const handleConnect = async () => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    try {
      setConnecting(true);
      
      // Get OAuth URL with selected services
      const response = await apiClient.getIntegrationOAuthUrlWithServices(
        integrationId,
        selectedServices
      );
      const { oauth_url } = response;
      
      // Open OAuth popup window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        oauth_url,
        'Connect Google Workspace',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      let checkPopup: NodeJS.Timeout | null = null;
      
      // Listen for OAuth success message from popup
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_SUCCESS' && event.data?.integration_id === integrationId) {
          if (checkPopup) clearInterval(checkPopup);
          window.removeEventListener('message', handleMessage);
          setConnecting(false);
          onSuccess();
          onClose();
          toast.success('Google Workspace connected successfully!');
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
      console.error('Failed to connect:', error);
      toast.error(error?.response?.data?.detail || 'Failed to connect Google Workspace');
      setConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Connect Google Workspace Services
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Select which Google Workspace services you want to connect. You can always add more later.
            </p>
          </div>

          <div className="px-6 py-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading services...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((service) => {
                  const info = SERVICE_INFO[service.service as keyof typeof SERVICE_INFO];
                  const isSelected = selectedServices.includes(service.service);
                  const isConnected = service.connected;

                  return (
                    <div
                      key={service.service}
                      onClick={() => !isConnected && toggleService(service.service)}
                      className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : isConnected
                          ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 cursor-not-allowed'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                      }`}
                    >
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={isSelected || isConnected}
                          disabled={isConnected}
                          onChange={() => toggleService(service.service)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{info?.icon || '📦'}</span>
                            <div>
                              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {info?.name || service.service}
                                {isConnected && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                                    Connected
                                  </span>
                                )}
                              </label>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {info?.description || 'Service description'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={connecting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConnect}
              disabled={connecting || selectedServices.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                  Connecting...
                </>
              ) : (
                `Connect ${selectedServices.length} ${selectedServices.length === 1 ? 'Service' : 'Services'}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

