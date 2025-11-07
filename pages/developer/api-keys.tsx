import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Header from '@/components/layout/Header';
import { 
  KeyIcon, 
  PlusIcon, 
  TrashIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ClipboardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import apiClient from '@/lib/api';
import { ApiKey } from '@/types';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const ApiKeysPage: NextPage = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiresDays, setNewKeyExpiresDays] = useState<number | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const [visibleKeyId, setVisibleKeyId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const keys = await apiClient.getApiKeys();
      setApiKeys(keys);
    } catch (error: any) {
      console.error('Failed to load API keys:', error);
      toast.error(error.response?.data?.detail || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    try {
      setCreating(true);
      const newKey = await apiClient.createApiKey({
        name: newKeyName.trim(),
        expires_in_days: newKeyExpiresDays || undefined,
        scopes: [], // Add scope selection later if needed
      });

      // Show the plain key in a modal
      setApiKeys([newKey, ...apiKeys]);
      setShowCreateModal(false);
      setNewKeyName('');
      setNewKeyExpiresDays(undefined);
      
      // Show success with the key
      setVisibleKeyId(newKey.id);
      toast.success('API key created successfully! Copy it now - you won\'t be able to see it again.');
    } catch (error: any) {
      console.error('Failed to create API key:', error);
      toast.error(error.response?.data?.detail || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to delete the API key "${keyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(keyId);
      await apiClient.deleteApiKey(keyId);
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
      toast.success('API key deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete API key:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete API key');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyKey = async (key: ApiKey) => {
    const keyToCopy = key.plain_key || `${key.key_prefix}...`;
    try {
      await navigator.clipboard.writeText(keyToCopy);
      setCopiedKeyId(key.id);
      toast.success('API key copied to clipboard');
      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getStatusBadge = (key: ApiKey) => {
    const status = key.status;
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Active
        </span>
      );
    } else if (status === 'revoked') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Revoked
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          Expired
        </span>
      );
    }
  };

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const daysUntil = Math.ceil((parseISO(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil > 0;
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return parseISO(expiresAt).getTime() < new Date().getTime();
  };

  return (
    <>
      <Head>
        <title>API Keys - Aurray</title>
      </Head>
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <KeyIcon className="h-8 w-8 mr-3 text-primary-600 dark:text-primary-400" />
                API Keys
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage your API keys for programmatic access to Aurray
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create API Key
            </button>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
              
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                <form onSubmit={handleCreateKey}>
                  <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
                      Create New API Key
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="key-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          id="key-name"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                          placeholder="e.g., Production Key, Development Key"
                          required
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <label htmlFor="expires-days" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Expires In (Days)
                        </label>
                        <input
                          type="number"
                          id="expires-days"
                          value={newKeyExpiresDays || ''}
                          onChange={(e) => setNewKeyExpiresDays(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Optional (1-365 days)"
                          min="1"
                          max="365"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Leave empty for keys that never expire
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={creating || !newKeyName.trim()}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creating ? 'Creating...' : 'Create Key'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* API Keys List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <KeyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No API keys yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first API key to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create API Key
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {apiKeys.map((key) => (
                <li key={key.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {key.name}
                        </h3>
                        {getStatusBadge(key)}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <KeyIcon className="h-4 w-4 mr-1" />
                          <code className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {visibleKeyId === key.id && key.plain_key 
                              ? key.plain_key 
                              : `${key.key_prefix}${'•'.repeat(32)}`}
                          </code>
                        </div>
                        
                        {key.created_at && (
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Created {format(parseISO(key.created_at), 'MMM d, yyyy')}
                          </div>
                        )}
                        
                        {key.last_used_at && (
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Last used {format(parseISO(key.last_used_at), 'MMM d, yyyy')}
                          </div>
                        )}
                        
                        {key.expires_at && (
                          <div className={`flex items-center ${
                            isExpired(key.expires_at) 
                              ? 'text-red-600 dark:text-red-400' 
                              : isExpiringSoon(key.expires_at)
                              ? 'text-orange-600 dark:text-orange-400'
                              : ''
                          }`}>
                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                            {isExpired(key.expires_at) 
                              ? 'Expired' 
                              : `Expires ${format(parseISO(key.expires_at), 'MMM d, yyyy')}`}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {(visibleKeyId === key.id && key.plain_key) && (
                        <button
                          onClick={() => handleCopyKey(key)}
                          className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                          title="Copy key"
                        >
                          {copiedKeyId === key.id ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          ) : (
                            <ClipboardIcon className="h-5 w-5" />
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteKey(key.id, key.name)}
                        disabled={deletingId === key.id}
                        className="p-2 text-red-400 hover:text-red-500 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                        title="Delete key"
                      >
                        {deletingId === key.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                        ) : (
                          <TrashIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Info Alert */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Security Notice
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>API keys provide full access to your account. Keep them secure and never share them publicly.</li>
                  <li>You can only see the full API key once when it's created. Make sure to copy and store it securely.</li>
                  <li>If you suspect a key has been compromised, delete it immediately and create a new one.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApiKeysPage;
