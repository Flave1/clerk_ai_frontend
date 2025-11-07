import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { 
  VideoCameraIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  PlayIcon,
  StopIcon,
  EyeIcon,
  DocumentTextIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useMeetingStore } from '@/store';
import apiClient from '@/lib/api';
import { Meeting, MeetingStatus, MeetingPlatform } from '@/types';
import toast from 'react-hot-toast';
import Header from '@/components/layout/Header';
import Link from 'next/link';

// Platform Icon Component
function PlatformIcon({ platform }: { platform: MeetingPlatform }) {
  const iconClass = "h-5 w-5";
  
  switch (platform) {
    case 'google_meet':
      return <div className={`${iconClass} bg-blue-500 rounded flex items-center justify-center`}>
        <VideoCameraIcon className="h-3 w-3 text-white" />
      </div>;
    case 'zoom':
      return <div className={`${iconClass} bg-blue-600 rounded flex items-center justify-center`}>
        <VideoCameraIcon className="h-3 w-3 text-white" />
      </div>;
    case 'microsoft_teams':
      return <div className={`${iconClass} bg-purple-600 rounded flex items-center justify-center`}>
        <VideoCameraIcon className="h-3 w-3 text-white" />
      </div>;
    default:
      return <VideoCameraIcon className={iconClass} />;
  }
}

