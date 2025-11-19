import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, UserGroupIcon, SparklesIcon, MicrophoneIcon, VideoCameraIcon, DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useParticipantsStore } from '@/store';
import { useUIStore } from '@/store';
import { apiClient } from '@/lib/api';
import { MeetingContext } from '@/types';

interface MeetingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: {
    title: string;
    participants: string[];
    contextId: string | null;
    meetingDescription: string;
    audioRecord: boolean;
    screenRecord: boolean;
    transcript: boolean;
    startRightAway: boolean;
    startTime?: string;
    endTime?: string;
  }) => void;
  platformName: string;
  platformImage?: string;
}

const DEFAULT_PARTICIPANT = 'Aurray Bot';

const MeetingConfigModal: React.FC<MeetingConfigModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  platformName,
  platformImage,
}) => {
  const { theme } = useUIStore();
  const { participants: storedParticipants, addParticipant } = useParticipantsStore();
  const [title, setTitle] = useState<string>('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([DEFAULT_PARTICIPANT]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [contexts, setContexts] = useState<MeetingContext[]>([]);
  const [contextsLoading, setContextsLoading] = useState(false);
  const [selectedContextId, setSelectedContextId] = useState<string>('');
  const [meetingDescription, setMeetingDescription] = useState<string>('');
  const [audioRecord, setAudioRecord] = useState(false);
  const [screenRecord, setScreenRecord] = useState(false);
  const [transcript, setTranscript] = useState(true);
  const [startRightAway, setStartRightAway] = useState(true);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [errors, setErrors] = useState<{
    title?: string;
    participants?: string;
    contextId?: string;
  }>({});
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';
  const hasAurrayBot = selectedParticipants.includes(DEFAULT_PARTICIPANT);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Filter stored participants to only show emails (exclude "Aurray Bot" from persisted emails)
  const storedEmails = storedParticipants.filter(p => p !== DEFAULT_PARTICIPANT && emailRegex.test(p));

  // Filter participants based on search query - include "Aurray Bot" in search results
  const filteredParticipants = [
    // Include "Aurray Bot" if it matches search and isn't already selected
    ...(searchQuery.trim().toLowerCase() === '' || DEFAULT_PARTICIPANT.toLowerCase().includes(searchQuery.toLowerCase()) 
      ? (!selectedParticipants.includes(DEFAULT_PARTICIPANT) ? [DEFAULT_PARTICIPANT] : [])
      : []),
    // Include matching emails
    ...storedEmails.filter(p =>
      p.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedParticipants.includes(p)
    )
  ];

  // Check if search query is a valid email or "Aurray Bot"
  const trimmedQuery = searchQuery.trim();
  const isAurrayBot = trimmedQuery.toLowerCase() === DEFAULT_PARTICIPANT.toLowerCase();
  const isValidEmail = trimmedQuery && emailRegex.test(trimmedQuery.toLowerCase());
  const isNewEmail = isValidEmail && !storedEmails.includes(trimmedQuery.toLowerCase()) && !selectedParticipants.includes(trimmedQuery.toLowerCase());
  const canAddAurrayBot = isAurrayBot && !selectedParticipants.includes(DEFAULT_PARTICIPANT);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

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
      setTitle('');
      setSelectedParticipants([DEFAULT_PARTICIPANT]);
      setSearchQuery('');
      setSelectedContextId('');
      setMeetingDescription('');
      setAudioRecord(false);
      setScreenRecord(false);
      setTranscript(true);
      setStartRightAway(true);
      setStartTime('');
      setEndTime('');
      setShowDropdown(false);
      setErrors({});
    }
  }, [isOpen]);

  const handleAddParticipant = (email: string) => {
    if (email && !selectedParticipants.includes(email)) {
      setSelectedParticipants([...selectedParticipants, email]);
      setSearchQuery('');
      setShowDropdown(false);
      // Clear participants error if any
      if (errors.participants) {
        setErrors({ ...errors, participants: undefined });
      }
    }
  };

  const handleRemoveParticipant = (email: string) => {
    // Allow removing any participant including Aurray Bot from selected list
    // This only removes from selectedParticipants, not from persisted list
    setSelectedParticipants(selectedParticipants.filter(p => p !== email));
    // Clear participants error if any
    if (errors.participants) {
      setErrors({ ...errors, participants: undefined });
    }
  };

  const handleAddNewEmail = () => {
    const trimmedQuery = searchQuery.trim();
    const trimmedLower = trimmedQuery.toLowerCase();
    
    if (!trimmedQuery || selectedParticipants.includes(trimmedLower === DEFAULT_PARTICIPANT.toLowerCase() ? DEFAULT_PARTICIPANT : trimmedLower)) {
      return;
    }

    // Allow adding "Aurray Bot" (case-insensitive)
    if (trimmedLower === DEFAULT_PARTICIPANT.toLowerCase()) {
      handleAddParticipant(DEFAULT_PARTICIPANT);
      return;
    }

    // Validate and add email
    if (emailRegex.test(trimmedLower)) {
      // Add to persisted list if it's a new email
      if (!storedEmails.includes(trimmedLower)) {
        addParticipant(trimmedLower);
      }
      handleAddParticipant(trimmedLower);
    } else {
      alert('Please enter a valid email address or "Aurray Bot"');
    }
  };

  const handleSubmit = () => {
    // Reset errors
    const newErrors: {
      title?: string;
      participants?: string;
      contextId?: string;
    } = {};

    // Validate title
    if (!title || title.trim() === '') {
      newErrors.title = 'Title is required';
    }

    // Validate at least one participant
    if (selectedParticipants.length === 0) {
      newErrors.participants = 'At least one participant is required';
    }

    // Validate context if Aurray Bot is selected
    if (hasAurrayBot && !selectedContextId) {
      newErrors.contextId = 'Personality context is required when Aurray Bot is selected';
    }

    // If there are errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors and submit
    setErrors({});
    onSubmit({
      title: title.trim(),
      participants: selectedParticipants,
      contextId: selectedContextId || null,
      meetingDescription,
      audioRecord,
      screenRecord,
      transcript,
      startRightAway,
      startTime: startRightAway ? undefined : startTime,
      endTime: startRightAway ? undefined : endTime,
    });
  };

  // Set default times when modal opens or when startRightAway changes
  useEffect(() => {
    if (isOpen && !startRightAway && !startTime) {
      const now = new Date();
      const start = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration
      
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
      setEndTime(formatDateTime(end));
    }
  }, [isOpen, startRightAway, startTime]);

  if (typeof window === 'undefined') return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative z-[10000] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`relative ${isDark ? 'bg-[#161B22]' : 'bg-white'} backdrop-blur-lg border border-primary-500/20 rounded-2xl shadow-2xl overflow-hidden`}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-primary-500/20">
                <div className="flex items-center gap-3">
                {/* bg-gradient-to-br */}
                  <div className="w-10 h-10 rounded-xl  from-primary-500 to-accent-500 flex items-center justify-center overflow-hidden">
                    {platformImage ? (
                      <img 
                        src={platformImage} 
                        alt={platformName}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <UserGroupIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Schedule Meeting
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{platformName}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Title Field - First field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) {
                        setErrors({ ...errors, title: undefined });
                      }
                    }}
                    placeholder="Enter meeting title..."
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all ${
                      errors.title
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-transparent'
                    }`}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                  )}
                </div>

                {/* Participants Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Participants <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="flex flex-wrap gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 min-h-[48px]">
                      {selectedParticipants.map((participant) => (
                        <span
                          key={participant}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm"
                        >
                          {participant}
                          <button
                            onClick={() => handleRemoveParticipant(participant)}
                            className="ml-1 hover:text-primary-900 dark:hover:text-primary-100"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                      <div className="relative flex-1 min-w-[200px]">
                        <input
                          ref={inputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowDropdown(e.target.value.length > 0);
                          }}
                          placeholder="Search or add email..."
                          className="w-full bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                        />
                        {showDropdown && (filteredParticipants.length > 0 || isNewEmail || canAddAurrayBot) && (
                          <div
                            ref={dropdownRef}
                            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
                          >
                            {filteredParticipants.map((participant) => (
                              <button
                                key={participant}
                                onClick={() => handleAddParticipant(participant)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                              >
                                {participant}
                              </button>
                            ))}
                            {(isNewEmail || canAddAurrayBot) && (
                              <button
                                onClick={handleAddNewEmail}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2"
                              >
                                <PlusIcon className="w-4 h-4" />
                                Add "{searchQuery.trim()}"
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {errors.participants && (
                    <p className="mt-1 text-sm text-red-500">{errors.participants}</p>
                  )}
                </div>

                {/* Aurray Bot Personality Context - Only visible if Aurray Bot is selected */}
                {hasAurrayBot && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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

                {/* Purpose of the Meeting and Recording Options - Side by side on desktop, stacked on mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:items-stretch">
                  {/* Purpose of the Meeting */}
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Purpose of the Meeting
                    </label>
                    <textarea
                      value={meetingDescription}
                      onChange={(e) => setMeetingDescription(e.target.value)}
                      placeholder="Enter the purpose or description of this meeting..."
                      rows={3}
                      className="w-full flex-1 min-h-[200px] px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  {/* Recording Options */}
                  <div className="flex flex-col space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recording Options
                    </label>
                    
                    <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={audioRecord}
                        onChange={(e) => setAudioRecord(e.target.checked)}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <MicrophoneIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">Audio Record</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={screenRecord}
                        onChange={(e) => setScreenRecord(e.target.checked)}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <VideoCameraIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">Screen Record</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transcript}
                        onChange={(e) => setTranscript(e.target.checked)}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">Transcript</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-primary-500/20 space-y-4">
                {/* Start Meeting Right Away Checkbox */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={startRightAway}
                      onChange={(e) => setStartRightAway(e.target.checked)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      Start Meeting right away
                    </span>
                  </label>
                </div>

                {/* Date/Time Pickers - Show when startRightAway is false */}
                {!startRightAway && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl border border-primary-200 dark:border-primary-700"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        min={startTime || new Date().toISOString().slice(0, 16)}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg font-semibold text-white hover:from-primary-600 hover:to-accent-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Create Meeting
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default MeetingConfigModal;

