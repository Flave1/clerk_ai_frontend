import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, VideoCameraIcon, MicrophoneIcon, SparklesIcon, CheckCircleIcon, ArrowRightIcon, ArrowLeftIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import axiosInstance, { API_PREFIX } from '@/lib/axios';
import { AurrayIcon } from './Logo';
import { useMeetingAutomationWebSocket } from '@/hooks/useMeetingAutomationWebSocket';
import toast from 'react-hot-toast';

interface DemoMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Platform = 'zoom' | 'google_meet' | 'teams' | null;
type Step = 'welcome' | 'platform' | 'email' | 'meeting';

const DemoMeetingModal: React.FC<DemoMeetingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
  const [showPlatformPrompt, setShowPlatformPrompt] = useState(false);
  const [pendingPlatform, setPendingPlatform] = useState<Platform>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const totalSteps = 3; // welcome, platform, email (meeting is step 4 but shown differently)
  
  // WebSocket connection for real-time status updates
  const { messages, isConnected, connectionError, currentStage } = useMeetingAutomationWebSocket(
    meetingId,
    currentStep === 'meeting' && meetingId !== null
  );

  // Transform raw messages into personalized, friendly versions
  const personalizeMessage = (msg: { stage?: string; message?: string; metadata?: Record<string, any> }): string => {
    const stage = msg.stage?.toLowerCase();
    const originalMessage = msg.message?.toLowerCase() || '';

    // Personalized message transformations - making them friendly and conversational
    switch (stage) {
      case 'initializing':
        return "Hey there! I'm getting everything set up for our meeting...";
      
      case 'browser_launched':
        return "All set! I'm opening the meeting room now...";
      
      case 'navigating':
        return "On my way to the meeting! Just a sec...";
      
      case 'joining_meeting':
        return "Joining the call now... almost there!";
      
      case 'in_meeting':
        return "I've joined the meeting! Just waiting for you to join me...";
      
      case 'waiting_to_admit':
        // Check the message content to differentiate between "waiting to admit" and "I have admitted"
        if (originalMessage.includes('i have admitted') || originalMessage.includes('have admitted')) {
          return "Great! I've let you into the meeting. See you in there!";
        }
        return "I'll admit you into the meeting as soon as I see you!";
      
      case 'waiting_for_host':
        return "I'm waiting for the host to let me in... shouldn't take long!";
      
      case 'cleaning_up':
        return "Wrapping things up... thanks for meeting with me!";
      
      case 'error':
        const errorMsg = msg.message || 'Something went wrong';
        // ${errorMsg.replace(/^error:\s*/i, '')}
        if (errorMsg.toLowerCase().includes('error:')) {
          return `Oops, something went wrong: Our technical team have been notified and will be looking into it shortly.`;
        }
        return `Hmm, I ran into an issue: ${errorMsg}`;
      
      default:
        // If message is already personalized or we don't have a transformation, use it as-is
        if (msg.message) {
          return msg.message;
        }
        return "Getting things ready...";
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('welcome');
      setSelectedPlatform(null);
      setEmail('');
      setName('');
      setError(null);
      setMeetingId(null);
      setMeetingUrl(null);
      setShowPlatformPrompt(false);
      setPendingPlatform(null);
    }
  }, [isOpen]);

  const getCurrentStepNumber = (): number => {
    switch (currentStep) {
      case 'welcome': return 1;
      case 'platform': return 2;
      case 'email': return 3;
      case 'meeting': return 4;
      default: return 1;
    }
  };

  const nextStep = () => {
    if (currentStep === 'welcome') {
      setCurrentStep('platform');
    } else if (currentStep === 'platform' && selectedPlatform) {
      setCurrentStep('email');
    }
  };

  const previousStep = () => {
    if (currentStep === 'email') {
      setCurrentStep('platform');
    } else if (currentStep === 'platform') {
      setCurrentStep('welcome');
    }
  };

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
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handlePlatformSelect = (platform: Platform) => {
    // Check if Teams or Zoom is selected - show polite prompt to use Google Meet
    if (platform === 'teams' || platform === 'zoom') {
      setPendingPlatform(platform);
      setShowPlatformPrompt(true);
      return;
    }
    
    // If Google Meet or other platform, proceed normally
    setSelectedPlatform(platform);
    setError(null);
    // Auto-advance to next step after a short delay
    setTimeout(() => {
      setCurrentStep('email');
    }, 300);
  };

  const handleUseGoogleMeet = () => {
    setSelectedPlatform('google_meet');
    setShowPlatformPrompt(false);
    setPendingPlatform(null);
    setError(null);
    setTimeout(() => {
      setCurrentStep('email');
    }, 300);
  };

  const handleContinueAnyway = () => {
    if (pendingPlatform) {
      setSelectedPlatform(pendingPlatform);
      setShowPlatformPrompt(false);
      setPendingPlatform(null);
      setError(null);
      setTimeout(() => {
        setCurrentStep('email');
      }, 300);
    }
  };

  const handleStartMeeting = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post(`/conversations/start-demo-meeting`,
        {
          platform: selectedPlatform,
          email: email.trim(),
          name: name.trim(),
        }
      );

      // Store meeting info and show meeting environment
      const data = response.data;
      setMeetingId(data.meeting_id || data.session_id);
      setMeetingUrl(data.meeting_url);
      setCurrentStep('meeting');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to start demo meeting';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndMeeting = async () => {
    if (!meetingId) {
      // If no meeting ID, just go back to welcome
      setCurrentStep('welcome');
      return;
    }

    setIsLoading(true);
    try {
      // Call the leave meeting endpoint
      await axiosInstance.post(`/meetings/${meetingId}/leave`);
      toast.success('Meeting ended successfully');
    } catch (err: any) {
      // Log error but continue with reset anyway
      console.error('Failed to end meeting:', err);
      toast.error(err?.response?.data?.detail || 'Failed to end meeting');
    } finally {
      setIsLoading(false);
      // Reset to welcome page
      setCurrentStep('welcome');
      setMeetingId(null);
      setMeetingUrl(null);
    }
  };

  if (typeof window === 'undefined') {
    return null;
  }

  const platforms = [
    {
      id: 'zoom' as Platform,
      name: 'Zoom',
      image: '/images/integrations/zoom.png',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      id: 'google_meet' as Platform,
      name: 'Google Meet',
      image: '/images/integrations/google_meet.png',
      gradient: 'from-green-500 to-green-600',
    },
    {
      id: 'teams' as Platform,
      name: 'Microsoft Teams',
      image: '/images/integrations/microsoft-teams.png',
      gradient: 'from-purple-500 to-purple-600',
    },
  ];

  // Animation variants for page transitions
  const pageVariants = {
    initial: {
      opacity: 0,
      x: 300,
      scale: 0.95
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1
    },
    exit: {
      opacity: 0,
      x: -300,
      scale: 0.95
    }
  };

  const pageTransition = {
    duration: 0.4,
    ease: [0.4, 0, 0.2, 1] as const
  };

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Platform Prompt Modal */}
          {showPlatformPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowPlatformPrompt(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="relative z-[10002] bg-white dark:bg-[#161B22] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-primary-500/20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-full flex items-center justify-center">
                    <SparklesIcon className="w-8 h-8 text-primary-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Try Google Meet for Demo
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    For the best demo experience, we recommend using Google Meet. It provides the smoothest demonstration of Aurray's capabilities.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPlatformPrompt(false)}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleContinueAnyway}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 font-medium"
                  >
                    Continue Anyway
                  </button>
                  <button
                    onClick={handleUseGoogleMeet}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold shadow-lg shadow-primary-500/50 hover:shadow-primary-500/70 transition-all duration-300"
                  >
                    Use Google Meet
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative z-[10000] w-[85vw] h-[85vh] max-w-4xl"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="relative bg-white dark:bg-[#161B22] backdrop-blur-lg border border-primary-500/20 dark:border-primary-500/20 rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col">
                {/* Progress Indicator */}
                {currentStep !== 'meeting' && (
                  <div className="px-8 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Step {getCurrentStepNumber()} of {totalSteps}
                        </span>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-300"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(getCurrentStepNumber() / totalSteps) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                      />
                    </div>
                  </div>
                )}

                {/* Content Area with Page Transitions */}
                <div className={`flex-1 ${currentStep === 'meeting' ? 'p-0' : 'p-8 overflow-y-auto'}`}>
                  <AnimatePresence mode="wait">
                    {currentStep === 'meeting' ? (
                      // Meeting Environment
                      <motion.div
                        key="meeting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
                      >
                        <div className="absolute inset-0 flex flex-col">
                          {/* Meeting Header Bar */}
                          <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-sm border-b border-white/10 p-4 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                                <VideoCameraIcon className="w-6 h-6 text-primary-400" />
                              </div>
                              <div>
                                <h4 className="text-white font-semibold">
                                  {platforms.find(p => p.id === selectedPlatform)?.name || 'Demo Meeting'}
                                </h4>
                                <p className="text-gray-400 text-sm">
                                  {currentStage === 'in_meeting' ? 'Ready for you!' :
                                   currentStage === 'waiting_for_host' ? 'Waiting to be let in' :
                                   currentStage === 'waiting_to_admit' ? 'Ready to admit you' :
                                   currentStage === 'cleaning_up' ? 'Thanks for meeting with me!' :
                                   currentStage === 'joining_meeting' ? 'Joining now...' :
                                   currentStage === 'browser_launched' ? 'Opening the room...' :
                                   'Getting ready...'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={onClose}
                              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-300"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Meeting Content Area */}
                          <div className="w-full flex-1 flex flex-col p-8 pt-20 pb-24">
                            {/* Meeting URL Section */}
                            {meetingUrl && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6"
                              >
                                <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                  <label className="text-xs uppercase tracking-wide text-gray-400 mb-2 block">
                                    Join Meeting URL
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      readOnly
                                      value={meetingUrl}
                                      className="flex-1 px-4 py-2 rounded-lg bg-black/30 text-white font-mono text-sm border border-white/10 focus:outline-none focus:border-primary-500"
                                    />
                                    <button
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(meetingUrl);
                                          toast.success('Meeting URL copied!');
                                        } catch {
                                          toast.error('Failed to copy');
                                        }
                                      }}
                                      className="p-2 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 transition-colors"
                                      title="Copy meeting URL"
                                    >
                                      <ClipboardIcon className="w-5 h-5" />
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-2">
                                    Copy this link to join the meeting
                                  </p>
                                </div>
                              </motion.div>
                            )}

                            {/* Status Section */}
                            <div className="flex-1 flex flex-col min-h-0">
                              <div className="text-center mb-4">
                                <h3 className="text-xl font-bold text-white mb-2">
                                  {currentStage === 'in_meeting' ? "I'm in the meeting!" : 
                                   currentStage === 'waiting_for_host' ? 'Waiting for the host to let me in...' :
                                   currentStage === 'waiting_to_admit' ? 'I\'ll let you in as soon as I see you!' :
                                   currentStage === 'cleaning_up' ? 'Wrapping things up...' :
                                   currentStage === 'joining_meeting' ? 'Just joining the call...' :
                                   currentStage === 'browser_launched' ? 'Opening the meeting room...' :
                                   'Getting everything ready...'}
                                </h3>
                                <div className="flex items-center justify-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                  <span className="text-sm text-gray-400">
                                    {isConnected ? 'Connected' : 'Connecting...'}
                                  </span>
                                </div>
                              </div>

                              {/* Status Messages Log */}
                              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                <div className="flex-1 overflow-y-auto bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10 max-h-[300px] min-h-[200px]">
                                  {messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                      <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                                          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                        <p className="text-sm">Waiting for status updates...</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {messages.map((msg, index) => (
                                        <motion.div
                                          key={index}
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          className="flex items-start gap-3 text-left p-2 rounded-lg hover:bg-white/5 transition-colors"
                                        >
                                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                            msg.stage === 'in_meeting' ? 'bg-green-500' :
                                            msg.stage === 'error' ? 'bg-red-500' :
                                            'bg-primary-500'
                                          }`}></div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              {msg.timestamp && (
                                                <span className="text-xs text-gray-500">
                                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-sm text-gray-300">
                                              {personalizeMessage(msg)}
                                            </p>
                                          </div>
                                        </motion.div>
                                      ))}
                                      <div ref={messagesEndRef} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Meeting Controls Bar */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm border-t border-white/10 p-4 flex items-center justify-center gap-4">
                            <div className="flex items-center gap-3">
                              <button className="p-3 rounded-full bg-red-500/20 hover:bg-red-500/30 text-white transition-all duration-300">
                                <VideoCameraIcon className="w-5 h-5" />
                              </button>
                              {/* <button className="p-3 rounded-full bg-gray-700/50 hover:bg-gray-600/50 text-white transition-all duration-300">
                                <MicrophoneIcon className="w-5 h-5" />
                              </button> */}
                              <button 
                                onClick={handleEndMeeting}
                                disabled={isLoading}
                                className="p-3 rounded-full bg-gray-700/50 hover:bg-gray-600/50 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : currentStep === 'welcome' ? (
                      // Welcome Screen
                      <motion.div
                        key="welcome"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                        className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                          className="mb-8"
                        >
                          <div className="w-24 h-24 mx-auto  from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/50">
                            <AurrayIcon isHovered={false} flipCount={0} />
                          </div>
                        </motion.div>
                        
                        <motion.h2
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent mb-4"
                        >
                          Welcome to Demo with Aurray
                        </motion.h2>
                        
                        <motion.p
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="text-xl text-gray-600 dark:text-gray-300 mb-8"
                        >
                         You've got to follow the 3 steps below to get started.
                        </motion.p>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="space-y-4 w-full max-w-md"
                        >
                          <div className="flex items-start gap-3 text-left p-4 bg-primary-500/10 dark:bg-primary-500/20 rounded-xl">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500/10 text-primary-500 font-bold flex-shrink-0 mt-0.5">
                              1
                            </span>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Choose Your Platform</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Zoom, Google Meet, or Microsoft Teams</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3 text-left p-4 bg-primary-500/10 dark:bg-primary-500/20 rounded-xl">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500/10 text-primary-500 font-bold flex-shrink-0 mt-0.5">
                              2
                            </span>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Aurray will invite you</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Aurray AI will instantly send you a meeting invite to join.</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3 text-left p-4 bg-primary-500/10 dark:bg-primary-500/20 rounded-xl">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500/10 text-primary-500 font-bold flex-shrink-0 mt-0.5">
                              3
                            </span>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">No Setup Required</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Aurray will let you into the meeting.
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                          className="mt-10"
                        >
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={nextStep}
                            className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold shadow-lg shadow-primary-500/50 hover:shadow-primary-500/70 transition-all duration-300 flex items-center gap-2"
                          >
                            Get Started
                            <ArrowRightIcon className="w-5 h-5" />
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    ) : currentStep === 'platform' ? (
                      // Platform Selection
                      <motion.div
                        key="platform"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                        className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-center mb-10"
                        >
                          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                            Choose Your Meeting Platform
                          </h2>
                          <p className="text-lg text-gray-600 dark:text-gray-400">
                            Select where you'd like to see Aurray in action
                          </p>
                        </motion.div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
                          {platforms.map((platform, index) => (
                            <motion.button
                              key={platform.id}
                              initial={{ opacity: 0, scale: 0.9, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                              whileHover={{ scale: 1.05, y: -5 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePlatformSelect(platform.id)}
                              className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center shadow ${
                                selectedPlatform === platform.id
                                  ? 'border-primary-500 bg-gradient-to-br from-primary-500/20 to-accent-500/20 shadow-primary-500/30 ring-2 ring-primary-500/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-500/50 bg-white dark:bg-gray-800 hover:shadow-lg'
                              }`}
                              style={{ minWidth: 0 }}
                            >
                              <motion.div
                                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                                transition={{ duration: 0.5 }}
                                className="mb-2 flex justify-center"
                              >
                                <Image
                                  src={platform.image}
                                  alt={platform.name}
                                  width={36}
                                  height={36}
                                  className="object-contain"
                                />
                              </motion.div>
                              <div className="font-semibold text-base text-gray-900 dark:text-white text-center">
                                {platform.name}
                              </div>
                              {selectedPlatform === platform.id && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="mt-2"
                                >
                                  <CheckCircleIcon className="w-5 h-5 text-primary-500" />
                                </motion.div>
                              )}
                            </motion.button>
                          ))}
                        </div>

                        <div className="flex w-full justify-center">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={previousStep}
                            className="px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 font-medium shadow-sm flex items-center gap-2"
                          >
                            <ArrowLeftIcon className="w-5 h-5 mr-1" />
                            Back
                          </motion.button>
                        </div>
                      </motion.div>
                    ) : currentStep === 'email' ? (
                      // Email Input
                      <motion.div
                        key="email"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={pageTransition}
                        className="flex flex-col items-center justify-center h-full max-w-md mx-auto"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-center mb-8"
                        >
                          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-full flex items-center justify-center p-3">
                            {selectedPlatform && (
                              <Image
                                src={platforms.find(p => p.id === selectedPlatform)?.image || ''}
                                alt={platforms.find(p => p.id === selectedPlatform)?.name || 'Platform'}
                                width={40}
                                height={40}
                                className="object-contain"
                              />
                            )}
                          </div>
                          {/* <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                            Almost There!
                          </h2> */}
                          <p className="text-lg text-gray-600 dark:text-gray-400">
                            Enter your name and email to start the meeting
                          </p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="w-full mb-6"
                        >
                          <label htmlFor="demo-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="demo-name"
                            value={name}
                            onChange={(e) => {
                              setName(e.target.value);
                              setError(null);
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !isLoading && name.trim() && email.trim()) {
                                handleStartMeeting();
                              }
                            }}
                            placeholder="Your name"
                            className="w-full mb-6 px-4 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 shadow-sm text-lg"
                            disabled={isLoading}
                            autoFocus
                            autoComplete="name"
                          />
                          <label htmlFor="demo-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="demo-email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              setError(null);
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !isLoading && name.trim() && email.trim()) {
                                handleStartMeeting();
                              }
                            }}
                            placeholder="your.email@example.com"
                            className="w-full px-4 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 shadow-sm text-lg"
                            disabled={isLoading}
                            autoComplete="email"
                          />
                          {error && (
                            <motion.p
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-2 text-sm text-red-500"
                            >
                              {error}
                            </motion.p>
                          )}
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="flex gap-4 w-full"
                        >
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={previousStep}
                            disabled={isLoading}
                            className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                          >
                            <ArrowLeftIcon className="w-5 h-5" />
                            Back
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleStartMeeting}
                            disabled={isLoading || !name.trim() || !email.trim()}
                            className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold shadow-lg shadow-primary-500/50 hover:shadow-primary-500/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isLoading ? (
                              <>
                                <svg
                                  className="animate-spin h-5 w-5 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Starting...
                              </>
                            ) : (
                              <>
                                Start Meeting
                                <ArrowRightIcon className="w-5 h-5" />
                              </>
                            )}
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  const portal = createPortal(modalContent, document.body);
  return portal;
};

export default DemoMeetingModal;