// Status Badge Component
function StatusBadge({ status }: { status: MeetingStatus }) {
  const statusConfig = {
    scheduled: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', label: 'Scheduled' },
    joining: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Joining' },
    active: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Active' },
    ended: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Ended' },
    failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Failed' },
    cancelled: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', label: 'Cancelled' },
  };

  const config = statusConfig[status] || statusConfig.scheduled;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

// Meeting Card Component
function MeetingCard({ 
  meeting, 
  isSelected, 
  onToggleSelect 
}: { 
  meeting: Meeting;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleJoinMeeting = async () => {
    try {
      setIsJoining(true);
      await apiClient.joinMeeting(meeting.id);
      toast.success('Meeting join request sent');
    } catch (error) {
      console.error('Failed to join meeting:', error);
      toast.error('Failed to join meeting');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveMeeting = async () => {
    try {
      setIsLeaving(true);
      await apiClient.leaveMeeting(meeting.id);
      toast.success('Meeting leave request sent');
    } catch (error) {
      console.error('Failed to leave meeting:', error);
      toast.error('Failed to leave meeting');
    } finally {
      setIsLeaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    return `${durationMinutes} min`;
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(meeting.id)}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
              />
            )}
            <PlatformIcon platform={meeting.platform} />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                {meeting.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {meeting.description || 'No description'}
              </p>
              
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{formatDate(meeting.start_time)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>{formatDuration(meeting.start_time, meeting.end_time)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <UsersIcon className="h-4 w-4" />
                  <span>{meeting.participants.length} participants</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <StatusBadge status={meeting.status} />
            
            <div className="flex space-x-2">
              {meeting.status === 'scheduled' && (
                <button
                  onClick={handleJoinMeeting}
                  disabled={isJoining}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlayIcon className="h-3 w-3 mr-1" />
                  {isJoining ? 'Joining...' : 'Join'}
                </button>
              )}
              
              {meeting.status === 'active' && (
                <button
                  onClick={handleLeaveMeeting}
                  disabled={isLeaving}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <StopIcon className="h-3 w-3 mr-1" />
                  {isLeaving ? 'Leaving...' : 'Leave'}
                </button>
              )}
              
              <Link href={`/meetings/${meeting.id}`}>
                <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <EyeIcon className="h-3 w-3 mr-1" />
                  View
                </button>
              </Link>
            </div>
          </div>
        </div>
        
        {meeting.error_message && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {meeting.error_message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Filter Component
function MeetingFilters({ 
  filters, 
  onFiltersChange 
}: { 
  filters: { status?: MeetingStatus; platform?: MeetingPlatform };
  onFiltersChange: (filters: { status?: MeetingStatus; platform?: MeetingPlatform }) => void;
}) {
  return (
    <div className="card">
      <div className="card-body">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Filters</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as MeetingStatus || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="joining">Joining</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Platform
            </label>
            <select
              value={filters.platform || ''}
              onChange={(e) => onFiltersChange({ ...filters, platform: e.target.value as MeetingPlatform || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">All Platforms</option>
              <option value="google_meet">Google Meet</option>
              <option value="zoom">Zoom</option>
              <option value="microsoft_teams">Microsoft Teams</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

const MeetingsPage: NextPage = () => {
  const { 
    meetings, 
    meetingsLoading, 
    setMeetings, 
    setMeetingsLoading 
  } = useMeetingStore();
  
  const [filters, setFilters] = useState<{ status?: MeetingStatus; platform?: MeetingPlatform }>({});
  const [selectedMeetings, setSelectedMeetings] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleMeetingSelection = (meetingId: string) => {
    const newSelected = new Set(selectedMeetings);
    if (newSelected.has(meetingId)) {
      newSelected.delete(meetingId);
    } else {
      newSelected.add(meetingId);
    }
    setSelectedMeetings(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedMeetings.size === filteredMeetings.length) {
      setSelectedMeetings(new Set());
    } else {
      setSelectedMeetings(new Set(filteredMeetings.map(m => m.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMeetings.size === 0) {
      toast.error('No meetings selected');
      return;
    }

    try {
      setIsDeleting(true);
      const result = await apiClient.bulkDeleteMeetings(Array.from(selectedMeetings));
      
      if (result.success) {
        toast.success(`Deleted ${result.deleted_count} meeting(s)`);
        if (result.failed_deletions.length > 0) {
          toast.error(`Failed to delete ${result.failed_deletions.length} meeting(s)`);
        }
        
        // Reload meetings
        const meetingsData = await apiClient.getMeetings(filters);
        setMeetings(meetingsData);
        setSelectedMeetings(new Set());
      }
    } catch (error) {
      console.error('Failed to delete meetings:', error);
      toast.error('Failed to delete meetings');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        setMeetingsLoading(true);
        const meetingsData = await apiClient.getMeetings(filters);
        setMeetings(meetingsData);
      } catch (error) {
        console.error('Failed to load meetings:', error);
        toast.error('Failed to load meetings');
      } finally {
        setMeetingsLoading(false);
      }
    };

    loadMeetings();
  }, [filters, setMeetings, setMeetingsLoading]);

  const filteredMeetings = meetings.filter(meeting => {
    if (filters.status && meeting.status !== filters.status) return false;
    if (filters.platform && meeting.platform !== filters.platform) return false;
    return true;
  });

  return (
    <>
      <Head>
        <title>Meetings - AI Receptionist</title>
      </Head>

      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Meetings</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage and monitor AI meeting participation across platforms.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Link href="/meetings/config">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <CogIcon className="h-4 w-4 mr-2" />
                  Configuration
                </button>
              </Link>
              
              <Link href="/meetings/summaries">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Summaries
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <MeetingFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Meetings List */}
          <div className="lg:col-span-3">
            {/* Bulk Actions Bar */}
            {selectedMeetings.size > 0 && (
              <div className="mb-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
                      {selectedMeetings.size} meeting{selectedMeetings.size !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedMeetings(new Set())}
                      className="px-3 py-1.5 text-sm font-medium text-primary-700 dark:text-primary-300 hover:text-primary-900 dark:hover:text-primary-100"
                    >
                      Clear Selection
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete Selected'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    All Meetings ({filteredMeetings.length})
                  </h2>
                  {filteredMeetings.length > 0 && (
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMeetings.size === filteredMeetings.length && filteredMeetings.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Select All</span>
                    </label>
                  )}
                </div>
              </div>
              
              <div className="card-body">
                {meetingsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading meetings...</span>
                  </div>
                ) : filteredMeetings.length === 0 ? (
                  <div className="text-center py-12">
                    <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No meetings</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {Object.keys(filters).length > 0 
                        ? 'No meetings match your current filters.' 
                        : 'No meetings have been scheduled yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMeetings.map((meeting) => (
                      <MeetingCard 
                        key={meeting.id} 
                        meeting={meeting}
                        isSelected={selectedMeetings.has(meeting.id)}
                        onToggleSelect={toggleMeetingSelection}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Delete {selectedMeetings.size} Meeting{selectedMeetings.size !== 1 ? 's' : ''}?
              </h3>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete {selectedMeetings.size} meeting{selectedMeetings.size !== 1 ? 's' : ''}? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MeetingsPage;
