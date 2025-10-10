import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ChatBubbleLeftRightIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  EyeIcon,
  FunnelIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useDashboardStore } from '@/store';
import apiClient from '@/lib/api';
import { Conversation, ConversationStatus } from '@/types';
import { CallClient } from '@/lib/callClient';
import toast from 'react-hot-toast';
import Header from '@/components/layout/Header';

// Conversation Card Component
interface ConversationCardProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (conversationId: string, selected: boolean) => void;
}

function ConversationCard({ conversation, isSelected, onSelect }: ConversationCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: ConversationStatus) => {
    switch (status) {
      case 'active':
        return <ClockIcon className="h-4 w-4 text-warning-600" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-success-600" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-danger-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className={`card hover:shadow-md transition-shadow duration-200 ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''}`}>
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(conversation.id, e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Conversation {conversation.id.slice(-8)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {conversation.turn_count} turns • Started {formatDate(conversation.started_at)}
              </p>
              {conversation.summary && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                  {conversation.summary}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              {getStatusIcon(conversation.status)}
              <span className={`status-badge ${
                conversation.status === 'active' ? 'status-active' :
                conversation.status === 'completed' ? 'status-completed' :
                conversation.status === 'failed' ? 'status-failed' : 'status-pending'
              }`}>
                {conversation.status}
              </span>
            </div>
            <Link
              href={`/conversations/${conversation.id}`}
              className="btn-secondary inline-flex items-center space-x-1"
            >
              <EyeIcon className="h-4 w-4" />
              <span>View</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Filter Component
interface FilterProps {
  status: ConversationStatus | '';
  onStatusChange: (status: ConversationStatus | '') => void;
}

function Filter({ status, onStatusChange }: FilterProps) {
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'paused', label: 'Paused' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <FunnelIcon className="h-4 w-4 text-gray-500" />
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as ConversationStatus | '')}
        className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Bulk Actions Component
interface BulkActionsProps {
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  totalCount: number;
}

function BulkActions({ selectedCount, onSelectAll, onDeselectAll, onBulkDelete, totalCount }: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            {selectedCount} conversation{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onSelectAll}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
            >
              Select All ({totalCount})
            </button>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <button
              onClick={onDeselectAll}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
            >
              Deselect All
            </button>
          </div>
        </div>
        <button
          onClick={onBulkDelete}
          className="btn-danger inline-flex items-center space-x-2"
        >
          <TrashIcon className="h-4 w-4" />
          <span>Delete Selected</span>
        </button>
      </div>
    </div>
  );
}

const ConversationsPage: NextPage = () => {
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | ''>('');
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const { conversations, setConversations, setConversationsLoading } = useDashboardStore();

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setConversationsLoading(true);
        const data = await apiClient.getConversations({
          status: statusFilter || undefined,
          limit: 50, // Get more conversations for the dedicated conversations page
        });
        setConversations(data);
      } catch (error) {
        console.error('Failed to load conversations:', error);
        toast.error('Failed to load conversations');
      } finally {
        setConversationsLoading(false);
        setLoading(false);
      }
    };

    loadConversations();
  }, [statusFilter, setConversations, setConversationsLoading]);

  const filteredConversations = conversations.filter(conv => 
    statusFilter === '' || conv.status === statusFilter
  );

  // Selection handlers
  const handleSelectConversation = (conversationId: string, selected: boolean) => {
    setSelectedConversations(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(conversationId);
      } else {
        newSet.delete(conversationId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedConversations(new Set(filteredConversations.map(conv => conv.id)));
  };

  const handleDeselectAll = () => {
    setSelectedConversations(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedConversations.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedConversations.size} conversation${selectedConversations.size !== 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      console.log('CallClient:', CallClient);
      console.log('bulkDeleteConversations method:', CallClient.bulkDeleteConversations);
      
      let result;
      
      if (CallClient.bulkDeleteConversations) {
        result = await CallClient.bulkDeleteConversations(Array.from(selectedConversations));
      } else {
        // Fallback: Direct API call
        console.log('Using fallback API call for bulk delete');
        const response = await fetch(`${process.env.NEXT_PUBLIC_RT_GATEWAY_URL || 'http://localhost:8001'}/conversations/bulk-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_ids: Array.from(selectedConversations) })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to bulk delete conversations: ${response.status}`);
        }
        
        result = await response.json();
      }
      
      if (result.failed_deletions.length > 0) {
        toast.error(`Failed to delete ${result.failed_deletions.length} conversation${result.failed_deletions.length !== 1 ? 's' : ''}`);
        console.error('Failed deletions:', result.failed_deletions);
      } else {
        toast.success(`Successfully deleted ${result.deleted_count} conversation${result.deleted_count !== 1 ? 's' : ''}`);
      }

      // Refresh conversations list
      const data = await apiClient.getConversations({
        status: statusFilter || undefined,
        limit: 50, // Get more conversations for the dedicated conversations page
      });
      setConversations(data);
      
      // Clear selection
      setSelectedConversations(new Set());
      
    } catch (error) {
      console.error('Failed to bulk delete conversations:', error);
      toast.error('Failed to delete conversations');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Conversations - AI Receptionist</title>
      </Head>

      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Conversations</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                View and manage all AI receptionist conversations.
              </p>
            </div>
            <Filter status={statusFilter} onStatusChange={setStatusFilter} />
          </div>
        </div>

        {/* Bulk Actions */}
        <BulkActions
          selectedCount={selectedConversations.size}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBulkDelete={handleBulkDelete}
          totalCount={filteredConversations.length}
        />

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No conversations</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {statusFilter 
                ? `No conversations with status "${statusFilter}" found.`
                : 'Get started by having your first conversation with the AI receptionist.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConversations.map((conversation) => (
              <ConversationCard 
                key={conversation.id} 
                conversation={conversation}
                isSelected={selectedConversations.has(conversation.id)}
                onSelect={handleSelectConversation}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ConversationsPage;
