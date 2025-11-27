import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, MicrophoneIcon, VideoCameraIcon, DocumentTextIcon, SparklesIcon, LinkIcon, CalendarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import axios from '@/lib/axios';
import { useRouter } from 'next/router';
import { useUIStore } from '@/store';
import { MeetingContext } from '@/types';

const DEFAULT_VOICE_ID = 'f5HLTX707KIM4SzJYzSz';

interface SendAurrayBotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SendAurrayBotModal: React.FC<SendAurrayBotModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { theme } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasMeetingOnCalendar, setHasMeetingOnCalendar] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [audioRecord, setAudioRecord] = useState(false);
  const [screenRecord, setScreenRecord] = useState(false);
  const [transcript, setTranscript] = useState(true);
  const [botShouldRespond, setBotShouldRespond] = useState(false);
  const [joinNow, setJoinNow] = useState(true);
  const [duration, setDuration] = useState<number>(60); // Duration in minutes, default 60 minutes (1 hour)
  const [startTime, setStartTime] = useState<string>('');
  const [contexts, setContexts] = useState<MeetingContext[]>([]);
  const [contextsLoading, setContextsLoading] = useState(false);
  const [selectedContextId, setSelectedContextId] = useState<string>('');
  const [errors, setErrors] = useState<{
    meetingLink?: string;
    contextId?: string;
    startTime?: string;
  }>({});

  // Detect meeting platform from URL
  const detectPlatform = (url: string): string => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('zoom.us') || lowerUrl.includes('zoom.com')) {
      return 'zoom';
    } else if (lowerUrl.includes('meet.google.com') || lowerUrl.includes('google.com/meet')) {
      return 'google_meet';
    } else if (lowerUrl.includes('teams.microsoft.com') || lowerUrl.includes('teams.live.com')) {
      return 'microsoft_teams';
    }
    toast.error('Sorry, that meeting platform is not supported yet.');
    throw new Error('Unsupported meeting platform');
  };

  // Fetch contexts when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchContexts = async () => {
        try {
          setContextsLoading(true);
          const data = await apiClient.getMeetingContexts();
          setContexts(data);
        } catch (error) {
          console.error('Failed to load meeting contexts:', error);
        } finally {
          setContextsLoading(false);
        }
      };
      fetchContexts();
    }
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasMeetingOnCalendar(false);
      setMeetingLink('');
      setAudioRecord(false);
      setScreenRecord(false);
      setTranscript(true);
      setBotShouldRespond(false);
      setJoinNow(true);
      setDuration(60);
      setStartTime('');
      setSelectedContextId('');
      setErrors({});
    }
  }, [isOpen]);

  // Set default start time when modal opens or when joinNow changes
  useEffect(() => {
    if (isOpen && !joinNow && !startTime) {
      const now = new Date();
      const start = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      const formatDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      
      setStartTime(formatDateTime(start));
    }
  }, [isOpen, joinNow, startTime]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async () => {
    // Reset errors
    const newErrors: {
      meetingLink?: string;
      contextId?: string;
      startTime?: string;
    } = {};

    // Validate meeting link if not using calendar
    if (!hasMeetingOnCalendar && !meetingLink.trim()) {
      newErrors.meetingLink = 'Meeting link is required';
    }

    // Validate context if "Bot should respond" is checked
    if (botShouldRespond && !selectedContextId) {
      newErrors.contextId = 'Personality context is required when "Bot should respond" is enabled';
    }

    // Validate start time if not joining now
    if (!joinNow && !startTime) {
      newErrors.startTime = 'Start time is required';
    }

    // If there are errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // If user has meeting on calendar, redirect to calendar setup
    if (hasMeetingOnCalendar) {
      router.push('/calendar?integration=google_calendar');
      onClose();
      return;
    }

    // Submit the form
    try {
      setSubmitting(true);
      
      const platform = detectPlatform(meetingLink);
      const botName = 'Aurray Bot';

      // Always use start-external endpoint (same as Schedule Meeting modal)
      // Calculate end time from start time + duration if scheduling
      let calculatedEndTime: string | undefined = undefined;
      let startTimeISO: string | undefined = undefined;
      
      if (!joinNow && startTime) {
        const startDate = new Date(startTime);
        const endDate = new Date(startDate.getTime() + duration * 60 * 1000); // Add duration in milliseconds
        
        // Format as ISO 8601 string
        startTimeISO = startDate.toISOString();
        calculatedEndTime = endDate.toISOString();
      }

      const res = await axios.post('/conversations/start-external', {
        meeting_url: meetingLink.trim(),
        type: platform,
        title: `Meeting on ${platform}`,
        description: undefined,
        transcript,
        audio_record: audioRecord,
        video_record: screenRecord,
        bot_should_respond: botShouldRespond,
        voice_id: DEFAULT_VOICE_ID,
        bot_name: botName,
        context_id: botShouldRespond && selectedContextId ? selectedContextId : null,
        participants: [],
        start_time: startTimeISO,
        end_time: calculatedEndTime,
      });

      const data = res.data || {};
      toast.success(data.message || (joinNow ? 'Aurray Bot has been sent to the meeting!' : 'Meeting scheduled successfully!'));
      onClose();
    } catch (error: any) {
      console.error('Failed to send bot to meeting:', error);
      const detail = error?.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : error?.message || 'Failed to send bot to meeting. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Side Modal */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-[9999] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Send Aurray Bot to Meeting
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Send Aurray bot to join an already scheduled meeting
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Calendar Checkbox */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={hasMeetingOnCalendar}
                    onChange={(e) => setHasMeetingOnCalendar(e.target.checked)}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Do you have this meeting on your calendar?
                  </span>
                </label>
              </div>

              {/* Calendar Setup Link - Shown when checkbox is true */}
              {hasMeetingOnCalendar && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                        <strong>Setup Required:</strong> Connect your calendar to enable Aurray Bot to automatically join your scheduled meetings.
                      </p>
                      <button
                        onClick={() => {
                          router.push('/calendar?integration=google_calendar');
                          onClose();
                        }}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                      >
                        Go to Calendar Settings →
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Meeting Link Input - Hidden when checkbox is true */}
              {!hasMeetingOnCalendar && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Meeting Link <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="url"
                      value={meetingLink}
                      onChange={(e) => {
                        setMeetingLink(e.target.value);
                        if (errors.meetingLink) {
                          setErrors({ ...errors, meetingLink: undefined });
                        }
                      }}
                      placeholder="https://meet.google.com/..."
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all ${
                        errors.meetingLink
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-transparent'
                      }`}
                    />
                  </div>
                  {errors.meetingLink && (
                    <p className="mt-1 text-sm text-red-500">{errors.meetingLink}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Supports Zoom, Google Meet, and Microsoft Teams
                  </p>
                </motion.div>
              )}

              {/* Meeting Settings - Hidden when checkbox is true */}
              {!hasMeetingOnCalendar && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Meeting Settings
                  </label>
                  
                  <label className="flex items-center gap-3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={audioRecord}
                      onChange={(e) => setAudioRecord(e.target.checked)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <MicrophoneIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100">Audio Record</span>
                  </label>

                  <label className="flex items-center gap-3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={screenRecord}
                      onChange={(e) => setScreenRecord(e.target.checked)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <VideoCameraIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100">Screen Record</span>
                  </label>

                  <label className="flex items-center gap-3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={transcript}
                      onChange={(e) => setTranscript(e.target.checked)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100">Transcript</span>
                  </label>

                  <label className="flex items-center gap-3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={botShouldRespond}
                      onChange={(e) => setBotShouldRespond(e.target.checked)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <SparklesIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100">Bot should respond</span>
                  </label>
                </motion.div>
              )}

              {/* Aurray Bot Personality Context - Only visible if "Bot should respond" is checked and not using calendar */}
              {!hasMeetingOnCalendar && botShouldRespond && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <SparklesIcon className="w-4 h-4 inline mr-1" />
                    Aurray Bot Personality Context <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal mr-2">
                      {" "}
                      (<a
                        href="/context-lab/create-meeting-context"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        Create a context → how your bot talk and behave
                      </a>)
                    </span>
                  </label>
                  <select
                    value={selectedContextId}
                    onChange={(e) => {
                      setSelectedContextId(e.target.value);
                      if (errors.contextId) {
                        setErrors({ ...errors, contextId: undefined });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all ${
                      errors.contextId
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-transparent'
                    }`}
                    disabled={contextsLoading}
                  >
                    <option value="">Select a context...</option>
                    {contexts.map((context) => (
                      <option key={context.id} value={context.id}>
                        {context.name}
                      </option>
                    ))}
                  </select>
                  {contextsLoading && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Loading contexts...</p>
                  )}
                  {errors.contextId && (
                    <p className="mt-1 text-sm text-red-500">{errors.contextId}</p>
                  )}
                </motion.div>
              )}

              {/* Join Meeting Now Checkbox and Scheduling - Only visible when not using calendar */}
              {!hasMeetingOnCalendar && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={joinNow}
                        onChange={(e) => setJoinNow(e.target.checked)}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        Join Meeting now
                      </span>
                    </label>
                  </div>

                  {/* Date/Time Picker and Duration - Show when joinNow is false */}
                  {!joinNow && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl border border-primary-200 dark:border-primary-700 space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Start Date & Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={startTime}
                          onChange={(e) => {
                            setStartTime(e.target.value);
                            if (errors.startTime) {
                              setErrors({ ...errors, startTime: undefined });
                            }
                          }}
                          min={new Date().toISOString().slice(0, 16)}
                          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all ${
                            errors.startTime
                              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-transparent'
                          }`}
                        />
                        {errors.startTime && (
                          <p className="mt-1 text-sm text-red-500">{errors.startTime}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Duration
                        </label>
                        <select
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        >
                          <option value={15}>15 min</option>
                          <option value={30}>30 min</option>
                          <option value={45}>45 min</option>
                          <option value={60}>1 hour</option>
                          <option value={90}>1.5 hours</option>
                          <option value={120}>2 hours</option>
                          <option value={180}>3 hours</option>
                          <option value={240}>4 hours</option>
                        </select>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Meeting will end {duration >= 60 ? `${Math.floor(duration / 60)} hour${Math.floor(duration / 60) > 1 ? 's' : ''}${duration % 60 > 0 ? ` ${duration % 60} min` : ''}` : `${duration} minutes`} after start time
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                {!hasMeetingOnCalendar && (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || loading}
                    className="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {joinNow ? 'Sending...' : 'Scheduling...'}
                      </>
                    ) : (
                      joinNow ? 'Send Bot to Meeting' : 'Schedule Meeting'
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SendAurrayBotModal;

