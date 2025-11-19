import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  VideoCameraIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  PlayIcon,
  StopIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ShareIcon,
  BellIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  LinkIcon,
  InformationCircleIcon,
  CogIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { useMeetingStore } from '@/store';
import apiClient from '@/lib/api';
import { Meeting, MeetingSummary, ActionItem, TranscriptionChunk } from '@/types';
import toast from 'react-hot-toast';
import Header from '@/components/layout/Header';

// Platform Icon Component
function PlatformIcon({ platform }: { platform: string }) {
  const iconClass = "h-6 w-6";
  
  switch (platform) {
    case 'google_meet':
      return <div className={`${iconClass} bg-blue-500 rounded flex items-center justify-center`}>
        <VideoCameraIcon className="h-4 w-4 text-white" />
      </div>;
    case 'zoom':
      return <div className={`${iconClass} bg-blue-600 rounded flex items-center justify-center`}>
        <VideoCameraIcon className="h-4 w-4 text-white" />
      </div>;
    case 'microsoft_teams':
      return <div className={`${iconClass} bg-purple-600 rounded flex items-center justify-center`}>
        <VideoCameraIcon className="h-4 w-4 text-white" />
      </div>;
    default:
      return <VideoCameraIcon className={iconClass} />;
  }
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    scheduled: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', label: 'Scheduled' },
    joining: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Joining' },
    active: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Active' },
    ended: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Ended' },
    failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Failed' },
    cancelled: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', label: 'Cancelled' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

// Action Item Component
function ActionItemCard({ actionItem }: { actionItem: ActionItem }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      // This would need the meeting ID from props or context
      // await apiClient.updateActionItem(meetingId, actionItem.id, newStatus);
      toast.success('Action item updated');
    } catch (error) {
      console.error('Failed to update action item:', error);
      toast.error('Failed to update action item');
    } finally {
      setIsUpdating(false);
    }
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {actionItem.description}
            </p>
            {actionItem.assignee && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Assigned to: {actionItem.assignee}
              </p>
            )}
            {actionItem.due_date && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Due: {new Date(actionItem.due_date).toLocaleDateString()}
              </p>
            )}
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[actionItem.priority as keyof typeof priorityColors]}`}>
              {actionItem.priority}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[actionItem.status as keyof typeof statusColors]}`}>
              {actionItem.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Transcription Component
function TranscriptionView({ transcription }: { transcription: string }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Transcription</h3>
      </div>
      <div className="card-body">
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {transcription || 'No transcription available yet.'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Summary Component
function SummaryView({ summary }: { summary: MeetingSummary }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Meeting Summary</h3>
      </div>
      <div className="card-body">
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            {summary.summary_text}
          </p>
          
          {summary.topics_discussed.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Topics Discussed</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                {summary.topics_discussed.map((topic, index) => (
                  <li key={index}>{topic}</li>
                ))}
              </ul>
            </div>
          )}
          
          {summary.key_decisions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Key Decisions</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                {summary.key_decisions.map((decision, index) => (
                  <li key={index}>{decision}</li>
                ))}
              </ul>
            </div>
          )}
          
          {summary.sentiment && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Sentiment</h4>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                summary.sentiment === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                summary.sentiment === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
              }`}>
                {summary.sentiment}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MeetingDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { updateMeeting } = useMeetingStore();
  
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [transcription, setTranscription] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transcription' | 'summary' | 'actions'>('overview');

  useEffect(() => {
    if (!id) return;

    const loadMeetingData = async () => {
      try {
        setLoading(true);
        
        const [meetingData, summaryData, actionItemsData, transcriptionData] = await Promise.all([
          apiClient.getMeeting(id as string),
          apiClient.getMeetingSummary(id as string).catch(() => null),
          apiClient.getMeetingActionItems(id as string).catch(() => []),
          apiClient.getMeetingTranscription(id as string).catch(() => ({ transcription: '' })),
        ]);

        setMeeting(meetingData);
        setSummary(summaryData);
        setActionItems(actionItemsData);
        setTranscription(transcriptionData.transcription);
      } catch (error) {
        console.error('Failed to load meeting data:', error);
        toast.error('Failed to load meeting data');
      } finally {
        setLoading(false);
      }
    };

    loadMeetingData();
  }, [id]);

  const handleJoinMeeting = async () => {
    if (!meeting) return;
    
    try {
      setIsJoining(true);
      await apiClient.joinMeeting(meeting.id);
      toast.success('Meeting join request sent');
      // Update meeting status optimistically
      const updatedMeeting = { ...meeting, status: 'joining' as any };
      setMeeting(updatedMeeting);
      updateMeeting(updatedMeeting);
    } catch (error) {
      console.error('Failed to join meeting:', error);
      toast.error('Failed to join meeting');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveMeeting = async () => {
    if (!meeting) return;
    
    try {
      setIsLeaving(true);
      await apiClient.leaveMeeting(meeting.id);
      toast.success('Meeting leave request sent');
      // Update meeting status optimistically
      const updatedMeeting = { ...meeting, status: 'ended' as any };
      setMeeting(updatedMeeting);
      updateMeeting(updatedMeeting);
    } catch (error) {
      console.error('Failed to leave meeting:', error);
      toast.error('Failed to leave meeting');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleStartMeeting = async () => {
    if (!meeting) return;
    
    try {
      setIsStarting(true);
      const result = await apiClient.startMeeting(meeting.id);
      toast.success('Meeting started successfully');
      
      // Update meeting optimistically
      const updatedMeeting = { 
        ...meeting, 
        meeting_started: true,
        status: 'active' as any 
      };
      setMeeting(updatedMeeting);
      updateMeeting(updatedMeeting);
      
      // If there's a meeting_ui_url, open it in a new tab
      if (result.meeting_ui_url) {
        window.open(result.meeting_ui_url, '_blank');
      }
    } catch (error) {
      console.error('Failed to start meeting:', error);
      toast.error('Failed to start meeting');
    } finally {
      setIsStarting(false);
    }
  };

  const handleSendNotification = async (type: 'summary' | 'action_items' | 'reminder') => {
    if (!meeting) return;
    
    try {
      await apiClient.sendMeetingNotification(meeting.id, type);
      toast.success(`${type.replace('_', ' ')} notification sent`);
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('Failed to send notification');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading meeting...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Meeting not found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The meeting you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/meetings')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Meetings
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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
    return `${durationMinutes} minutes`;
  };

  return (
    <>
      <Head>
        <title>{meeting.title} - Aurray</title>
      </Head>

      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/meetings')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </button>
              
              <div className="flex items-center space-x-3">
                <PlatformIcon platform={meeting.platform} />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {meeting.title}
                  </h1>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {meeting.description || 'No description'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <StatusBadge status={meeting.status} />
              
              {meeting.status === 'scheduled' && (
                <button
                  onClick={handleJoinMeeting}
                  disabled={isJoining}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  {isJoining ? 'Joining...' : 'Join Meeting'}
                </button>
              )}
              
              {meeting.status === 'active' && (
                <button
                  onClick={handleLeaveMeeting}
                  disabled={isLeaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <StopIcon className="h-4 w-4 mr-2" />
                  {isLeaving ? 'Leaving...' : 'Leave Meeting'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Meeting Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Meeting Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Start Time</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(meeting.start_time)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <ClockIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Duration</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{formatDuration(meeting.start_time, meeting.end_time)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <UsersIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Participants</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{meeting.participants.length} people</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Participants</h3>
                    <div className="space-y-2">
                      {meeting.participants.slice(0, 5).map((participant, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                              {participant.name ? participant.name.charAt(0).toUpperCase() : participant.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {participant.name || participant.email}
                            </p>
                            {participant.is_organizer && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">Organizer</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {meeting.participants.length > 5 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          +{meeting.participants.length - 5} more participants
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Quick Actions</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  <button
                    onClick={() => handleSendNotification('summary')}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Send Summary
                  </button>
                  
                  {meeting.meeting_started ? (
                    <button
                      onClick={() => handleSendNotification('action_items')}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Send Action Items
                    </button>
                  ) : !meeting.meeting_started && meeting.status !== 'ended' && meeting.status !== 'cancelled' ? (
                    <button
                      onClick={handleStartMeeting}
                      disabled={isStarting}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlayIcon className="h-4 w-4 mr-2" />
                      {isStarting ? 'Starting...' : 'Start Meeting Now'}
                    </button>
                  ) : null}
                  
                  <a
                    href={meeting.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <ShareIcon className="h-4 w-4 mr-2" />
                    Open Meeting
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: VideoCameraIcon },
              { id: 'transcription', label: 'Transcription', icon: ChatBubbleLeftRightIcon },
              { id: 'summary', label: 'Summary', icon: DocumentTextIcon },
              { id: 'actions', label: 'Action Items', icon: CheckCircleIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-1 py-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {meeting.error_message && (
                <div className="card">
                  <div className="card-body">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                          {meeting.error_message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Meeting Statistics */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Meeting Statistics</h3>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{meeting.join_attempts}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Join Attempts</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {meeting.transcription_chunks.length}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Transcription Chunks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {actionItems.length}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Action Items</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bot Status */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Bot Status</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Meeting Started</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          meeting.meeting_started 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {meeting.meeting_started ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {meeting.last_join_attempt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Last Join Attempt</span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(meeting.last_join_attempt)}
                          </span>
                        </div>
                      )}
                      {meeting.joined_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Joined At</span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(meeting.joined_at)}
                          </span>
                        </div>
                      )}
                      {meeting.ended_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Ended At</span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(meeting.ended_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Meeting Configuration and Metadata */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Meeting Configuration */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <CogIcon className="h-5 w-5 mr-2" />
                      Meeting Configuration
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      {meeting.bot_name && (
                        <div className="flex items-center space-x-3">
                          <UsersIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Bot Name</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{meeting.bot_name}</p>
                          </div>
                        </div>
                      )}
                      {meeting.voice_id && (
                        <div className="flex items-center space-x-3">
                          <SpeakerWaveIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Voice Profile</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{meeting.voice_id}</p>
                          </div>
                        </div>
                      )}
                      {meeting.context_id && (
                        <div className="flex items-center space-x-3">
                          <InformationCircleIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Context ID</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{meeting.context_id}</p>
                          </div>
                        </div>
                      )}
                      {meeting.transcript !== undefined && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Transcription</span>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            meeting.transcript 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {meeting.transcript ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <MicrophoneIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Audio Recording</span>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          meeting.audio_enabled 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {meeting.audio_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <VideoCameraIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Video Recording</span>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          meeting.video_enabled 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {meeting.video_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meeting Metadata */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <InformationCircleIcon className="h-5 w-5 mr-2" />
                      Meeting Metadata
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Meeting ID</span>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {meeting.id}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(meeting.id);
                              toast.success('Meeting ID copied to clipboard');
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Copy Meeting ID"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {meeting.meeting_id_external && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">External Meeting ID</span>
                          <code className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {meeting.meeting_id_external}
                          </code>
                        </div>
                      )}
                      {meeting.calendar_event_id && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Calendar Event ID</span>
                          <code className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {meeting.calendar_event_id}
                          </code>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Platform</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                          {meeting.platform.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Created At</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(meeting.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(meeting.updated_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Meeting URL</span>
                        <div className="flex items-center space-x-2">
                          <a
                            href={meeting.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center"
                          >
                            <LinkIcon className="h-4 w-4 mr-1" />
                            Open
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(meeting.meeting_url);
                              toast.success('Meeting URL copied to clipboard');
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Copy URL"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'transcription' && (
            <TranscriptionView transcription={transcription} />
          )}
          
          {activeTab === 'summary' && (
            summary ? (
              <SummaryView summary={summary} />
            ) : (
              <div className="card">
                <div className="card-body text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No summary available</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    The meeting summary hasn't been generated yet.
                  </p>
                </div>
              </div>
            )
          )}
          
          {activeTab === 'actions' && (
            <div className="space-y-4">
              {actionItems.length === 0 ? (
                <div className="card">
                  <div className="card-body text-center py-12">
                    <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No action items</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      No action items have been identified for this meeting.
                    </p>
                  </div>
                </div>
              ) : (
                actionItems.map((actionItem) => (
                  <ActionItemCard key={actionItem.id} actionItem={actionItem} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MeetingDetailPage;
