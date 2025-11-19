import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  VideoCameraIcon,
  PhoneIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlusIcon,
  LinkIcon,
  CheckCircleIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { useDashboardStore } from '@/store';
import apiClient from '@/lib/api';
import { Meeting } from '@/types';
import toast from 'react-hot-toast';
import Header from '@/components/layout/Header';
import ComingSoonModal from '@/components/ui/ComingSoonModal';
import { format, isToday, isTomorrow, parseISO, differenceInMinutes } from 'date-fns';

const Dashboard: NextPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
  const { meetings, setMeetings } = useDashboardStore();

  // Load meetings
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const meetingsData = await apiClient.getMeetings().catch(() => []);
        setMeetings(meetingsData);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setMeetings]);

  // Get upcoming meetings (next 7 days)
  const upcomingMeetings = meetings
    .filter(m => {
      const startTime = parseISO(m.start_time);
      const now = new Date();
      return startTime > now && startTime < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    })
    .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime())
    .slice(0, 5);

  // Get recent meetings with summaries
  const recentMeetings = meetings
    .filter(m => m.summary)
    .sort((a, b) => parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime())
    .slice(0, 5);

  // Format meeting time
  const formatMeetingTime = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  // Get meeting status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'ended': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
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
        <title>Dashboard - Aurray</title>
      </Head>

      <Header />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => router.push('/select-meeting')}
                className="group relative overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-xl p-6 text-left transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                      <CalendarIcon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Schedule Meeting</h3>
                  <p className="text-white/90 text-sm">Create new meeting on Teams, Zoom, Google Meet and Aurray Connect</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>

              <button
                onClick={() => setIsComingSoonModalOpen(true)}
                className="group relative overflow-hidden bg-gradient-to-br from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 rounded-xl p-6 text-left transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                      <VideoCameraIcon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Send Aurray Bot to Meeting</h3>
                  <p className="text-white/90 text-sm">Aurray bot joins already scheduled meetings using your voice and personality</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
            </div>

            {/* Recent Meetings with Summaries */}
            <div className="card">
              <div className="card-header flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Meeting Summaries</h2>
                </div>
                <button
                  onClick={() => router.push('/meetings')}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  View All
                </button>
              </div>
              <div className="card-body">
                {recentMeetings.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-2">No meeting summaries yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Start a meeting to generate summaries</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentMeetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        onClick={() => router.push(`/meetings/${meeting.id}`)}
                        className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-1">
                              {meeting.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {formatMeetingTime(meeting.start_time)}
                              </span>
                              <span className="flex items-center">
                                <UserGroupIcon className="h-4 w-4 mr-1" />
                                {meeting.participants.length} participants
                              </span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                            {meeting.status}
                          </span>
                        </div>
                        {meeting.summary && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {meeting.summary.summary_text || meeting.summary.topics_discussed?.[0] || 'No summary available'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI Assistant Active */}
            <div className="card bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
              <div className="card-body">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircleIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Assistant Active</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ready to help with your meetings</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Calendar Settings, Upcoming Meetings & Quick Info */}
          <div className="space-y-4 sm:space-y-6 mt-6 lg:mt-0">
            {/* Calendar Meeting Settings */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Calendar Settings</h2>
                </div>
              </div>
              <div className="card-body">
                <Link
                  href="/settings"
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <CogIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Auto-join & Preferences</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Configure meeting settings</p>
                    </div>
                  </div>
                  <CheckCircleIcon className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Upcoming Meetings Card */}
            <div className="card">
              <div className="card-header flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upcoming Meetings</h2>
                </div>
                <button
                  onClick={() => router.push('/select-meeting')}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <PlusIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <div className="card-body">
                {upcomingMeetings.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No upcoming meetings</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Schedule a meeting to get started</p>
                    <button
                      onClick={() => router.push('/select-meeting')}
                      className="mt-4 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                    >
                      Schedule Meeting
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingMeetings.map((meeting) => {
                      const startTime = parseISO(meeting.start_time);
                      const now = new Date();
                      const minutesUntil = differenceInMinutes(startTime, now);
                      const isStartingSoon = minutesUntil <= 15 && minutesUntil > 0;

                      return (
                        <div
                          key={meeting.id}
                          onClick={() => router.push(`/meetings/${meeting.id}`)}
                          className={`p-4 rounded-lg border transition-all cursor-pointer ${
                            isStartingSoon
                              ? 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                              {meeting.title}
                            </h3>
                            {isStartingSoon && (
                              <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                                Soon
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <p className="flex items-center">
                              <ClockIcon className="h-3.5 w-3.5 mr-1.5" />
                              {formatMeetingTime(meeting.start_time)}
                            </p>
                            <p className="flex items-center">
                              <VideoCameraIcon className="h-3.5 w-3.5 mr-1.5" />
                              {meeting.platform}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 border-primary-200 dark:border-primary-700">
              <div className="card-body">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-primary-500 rounded-lg">
                    <SparklesIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Quick Stats</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overview</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Meetings</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{meetings.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Summaries</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{recentMeetings.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ComingSoonModal
        isOpen={isComingSoonModalOpen}
        onClose={() => setIsComingSoonModalOpen(false)}
        title="Send Aurray Bot to Meeting"
        featureName="Send Aurray Bot to Meeting"
        message="This feature is coming soon! Aurray bot will be able to join your already scheduled meetings using your voice and personality. Stay tuned for updates!"
      />
    </>
  );
};

export default Dashboard;
