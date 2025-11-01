import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon, 
  CogIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PuzzlePieceIcon,
  AdjustmentsHorizontalIcon,
  CodeBracketIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useDashboardStore } from '@/store';
import apiClient from '@/lib/api';
import { DashboardStats } from '@/types';
import toast from 'react-hot-toast';
import Header from '@/components/layout/Header';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<any>;
  color: string;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
}

function StatCard({ title, value, icon: Icon, color, change, changeType }: StatCardProps) {
  const changeColor = {
    increase: 'text-success-600 dark:text-success-400',
    decrease: 'text-danger-600 dark:text-danger-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  }[changeType || 'neutral'];

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-lg ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
            {change && (
              <p className={`text-sm ${changeColor}`}>
                {change}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Recent Activity Component
function RecentActivity({ loadingStates }: { loadingStates: any }) {
  const { conversations, actions } = useDashboardStore();

  const recentConversations = conversations
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, 5);

  const recentActions = actions
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Conversations */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Conversations</h3>
        </div>
        <div className="card-body">
          {loadingStates.conversations ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading conversations...</span>
            </div>
          ) : recentConversations.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No conversations yet</p>
          ) : (
            <div className="space-y-4">
              {recentConversations.map((conversation) => (
                <div key={conversation.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <ChatBubbleLeftRightIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Conversation {conversation.id.slice(-8)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {conversation.turn_count} turns
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`status-badge ${
                      conversation.status === 'active' ? 'status-active' :
                      conversation.status === 'completed' ? 'status-completed' :
                      conversation.status === 'failed' ? 'status-failed' : 'status-pending'
                    }`}>
                      {conversation.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Actions</h3>
        </div>
        <div className="card-body">
          {loadingStates.actions ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading actions...</span>
            </div>
          ) : recentActions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No actions yet</p>
          ) : (
            <div className="space-y-4">
              {recentActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-warning-100 dark:bg-warning-900 flex items-center justify-center">
                        <CogIcon className="h-4 w-4 text-warning-600 dark:text-warning-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {action.action_type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {action.conversation_id.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`status-badge ${
                      action.status === 'completed' ? 'status-completed' :
                      action.status === 'failed' ? 'status-failed' :
                      action.status === 'in_progress' ? 'status-active' : 'status-pending'
                    }`}>
                      {action.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Dashboard: NextPage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    conversations: false,
    actions: false,
    rooms: false,
    meetings: false,
    stats: false
  });
  const { 
    conversations, 
    actions, 
    rooms,
    meetings,
    setConversations, 
    setActions, 
    setRooms,
    setMeetings
  } = useDashboardStore();

  const handleSignOut = () => {
    router.push('/login');
  };

  // Load critical data first (stats)
  useEffect(() => {
    const loadCriticalData = async () => {
      try {
        setLoadingStates(prev => ({ ...prev, stats: true }));
        const statsData = await apiClient.getDashboardStats();
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load stats:', error);
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoadingStates(prev => ({ ...prev, stats: false }));
        setInitialLoading(false);
      }
    };

    loadCriticalData();
  }, []);

  // Load other data in background after initial render
  useEffect(() => {
    if (!initialLoading) {
      const loadBackgroundData = async () => {
        try {
          // Load conversations first (most important)
          setLoadingStates(prev => ({ ...prev, conversations: true }));
          const conversationsData = await apiClient.getConversations();
          setConversations(conversationsData);
          setLoadingStates(prev => ({ ...prev, conversations: false }));

          // Load actions, rooms, and meetings in parallel
          const [actionsData, roomsData, meetingsData] = await Promise.all([
            apiClient.getActions().catch(err => {
              console.error('Failed to load actions:', err);
              return [];
            }),
            apiClient.getRooms().catch(err => {
              console.error('Failed to load rooms:', err);
              return [];
            }),
            apiClient.getMeetings().catch(err => {
              console.error('Failed to load meetings:', err);
              return [];
            })
          ]);

          setActions(actionsData);
          setRooms(roomsData);
          setMeetings(meetingsData);
          setLoadingStates(prev => ({ ...prev, actions: false, rooms: false, meetings: false }));
          
        } catch (error) {
          console.error('Failed to load background data:', error);
          setLoadingStates(prev => ({ ...prev, conversations: false, actions: false, rooms: false, meetings: false }));
        }
      };

      loadBackgroundData();
    }
  }, [initialLoading, setConversations, setActions, setRooms]);

  // Show minimal loading only for critical stats
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - Auray</title>
      </Head>

      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Auray Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor meetings, conversations, actions, and system performance in real-time.
          </p>
        </div>

        {/* Quick Navigation Menu */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Integrations Card */}
          <div className="card cursor-pointer hover:shadow-lg transition-shadow duration-300" onClick={() => router.push('/integrations')}>
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-lg bg-purple-500">
                    <PuzzlePieceIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Integrations</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage connected apps</p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Card */}
          <div className="card cursor-pointer hover:shadow-lg transition-shadow duration-300" onClick={() => router.push('/settings')}>
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-lg bg-blue-500">
                    <AdjustmentsHorizontalIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Configure preferences</p>
                </div>
              </div>
            </div>
          </div>

          {/* Developer Card */}
          <div className="card cursor-pointer hover:shadow-lg transition-shadow duration-300" onClick={() => router.push('/developer')}>
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-lg bg-green-500">
                    <CodeBracketIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Developer</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">API keys & webhooks</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats ? (
            <>
              <StatCard
                title="Total Conversations"
                value={stats.total_conversations}
                icon={ChatBubbleLeftRightIcon}
                color="bg-primary-500"
              />
              <StatCard
                title="Active Conversations"
                value={stats.active_conversations}
                icon={UsersIcon}
                color="bg-success-500"
              />
              <StatCard
                title="Pending Actions"
                value={stats.pending_actions}
                icon={ClockIcon}
                color="bg-warning-500"
              />
              <StatCard
                title="Completed Actions"
                value={stats.completed_actions}
                icon={CheckCircleIcon}
                color="bg-success-500"
              />
            </>
          ) : (
            // Skeleton loading for stats
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="p-3 rounded-lg bg-gray-300 dark:bg-gray-600 animate-pulse">
                        <div className="h-6 w-6"></div>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Meeting Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Meetings"
            value={meetings.length}
            icon={VideoCameraIcon}
            color="bg-blue-500"
          />
          <StatCard
            title="Active Meetings"
            value={meetings.filter(m => m.status === 'active').length}
            icon={UsersIcon}
            color="bg-green-500"
          />
          <StatCard
            title="Scheduled Meetings"
            value={meetings.filter(m => m.status === 'scheduled').length}
            icon={ClockIcon}
            color="bg-yellow-500"
          />
          <StatCard
            title="Meeting Summaries"
            value={meetings.filter(m => m.summary).length}
            icon={DocumentTextIcon}
            color="bg-purple-500"
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats ? (
            <>
              <StatCard
                title="Failed Actions"
                value={stats.failed_actions}
                icon={XCircleIcon}
                color="bg-danger-500"
              />
              <StatCard
                title="Total Actions"
                value={stats.total_actions}
                icon={CogIcon}
                color="bg-gray-500"
              />
              <StatCard
                title="Active Rooms"
                value={stats.active_rooms}
                icon={UsersIcon}
                color="bg-primary-500"
              />
              <StatCard
                title="Success Rate"
                value={`${stats.total_actions > 0 ? Math.round((stats.completed_actions / stats.total_actions) * 100) : 0}%`}
                icon={ChartBarIcon}
                color="bg-success-500"
              />
            </>
          ) : (
            // Skeleton loading for additional stats
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="p-3 rounded-lg bg-gray-300 dark:bg-gray-600 animate-pulse">
                        <div className="h-6 w-6"></div>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Activity */}
        <RecentActivity loadingStates={loadingStates} />

        {/* Sign Out Button */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={handleSignOut}
            className="flex items-center px-6 py-3 rounded-lg text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors duration-200 font-medium"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
