import React, { useState, useEffect, useRef, useCallback } from 'react';
import { callClient, CallMessage, CallStatus } from '@/lib/callClient';
import { 
  MicrophoneIcon, 
  PhoneIcon, 
  SpeakerWaveIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  ComputerDesktopIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  ShareIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { 
  MicrophoneIcon as MicrophoneIconSolid, 
  PhoneIcon as PhoneIconSolid,
  VideoCameraIcon as VideoCameraIconSolid
} from '@heroicons/react/24/solid';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { Conversation } from '@/types';
import InviteModal from './InviteModal';
import ParticipantList from './ParticipantList';

interface CallInterfaceProps {
  onCallStart?: (conversationId: string) => void;
  onCallEnd?: (conversationId: string) => void;
  existingConversation?: Conversation | null;
  loadingConversation?: boolean;
}

interface ActionStatus {
  id: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message: string;
  timestamp: Date;
}

const CallInterface: React.FC<CallInterfaceProps> = ({ onCallStart, onCallEnd, existingConversation, loadingConversation }) => {
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [status, setStatus] = useState<CallStatus>(callClient.currentStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [actionStatuses, setActionStatuses] = useState<ActionStatus[]>([]);
  
  const [lastSentMessage, setLastSentMessage] = useState<{text: string, timestamp: number} | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [audioQueue, setAudioQueue] = useState<ArrayBuffer[]>([]);
  const [isVoiceMode, setIsVoiceMode] = useState(true); // Pure voice mode vs hybrid mode
  
  // Meeting room specific state
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([
    { id: 'user-1', name: 'You', isVideoEnabled: false, isMuted: true, isSpeaking: false, isHost: true, joinedAt: new Date() },
    { id: 'ai-assistant', name: 'AI Assistant', isVideoEnabled: false, isMuted: true, isSpeaking: false, isHost: false, joinedAt: new Date() }
  ]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showParticipantList, setShowParticipantList] = useState(false);
  const [meetingId, setMeetingId] = useState<string>('');
  const [meetingUrl, setMeetingUrl] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // VideoTile Component
  const VideoTile: React.FC<{ participant: typeof participants[0] }> = ({ participant }) => (
    <div className={`relative bg-gray-800 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
      participant.isSpeaking ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-600'
    }`}>
      {/* Video or Avatar Placeholder */}
      <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
        {participant.isVideoEnabled ? (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <VideoCameraIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </div>
        ) : (
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm sm:text-lg">
              {participant.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        )}
      </div>
      
      {/* Participant Info */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-1 sm:p-2">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium truncate">{participant.name}</span>
          <div className="flex items-center space-x-1">
            {participant.isMuted && (
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full flex items-center justify-center">
                <MicrophoneIcon className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
              </div>
            )}
            {!participant.isVideoEnabled && (
              <VideoCameraSlashIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>
      
      {/* Speaking Indicator */}
      {participant.isSpeaking && (
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
  
  // Use the audio recording hook for both speech-to-text and audio streaming
  const {
    isRecording,
    isSpeaking,
    audioLevel,
    error: audioError,
    toggleRecording,
    stopRecording,
    requestMicrophonePermission,
  } = useAudioRecording({
    onTranscript: async (transcript: string) => {
      // Stop any currently playing audio when user speaks
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        audioRef.current.src = '';
        setIsPlayingTTS(false);
        setAudioQueue([]);
      }
      
      const now = Date.now();
      const timeSinceLastMessage = lastSentMessage ? now - lastSentMessage.timestamp : Infinity;
      
      // Prevent duplicate messages within 2 seconds
      if (lastSentMessage && 
          lastSentMessage.text === transcript && 
          timeSinceLastMessage < 2000) {
        return;
      }
      
      // Send speech text directly to backend as USER_SPEECH turn
      try {
        await callClient.sendMessage(transcript);
        
        // Update last sent message
        setLastSentMessage({ text: transcript, timestamp: now });
      } catch (error) {
        console.error('Failed to send speech text to backend:', error);
      }
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when connected
  useEffect(() => {
    if (status.isConnected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status.isConnected]);

  // Setup event listeners
  useEffect(() => {
    const unsubscribeMessage = callClient.onMessage((message: CallMessage) => {
      setMessages(prev => [...prev, message]);
      parseActionFromMessage(message);
      
      // Handle TTS audio playback with queue management
      if (message.type === 'tts_audio' && message.audioData) {
        setAudioQueue(prev => [...prev, message.audioData!]);
      }
    });

    const unsubscribeStatus = callClient.onStatusChange((newStatus: CallStatus) => {
      setStatus(newStatus);
      
      // Stop recording if disconnected
      if (!newStatus.isConnected && isRecording) {
        stopRecording();
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeStatus();
    };
  }, [isRecording, stopRecording]);

  // Show audio error if any
  useEffect(() => {
    if (audioError) {
      alert(audioError);
    }
  }, [audioError]);

  // Audio queue management
  const playNextAudio = useCallback(async () => {
    if (audioQueue.length === 0 || !audioRef.current || isPlayingTTS) {
      return;
    }

    setIsPlayingTTS(true);
    const audioData = audioQueue[0];
    
    try {
      const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current.src = audioUrl;
      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsPlayingTTS(false);
        // Remove played audio from queue
        setAudioQueue(prev => prev.slice(1));
      };
      
      await audioRef.current.play();
    } catch (error) {
      console.error('Failed to play TTS audio:', error);
      setIsPlayingTTS(false);
      // Remove failed audio from queue
      setAudioQueue(prev => prev.slice(1));
    }
  }, [audioQueue, isPlayingTTS]);

  // Auto-play next audio when queue changes
  useEffect(() => {
    if (audioQueue.length > 0 && !isPlayingTTS) {
      playNextAudio();
    }
  }, [audioQueue.length, isPlayingTTS, playNextAudio]);

  // Cleanup effects
  useEffect(() => {
    return () => {
      // Stop any playing audio and clean up
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setIsPlayingTTS(false);
      setAudioQueue([]);
    };
  }, []);

  // Sync speaking detection with participants
  useEffect(() => {
    setParticipants(prev => prev.map(p => 
      p.id === 'user-1' ? { ...p, isSpeaking, isMuted: !isRecording } : p
    ));
  }, [isSpeaking, isRecording]);

  // Auto-start recording when call becomes active
  useEffect(() => {
    if (status.isCallActive && !isRecording && !audioError) {
      toggleRecording();
    }
  }, [status.isCallActive, isRecording, audioError, toggleRecording]);

  // Sync AI speaking state when TTS is playing
  useEffect(() => {
    setParticipants(prev => prev.map(p => {
      if (p.id === 'ai-assistant') {
        return { ...p, isSpeaking: isPlayingTTS };
      }
      return p;
    }));
  }, [isPlayingTTS]);

  // Handle existing conversation and meeting initialization
  useEffect(() => {
    if (existingConversation && !loadingConversation) {
      console.log('Loading existing conversation:', existingConversation);
      // You can add logic here to load conversation history, set up the call state, etc.
      // For now, we'll just log it and potentially set up the conversation context
    }
  }, [existingConversation, loadingConversation]);

  // Initialize meeting when call starts
  useEffect(() => {
    if (status.conversationId && !meetingId) {
      const newMeetingId = `meeting-${status.conversationId}`;
      setMeetingId(newMeetingId);
      setMeetingUrl(`${window.location.origin}/join/${newMeetingId}`);
      
      // Update URL to include meeting parameters for the host
      const url = new URL(window.location.href);
      url.searchParams.set('meetingId', newMeetingId);
      url.searchParams.set('participantId', 'host-1');
      url.searchParams.set('name', 'Meeting Host');
      url.searchParams.set('isHost', 'true');
      window.history.replaceState({}, '', url.toString());
      
      // Load participants from database
      loadMeetingParticipants(newMeetingId);
    }
  }, [status.conversationId, meetingId]);

  // Load participants from database
  const loadMeetingParticipants = async (meetingId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/meetings/${meetingId}/participants`);
      if (response.ok) {
        const data = await response.json();
        if (data.participants && data.participants.length > 0) {
          setParticipants(data.participants);
        }
      }
    } catch (error) {
      console.error('Failed to load meeting participants:', error);
    }
  };

  // Handle participant joining from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const participantId = urlParams.get('participantId');
    const participantName = urlParams.get('name');
    const joined = urlParams.get('joined');
    const urlMeetingId = urlParams.get('meetingId');
    
    if (participantId && participantName && joined === 'true' && urlMeetingId) {
      console.log('Participant joining existing meeting:', {
        participantId,
        participantName,
        meetingId: urlMeetingId
      });
      
      // Set the meeting ID from URL if not already set
      if (!meetingId) {
        setMeetingId(urlMeetingId);
        setMeetingUrl(`${window.location.origin}/join/${urlMeetingId}`);
      }
      
      // Add the participant to the participants list
      const newParticipant = {
        id: participantId,
        name: decodeURIComponent(participantName),
        isVideoEnabled: false, // Default to muted
        isMuted: true, // Default to muted
        isSpeaking: false,
        isHost: false,
        joinedAt: new Date()
      };
      
      setParticipants(prev => {
        // Check if participant already exists
        const exists = prev.find(p => p.id === participantId);
        if (!exists) {
          console.log('Adding new participant to meeting:', newParticipant);
          
          // Broadcast participant joined event via WebSocket
          if (status.isConnected) {
            callClient.sendMessage(JSON.stringify({
              type: 'participant_joined',
              participant: newParticipant
            }));
          }
          
          return [...prev, newParticipant];
        }
        return prev;
      });
      
      // If this is a participant joining an existing meeting, join the existing call
      if (!status.isCallActive && !status.isConnected) {
        console.log('Auto-joining call for participant joining existing meeting');
        setTimeout(async () => {
          try {
            // For now, we'll start a new call since we don't have a way to map meeting ID to conversation ID
            // TODO: Implement meeting ID to conversation ID mapping
            await startCall();
          } catch (error) {
            console.error('Failed to join existing meeting:', error);
          }
        }, 1000);
      }
    }
  }, [meetingId, status.isCallActive, status.isConnected]);

  // WebSocket event handlers for real-time participant updates
  useEffect(() => {
    const handleMessage = (message: any) => {
      try {
        const parsedMessage = JSON.parse(message.content);
        
        if (parsedMessage.type === 'participant_joined') {
          console.log('Participant joined event:', parsedMessage);
          const { participant } = parsedMessage.data;
          
          setParticipants(prev => {
            const exists = prev.find(p => p.id === participant.id);
            if (!exists) {
              return [...prev, {
                ...participant,
                isVideoEnabled: false,
                isMuted: true,
                isSpeaking: false,
                joinedAt: new Date().toISOString()
              }];
            }
            return prev;
          });
        } else if (parsedMessage.type === 'participant_left') {
          console.log('Participant left event:', parsedMessage);
          const { participantId } = parsedMessage.data;
          
          setParticipants(prev => prev.filter(p => p.id !== participantId));
        } else if (parsedMessage.type === 'participant_updated') {
          console.log('Participant update event:', parsedMessage);
          const { participantId, updates } = parsedMessage.data;
          
          setParticipants(prev => prev.map(p => 
            p.id === participantId ? { ...p, ...updates } : p
          ));
        }
      } catch (error) {
        // Not a participant event, ignore
      }
    };

    // Register WebSocket event listener
    const unsubscribe = callClient.onMessage(handleMessage);

    return () => {
      unsubscribe();
    };
  }, []);

  // Add action status update
  const addActionStatus = (action: ActionStatus) => {
    setActionStatuses(prev => [...prev, action]);
    
    // Auto-remove completed/failed actions after 5 seconds
    setTimeout(() => {
      setActionStatuses(prev => prev.filter(a => a.id !== action.id));
    }, 5000);
  };

  // Parse AI responses for action indicators
  const parseActionFromMessage = (message: CallMessage) => {
    if (message.type === 'ai_response') {
      const content = message.content.toLowerCase();
      
      // Check for action indicators
      if (content.includes('scheduling') || content.includes('calendar')) {
        addActionStatus({
          id: `action-${Date.now()}`,
          type: 'calendar',
          status: 'in_progress',
          message: 'Scheduling your meeting...',
          timestamp: new Date()
        });
      } else if (content.includes('slack') || content.includes('message')) {
        addActionStatus({
          id: `action-${Date.now()}`,
          type: 'slack',
          status: 'in_progress',
          message: 'Sending Slack message...',
          timestamp: new Date()
        });
      } else if (content.includes('searching') || content.includes('looking up')) {
        addActionStatus({
          id: `action-${Date.now()}`,
          type: 'search',
          status: 'in_progress',
          message: 'Searching knowledge base...',
          timestamp: new Date()
        });
      }
    }
  };

  const startCall = async () => {
    try {
      setIsLoading(true);
      const conversationId = await callClient.startCall();
      console.log('Call started with conversation ID:', conversationId);
      
      // Notify parent component about call start
      if (onCallStart) {
        onCallStart(conversationId);
      }
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Failed to start call. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current user is the meeting host
  const isHost = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isHostParam = urlParams.get('isHost');
    return isHostParam === 'true' || participants.find(p => p.id === 'user-1')?.isHost;
  };

  const endCall = async () => {
    // Only host can end the meeting
    if (!isHost()) {
      console.warn('Only the meeting host can end the meeting');
      return;
    }

    try {
      await callClient.endCall();
      if (status.conversationId && onCallEnd) {
        onCallEnd(status.conversationId);
      }
      setMessages([]);
      
      // Clear query parameters from URL
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
      
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const leaveMeeting = async () => {
    try {
      // Remove current participant from the participants list
      setParticipants(prev => prev.filter(p => p.id !== 'user-1'));
      
      // Broadcast participant left event
      if (status.isConnected) {
        callClient.sendMessage(JSON.stringify({
          type: 'participant_left',
          participantId: 'user-1'
        }));
      }
      
      // End the call for this participant
      await callClient.endCall();
      
      // Clear query parameters from URL
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
      
      // Close the window/tab
      window.close();
      
    } catch (error) {
      console.error('Failed to leave meeting:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !status.isConnected) return;

    // Stop any currently playing audio when user sends a new message
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setIsPlayingTTS(false);
      setAudioQueue([]);
    }

    try {
      await callClient.sendMessage(inputMessage);
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Meeting control functions
  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    setParticipants(prev => prev.map(p => 
      p.id === 'user-1' ? { ...p, isVideoEnabled: !isVideoEnabled } : p
    ));
    
    // Broadcast participant update via WebSocket
    if (status.isConnected) {
      callClient.sendMessage(JSON.stringify({
        type: 'participant_update',
        participantId: 'user-1',
        updates: { isVideoEnabled: !isVideoEnabled }
      }));
    }
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    // TODO: Implement actual screen sharing
  };

  const toggleMute = () => {
    if (isRecording) {
      stopRecording();
    } else {
      toggleRecording();
    }
    
    // Broadcast participant update via WebSocket
    if (status.isConnected) {
      callClient.sendMessage(JSON.stringify({
        type: 'participant_update',
        participantId: 'user-1',
        updates: { isMuted: !isRecording }
      }));
    }
  };


  const getStatusColor = () => {
    switch (status.connectionState) {
      case 'connected': return 'text-green-600 dark:text-green-400';
      case 'connecting': return 'text-yellow-600 dark:text-yellow-400';
      case 'disconnected': return 'text-gray-600 dark:text-gray-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status.connectionState) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      {/* Main Meeting Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-800 border-b border-gray-700">
          <div className="mb-2 sm:mb-0">
            <h2 className="text-base sm:text-lg font-semibold text-white">AI Meeting Room</h2>
            <p className={`text-xs sm:text-sm ${getStatusColor()}`}>
              {loadingConversation ? 'Loading conversation...' : getStatusText()}
              {status.conversationId && (
                <span className="ml-1 sm:ml-2 text-gray-400">
                  (ID: {status.conversationId.slice(0, 8)}...)
                </span>
              )}
              {existingConversation && !loadingConversation && (
                <span className="ml-1 sm:ml-2 text-blue-400">
                  (Existing: {existingConversation.status})
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Invite Button */}
            {status.isCallActive && meetingId && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                title="Invite Participants"
              >
                <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            
            {/* Participants Button */}
            {status.isCallActive && (
              <button
                onClick={() => setShowParticipantList(true)}
                className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                title="View Participants"
              >
                <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            
            {/* Chat Toggle */}
            <button
              onClick={() => setShowChatSidebar(!showChatSidebar)}
              className={`p-2 rounded-lg transition-colors ${
                showChatSidebar 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Toggle Chat"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            {/* Call Controls */}
            {!status.isCallActive ? (
              <button
                onClick={startCall}
                disabled={isLoading}
                className="flex items-center space-x-1 sm:space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">{isLoading ? 'Starting...' : 'Start Meeting'}</span>
                <span className="xs:hidden">{isLoading ? 'Starting...' : 'Start'}</span>
              </button>
            ) : (
              isHost() ? (
                <button
                  onClick={endCall}
                  className="flex items-center space-x-1 sm:space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
                >
                  <PhoneIconSolid className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">End Meeting</span>
                  <span className="xs:hidden">End</span>
                </button>
              ) : (
                <button
                  onClick={leaveMeeting}
                  className="flex items-center space-x-1 sm:space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
                >
                  <PhoneIconSolid className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Leave Meeting</span>
                  <span className="xs:hidden">Leave</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-2 sm:p-4 min-h-0">
          {!status.isCallActive ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400 px-4">
                <VideoCameraIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-500" />
                <p className="text-lg sm:text-xl font-medium mb-2">Ready to start meeting</p>
                <p className="text-sm">Click "Start Meeting" to begin your AI meeting room</p>
              </div>
            </div>
          ) : (
            <div className={`grid gap-2 sm:gap-4 h-full ${
              participants.length === 1 ? 'grid-cols-1 max-w-xs sm:max-w-md mx-auto' :
              participants.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
              participants.length <= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2' :
              participants.length <= 9 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {participants.map((participant) => (
                <VideoTile key={participant.id} participant={participant} />
              ))}
            </div>
          )}
        </div>

        {/* Meeting Controls */}
        {status.isCallActive && (
          <div className="bg-gray-800 border-t border-gray-700">
            {/* Microphone Permission Button */}
            {audioError && (
              <div className="p-3 border-b border-gray-700">
                <button
                  onClick={async () => {
                    const granted = await requestMicrophonePermission();
                    if (granted) {
                      console.log('Microphone permission granted, you can now start recording');
                    }
                  }}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  Grant Microphone Permission
                </button>
              </div>
            )}
            
            {/* Control Buttons */}
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 p-3 sm:p-4">
              {/* Mute/Unmute */}
              <button
                onClick={toggleMute}
                className={`p-2 sm:p-3 rounded-full transition-all duration-200 ${
                  isRecording
                    ? isSpeaking
                      ? 'bg-red-500 text-white shadow-lg scale-110'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
                title={isRecording ? (isSpeaking ? 'Mute' : 'Unmute') : 'Unmute'}
              >
                {isRecording ? (
                  <MicrophoneIconSolid className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <MicrophoneIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>
              
              {/* Video Toggle */}
              <button
                onClick={toggleVideo}
                className={`p-2 sm:p-3 rounded-full transition-all duration-200 ${
                  isVideoEnabled
                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
                title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {isVideoEnabled ? (
                  <VideoCameraIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <VideoCameraSlashIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>
              
              {/* Screen Share */}
              <button
                onClick={toggleScreenShare}
                className={`p-2 sm:p-3 rounded-full transition-all duration-200 ${
                  isScreenSharing
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
              >
                <ComputerDesktopIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              {/* Voice Mode Toggle */}
              <button
                onClick={() => setIsVoiceMode(!isVoiceMode)}
                className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                  isVoiceMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
                title={isVoiceMode ? 'Voice mode (seamless audio)' : 'Hybrid mode (text + audio)'}
              >
                <span className="hidden sm:inline">{isVoiceMode ? '🎤 Voice' : '💬 Hybrid'}</span>
                <span className="sm:hidden">{isVoiceMode ? '🎤' : '💬'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Sidebar */}
      {showChatSidebar && (
        <div className="w-full sm:w-80 bg-gray-800 border-l border-gray-700 flex flex-col h-full lg:h-auto lg:max-h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-white">Chat</h3>
            <button
              onClick={() => setShowChatSidebar(false)}
              className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
            >
              <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-500" />
                  <p className="text-xs sm:text-sm">No messages yet</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user_speech' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-sm px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm ${
                        message.type === 'user_speech'
                          ? 'bg-blue-600 text-white'
                          : message.type === 'ai_response'
                          ? 'bg-gray-700 text-gray-100'
                          : message.type === 'audio_data'
                          ? 'bg-purple-600 text-white'
                          : message.type === 'tts_audio'
                          ? 'bg-green-600 text-white'
                          : 'bg-yellow-600 text-white'
                      }`}
                    >
                      <p className="text-xs">{message.content}</p>
                      {message.type === 'tts_audio' && (
                        <p className="text-xs opacity-70 mt-1">
                          🔊 {isPlayingTTS ? 'Playing...' : 'Ready'}
                        </p>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Action Status Indicators */}
                {actionStatuses.map((action) => (
                  <div key={action.id} className="flex justify-center">
                    <div className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center space-x-2 ${
                      action.status === 'completed' 
                        ? 'bg-green-600 text-white'
                        : action.status === 'failed'
                        ? 'bg-red-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        action.status === 'completed' 
                          ? 'bg-green-400'
                          : action.status === 'failed'
                          ? 'bg-red-400'
                          : 'bg-blue-400 animate-pulse'
                      }`} />
                      <span>{action.message}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Only show in hybrid mode */}
          {status.isConnected && !isVoiceMode && (
            <div className="border-t border-gray-700 p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-600 rounded-lg px-2 sm:px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400 text-sm"
                  disabled={!status.isConnected}
                />
                
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        meetingId={meetingId}
        meetingUrl={meetingUrl}
      />

      {/* Participant List Modal */}
      <ParticipantList
        isOpen={showParticipantList}
        onClose={() => setShowParticipantList(false)}
        participants={participants}
      />
    </div>
  );
};

export default CallInterface;
