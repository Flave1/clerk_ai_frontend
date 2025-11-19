import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';

interface Service {
  service: string;
  enabled: boolean;
  connected: boolean;
}

const SERVICE_INFO = {
  calendar: {
    name: 'Calendar',
    description: 'Schedule meetings and manage events',
    icon: '📅',
  },
  gmail: {
    name: 'Gmail',
    description: 'Send and receive emails',
    icon: '📧',
  },
  drive: {
    name: 'Drive',
    description: 'Access files in Google Drive',
    icon: '📁',
  },
  docs: {
    name: 'Google Docs',
    description: 'Read Google Docs documents',
    icon: '📄',
  },
};

interface GoogleWorkspaceServicesPanelProps {
  integrationId: string;
  onRefresh?: () => void;
}

export default function GoogleWorkspaceServicesPanel({
  integrationId,
  onRefresh,
}: GoogleWorkspaceServicesPanelProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (integrationId === 'google_workspace') {
      loadServices();
    }
  }, [integrationId]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getGoogleWorkspaceServices();
      setServices(data);
    } catch (error: any) {
      console.error('Failed to load services:', error);
      toast.error('Failed to load Google Workspace services');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleService = async (serviceName: string, currentlyConnected: boolean) => {
    try {
      setToggling(serviceName);
      
      if (currentlyConnected) {
        await apiClient.disconnectGoogleWorkspaceService(serviceName);
        toast.success(`${SERVICE_INFO[serviceName as keyof typeof SERVICE_INFO]?.name || serviceName} disconnected`);
      } else {
        await apiClient.connectGoogleWorkspaceService(serviceName);
        toast.success(`${SERVICE_INFO[serviceName as keyof typeof SERVICE_INFO]?.name || serviceName} connected`);
      }
      
      // Reload services
      await loadServices();
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Failed to toggle service:', error);
      toast.error(error?.response?.data?.detail || `Failed to ${currentlyConnected ? 'disconnect' : 'connect'} service`);
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Services</h4>
        <button
          onClick={loadServices}
          className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center"
        >
          <ArrowPathIcon className="h-3 w-3 mr-1" />
          Refresh
        </button>
      </div>
      
      {services.map((service) => {
        const info = SERVICE_INFO[service.service as keyof typeof SERVICE_INFO];
        const isToggling = toggling === service.service;

        return (
          <div
            key={service.service}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">{info?.icon || '📦'}</span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {info?.name || service.service}
                  </span>
                  {service.connected && (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {info?.description || 'Service description'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggleService(service.service, service.connected)}
              disabled={isToggling}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                service.connected
                  ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                  : 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isToggling ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current inline-block"></div>
              ) : service.connected ? (
                'Disconnect'
              ) : (
                'Connect'
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

