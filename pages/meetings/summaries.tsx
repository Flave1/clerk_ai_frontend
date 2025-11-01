import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { 
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon,
  EyeIcon,
  ArrowLeftIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useMeetingStore } from '@/store';
import apiClient from '@/lib/api';
import { MeetingSummary, ActionItem } from '@/types';
import toast from 'react-hot-toast';
import Header from '@/components/layout/Header';
import Link from 'next/link';

// Summary Card Component
function SummaryCard({ summary }: { summary: MeetingSummary }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'neutral':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                Meeting Summary
              </h3>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Created {formatDate(summary.created_at)}
            </p>
            
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
              {summary.summary_text}
            </p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <UsersIcon className="h-4 w-4" />
                <span>{summary.topics_discussed.length} topics</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircleIcon className="h-4 w-4" />
                <span>{summary.action_items.length} actions</span>
              </div>
              {summary.duration_minutes && (
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>{summary.duration_minutes} min</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {summary.sentiment && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(summary.sentiment)}`}>
                {summary.sentiment}
              </span>
            )}
            
            <Link href={`/meetings/${summary.meeting_id}`}>
              <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <EyeIcon className="h-3 w-3 mr-1" />
                View Meeting
              </button>
            </Link>
          </div>
        </div>
        
        {summary.topics_discussed.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Topics Discussed</h4>
            <div className="flex flex-wrap gap-2">
              {summary.topics_discussed.slice(0, 3).map((topic, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {topic}
                </span>
              ))}
              {summary.topics_discussed.length > 3 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  +{summary.topics_discussed.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
        
        {summary.action_items.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Action Items</h4>
            <div className="space-y-2">
              {summary.action_items.slice(0, 2).map((actionItem, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {actionItem.description}
                  </span>
                  {actionItem.assignee && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({actionItem.assignee})
                    </span>
                  )}
                </div>
              ))}
              {summary.action_items.length > 2 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  +{summary.action_items.length - 2} more action items
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Filter Component
function SummaryFilters({ 
  filters, 
  onFiltersChange 
}: { 
  filters: { sentiment?: string; date_from?: string; date_to?: string };
  onFiltersChange: (filters: { sentiment?: string; date_from?: string; date_to?: string }) => void;
}) {
  return (
    <div className="card">
      <div className="card-body">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Filters</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sentiment
            </label>
            <select
              value={filters.sentiment || ''}
              onChange={(e) => onFiltersChange({ ...filters, sentiment: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => onFiltersChange({ ...filters, date_from: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => onFiltersChange({ ...filters, date_to: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const MeetingSummariesPage: NextPage = () => {
  const { 
    meetingSummaries, 
    summariesLoading: meetingSummariesLoading, 
    setMeetingSummaries, 
    setSummariesLoading: setMeetingSummariesLoading 
  } = useMeetingStore();
  
  const [filters, setFilters] = useState<{ sentiment?: string; date_from?: string; date_to?: string }>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadSummaries = async () => {
      try {
        setMeetingSummariesLoading(true);
        const summariesData = await apiClient.getMeetingSummaries();
        setMeetingSummaries(summariesData);
      } catch (error) {
        console.error('Failed to load meeting summaries:', error);
        toast.error('Failed to load meeting summaries');
      } finally {
        setMeetingSummariesLoading(false);
      }
    };

    loadSummaries();
  }, [setMeetingSummaries, setMeetingSummariesLoading]);

  const filteredSummaries = meetingSummaries.filter(summary => {
    // Filter by sentiment
    if (filters.sentiment && summary.sentiment !== filters.sentiment) return false;
    
    // Filter by date range
    if (filters.date_from) {
      const summaryDate = new Date(summary.created_at);
      const fromDate = new Date(filters.date_from);
      if (summaryDate < fromDate) return false;
    }
    
    if (filters.date_to) {
      const summaryDate = new Date(summary.created_at);
      const toDate = new Date(filters.date_to);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (summaryDate > toDate) return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        summary.summary_text.toLowerCase().includes(searchLower) ||
        summary.topics_discussed.some(topic => topic.toLowerCase().includes(searchLower)) ||
        summary.key_decisions.some(decision => decision.toLowerCase().includes(searchLower)) ||
        summary.action_items.some(action => action.description.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const getSentimentStats = () => {
    const stats = {
      positive: 0,
      negative: 0,
      neutral: 0,
      unknown: 0
    };
    
    meetingSummaries.forEach(summary => {
      if (summary.sentiment) {
        stats[summary.sentiment as keyof typeof stats]++;
      } else {
        stats.unknown++;
      }
    });
    
    return stats;
  };

  const sentimentStats = getSentimentStats();

  return (
    <>
      <Head>
        <title>Meeting Summaries - AI Receptionist</title>
      </Head>

      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Meeting Summaries</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                AI-generated summaries and insights from meetings.
              </p>
            </div>
            
            <Link href="/meetings">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Meetings
              </button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-lg bg-primary-500">
                    <DocumentTextIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Summaries</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{meetingSummaries.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-lg bg-green-500">
                    <CheckCircleIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Positive</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{sentimentStats.positive}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-lg bg-red-500">
                    <CheckCircleIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Negative</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{sentimentStats.negative}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-lg bg-gray-500">
                    <CheckCircleIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Neutral</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{sentimentStats.neutral}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <SummaryFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Summaries List */}
          <div className="lg:col-span-3">
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Summaries ({filteredSummaries.length})
                  </h2>
                  
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search summaries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card-body">
                {meetingSummariesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading summaries...</span>
                  </div>
                ) : filteredSummaries.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No summaries</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {Object.keys(filters).length > 0 || searchTerm 
                        ? 'No summaries match your current filters.' 
                        : 'No meeting summaries have been generated yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSummaries.map((summary) => (
                      <SummaryCard key={summary.id} summary={summary} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MeetingSummariesPage;
