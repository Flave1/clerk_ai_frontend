import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Header from '@/components/layout/Header';
import { 
  DocumentTextIcon,
  ArrowPathIcon,
  TrashIcon,
  ClockIcon,
  ServerIcon,
  ComputerDesktopIcon,
  CloudIcon,
  LinkIcon,
  UserIcon,
  CalendarIcon,
  IdentificationIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { format, formatDistanceToNow } from 'date-fns';

interface ActiveBot {
  deployment_method: string;
  container_id?: string;
  container_name?: string;
  task_arn?: string;
  task_id?: string;
  cluster?: string;
  process_id?: number;
  process_group_id?: number;
  log_file?: string;
  provider_meeting_id?: string;
  session_id: string;
  started_at: string;
  platform: string;
  meeting_url: string;
  user_id?: string;
  provider_response?: any;
  log_handle?: any;
}

const LogsPage: NextPage = () => {
  const [activeBots, setActiveBots] = useState<Record<string, ActiveBot>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [botToDelete, setBotToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [screenshotsOpen, setScreenshotsOpen] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [loadingScreenshots, setLoadingScreenshots] = useState(false);
  
  const BOT_SERVER_URL = 'http://localhost:3001';

  const fetchActiveBots = async () => {
    try {
      setRefreshing(true);
      const response = await apiClient.getActiveBots();
      setActiveBots(response.bots || {});
      setLastRefreshed(new Date());
    } catch (error: any) {
      console.error('Failed to fetch active bots:', error);
      toast.error(error?.response?.data?.detail || 'Failed to fetch active bots');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Set initial refresh time immediately
    setLastRefreshed(new Date());
    fetchActiveBots();
  }, []);

  const handleDelete = async () => {
    if (!botToDelete) return;

    try {
      setDeleting(true);
      await apiClient.removeBot(botToDelete);
      toast.success('Bot removed successfully');
      setDeleteConfirmOpen(false);
      setBotToDelete(null);
      // Refresh the list
      await fetchActiveBots();
    } catch (error: any) {
      console.error('Failed to remove bot:', error);
      toast.error(error?.response?.data?.detail || 'Failed to remove bot');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteConfirm = (meetingId: string) => {
    setBotToDelete(meetingId);
    setDeleteConfirmOpen(true);
  };

  const openScreenshots = async (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setScreenshotsOpen(true);
    setLoadingScreenshots(true);
    
    try {
      const response = await fetch(`${BOT_SERVER_URL}/meetings/${meetingId}/screenshots`);
      if (!response.ok) {
        throw new Error('Failed to fetch screenshots');
      }
      const data = await response.json();
      setScreenshots(data.screenshots || []);
    } catch (error: any) {
      console.error('Failed to fetch screenshots:', error);
      toast.error('Failed to load screenshots');
      setScreenshots([]);
    } finally {
      setLoadingScreenshots(false);
    }
  };

  const getDeploymentIcon = (method: string) => {
    switch (method) {
      case 'docker':
        return <ServerIcon className="w-5 h-5" />;
      case 'ecs':
        return <CloudIcon className="w-5 h-5" />;
      case 'subprocess':
        return <ComputerDesktopIcon className="w-5 h-5" />;
      case 'provider_sdk':
        return <LinkIcon className="w-5 h-5" />;
      default:
        return <ServerIcon className="w-5 h-5" />;
    }
  };

  const getDeploymentBadgeColor = (method: string) => {
    switch (method) {
      case 'docker':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ecs':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'subprocess':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'provider_sdk':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatUptime = (startedAt: string) => {
    try {
      const start = new Date(startedAt);
      return formatDistanceToNow(start, { addSuffix: false });
    } catch {
      return 'Unknown';
    }
  };

  const botEntries = Object.entries(activeBots);

  return (
    <>
      <Head>
        <title>Active Bots - Logs - Aurray</title>
      </Head>
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <DocumentTextIcon className="w-8 h-8" />
                Active Bots
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Monitor and manage active bot instances
              </p>
            </div>
            <div className="flex items-center gap-4">
              {lastRefreshed && (
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  <span>
                    Last refreshed: {format(lastRefreshed, 'HH:mm:ss')}
                  </span>
                </div>
              )}
              <button
                onClick={fetchActiveBots}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon 
                  className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} 
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <ArrowPathIcon className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading active bots...</p>
            </div>
          </div>
        ) : botEntries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <ServerIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Active Bots
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              There are no active bot instances running at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {botEntries.map(([meetingId, bot]) => (
              <div
                key={meetingId}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getDeploymentIcon(bot.deployment_method)}
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getDeploymentBadgeColor(bot.deployment_method)}`}>
                          {bot.deployment_method}
                        </span>
                      </div>
                      <h3 className="text-sm font-mono text-white truncate" title={meetingId}>
                        {meetingId.length > 24 ? `${meetingId.substring(0, 24)}...` : meetingId}
                      </h3>
                      {bot.session_id && (
                        <div className="text-xs text-primary-100 mt-1 font-mono">
                          Session: {bot.session_id.substring(0, 12)}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => openDeleteConfirm(meetingId)}
                      className="ml-2 p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                      title="Remove bot"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  {/* Platform Badge */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {bot.platform}
                    </span>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                      <ClockIcon className="w-4 h-4" />
                      <span className="font-medium">{formatUptime(bot.started_at)}</span>
                    </div>
                  </div>

                  {/* Meeting URL */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                      Meeting URL
                    </label>
                    <a
                      href={bot.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 break-all line-clamp-2 hover:underline"
                    >
                      {bot.meeting_url}
                    </a>
                  </div>

                  {/* User ID */}
                  {bot.user_id && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5" />
                        User ID
                      </label>
                      <div className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                        {bot.user_id.length > 30 ? `${bot.user_id.substring(0, 30)}...` : bot.user_id}
                      </div>
                    </div>
                  )}

                  {/* Deployment Details */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    {bot.container_name && (
                      <div className="flex items-start gap-2">
                        <ServerIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Container</div>
                          <div className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate" title={bot.container_name}>
                            {bot.container_name}
                          </div>
                        </div>
                      </div>
                    )}
                    {bot.task_id && (
                      <div className="flex items-start gap-2">
                        <CloudIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Task ID</div>
                          <div className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate" title={bot.task_id}>
                            {bot.task_id}
                          </div>
                        </div>
                      </div>
                    )}
                    {bot.process_id && (
                      <div className="flex items-start gap-2">
                        <ComputerDesktopIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Process ID</div>
                          <div className="text-sm font-mono text-gray-900 dark:text-gray-100">
                            {bot.process_id}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Started At */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Started {format(new Date(bot.started_at), 'MMM d, yyyy HH:mm:ss')}</span>
                  </div>

                  {/* View Screenshots Button */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => openScreenshots(meetingId)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    >
                      <PhotoIcon className="w-4 h-4" />
                      View Screenshots
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Screenshots Modal */}
        {screenshotsOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div
                className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
                onClick={() => setScreenshotsOpen(false)}
              />

              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Screenshots - {selectedMeetingId}
                    </h3>
                    <p className="text-sm text-primary-100 mt-1">
                      {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  <button
                    onClick={() => setScreenshotsOpen(false)}
                    className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                  {loadingScreenshots ? (
                    <div className="flex items-center justify-center py-12">
                      <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-500" />
                      <span className="ml-3 text-gray-600 dark:text-gray-400">Loading screenshots...</span>
                    </div>
                  ) : screenshots.length === 0 ? (
                    <div className="text-center py-12">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No screenshots found</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        No screenshots have been captured for this meeting yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {screenshots.map((screenshot, index) => (
                        <div
                          key={index}
                          className="relative group bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          <img
                            src={`${BOT_SERVER_URL}${screenshot.url}`}
                            alt={screenshot.filename}
                            className="w-full h-48 object-contain bg-white dark:bg-gray-800"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                            <a
                              href={`${BOT_SERVER_URL}${screenshot.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100"
                            >
                              View Full Size
                            </a>
                          </div>
                          <div className="p-3 bg-white dark:bg-gray-800">
                            <p className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate" title={screenshot.filename}>
                              {screenshot.filename}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {format(new Date(screenshot.createdAt), 'MMM d, yyyy HH:mm:ss')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirmOpen}
          onClose={() => {
            setDeleteConfirmOpen(false);
            setBotToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Remove Bot"
          message={`Are you sure you want to remove the bot for meeting "${botToDelete}"? This will stop the bot instance.`}
          confirmText="Remove"
          confirmButtonColor="red"
          isLoading={deleting}
        />
      </div>
    </>
  );
};

export default LogsPage;
