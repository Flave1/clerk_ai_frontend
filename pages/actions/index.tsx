import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { fetchActions } from '@/lib/api';
import { Action, ActionFilters, ActionStatus, ActionType } from '@/types';

const ActionsPage: React.FC = () => {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActionFilters>({});

  useEffect(() => {
    loadActions();
  }, [filters]);

  const loadActions = async () => {
    try {
      setLoading(true);
      const data = await fetchActions(filters);
      setActions(data);
      setError(null);
    } catch (err) {
      setError('Failed to load actions');
      console.error('Error loading actions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'calendar_create':
        return '📅';
      case 'calendar_update':
        return '📝';
      case 'slack_message':
        return '💬';
      case 'email_send':
        return '📧';
      case 'crm_create_contact':
        return '👤';
      case 'rag_search':
        return '🔍';
      default:
        return '⚙️';
    }
  };

  const getActionTypeLabel = (actionType: string) => {
    return actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredActions = actions.filter(action => {
    if (filters.status && action.status !== filters.status) return false;
    if (filters.action_type && action.action_type !== filters.action_type) return false;
    return true;
  });

  return (
    <>
      <Head>
        <title>Actions - AI Receptionist</title>
      </Head>
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Actions</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage AI-generated actions and their execution status
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, status: (e.target.value as ActionStatus) || undefined }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <select
                value={filters.action_type || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, action_type: (e.target.value as ActionType) || undefined }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="calendar_create">Calendar Create</option>
                <option value="calendar_update">Calendar Update</option>
                <option value="slack_message">Slack Message</option>
                <option value="email_send">Email Send</option>
                <option value="crm_create_contact">CRM Create Contact</option>
                <option value="rag_search">RAG Search</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={loadActions}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Actions List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadActions}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No actions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parameters
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredActions.map((action) => (
                    <tr key={action.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">
                            {getActionTypeIcon(action.action_type)}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getActionTypeLabel(action.action_type)}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {action.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={action.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {action.turn_id && (
                          <div className="text-gray-500">
                            Turn: {action.turn_id.slice(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {JSON.stringify(action.parameters)}
                        </div>
                        {action.result && (
                          <div className="text-sm text-gray-500 max-w-xs truncate mt-1">
                            Result: {JSON.stringify(action.result)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(action.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ActionsPage;
