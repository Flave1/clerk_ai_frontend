import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  RectangleStackIcon,
  PhoneIcon,
  ComputerDesktopIcon,
  Cog6ToothIcon,
  FaceSmileIcon,
  PaperAirplaneIcon,
  Bars3Icon,
  WifiIcon,
  SpeakerWaveIcon,
  PauseCircleIcon,
  ArrowRightOnRectangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { PhoneIcon as PhoneSolidIcon, MicrophoneIcon as MicrophoneSolidIcon } from '@heroicons/react/24/solid';
import InviteModal from '@/components/call/InviteModal';
import ParticipantList from '@/components/call/ParticipantList';
import callClient, { CallMessage, CallStatus } from '@/lib/callClient';
import useAudioRecording from '@/hooks/useAudioRecording';
import axios, { API_ORIGIN } from '@/lib/axios';
import apiClient from '@/lib/api';

type SidebarPanel = 'chat' | 'participants' | 'actions' | null;

type ClassValue = string | Record<string, boolean> | null | undefined | false;

const cn = (...inputs: ClassValue[]): string => {
  const classes: string[] = [];
  inputs.forEach((input) => {
    if (!input) return;
    if (typeof input === 'string') {
      classes.push(input);
    } else {
      Object.entries(input).forEach(([key, value]) => {
        if (value) {
          classes.push(key);
        }
      });
    }
  });
  return classes.join(' ');
};

interface MeetingParticipant {
  id: string;
  name: string;
  isVideoEnabled: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  isHost?: boolean;
  joinedAt: Date;
}


const MeetingRoom: React.FC = () => {
  const router = useRouter();
  const {
    meetingId: meetingIdQuery,
    conversationId: conversationIdQuery,
    meetingUrl: meetingUrlQuery,
    isHost: isHostQuery,
    participantId: participantIdQuery,
    name: nameQuery,
  } = router.query;

  const localParticipantId = useMemo(
    () => (typeof participantIdQuery === 'string' ? participantIdQuery : 'local-user'),
    [participantIdQuery],
  );

  const localParticipantName = useMemo(
    () =>
      typeof nameQuery === 'string'
        ? decodeURIComponent(nameQuery)
        : 'You',
    [nameQuery],
  );

  const [status, setStatus] = useState<CallStatus>(callClient.status);
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([
    {
      id: localParticipantId,
      name: localParticipantName,
      isVideoEnabled: false,
      isMuted,
      isSpeaking: false,
      isHost: (typeof isHostQuery === 'string' ? isHostQuery === 'true' : true),
      joinedAt: new Date(),
    },
    {
      id: 'ai-assistant',
      name: 'AI Assistant',
      isVideoEnabled: false,
      isMuted: true,
      isSpeaking: false,
      isHost: false,
      joinedAt: new Date(),
    },
  ]);
  const [meetingId, setMeetingId] = useState<string>(
    typeof meetingIdQuery === 'string' ? meetingIdQuery : callClient.sessionId || '',
  );
  const [conversationId, setConversationId] = useState<string>(
    typeof conversationIdQuery === 'string' ? conversationIdQuery : '',
  );
  const [meetingUrl, setMeetingUrl] = useState<string>(
    typeof meetingUrlQuery === 'string'
      ? decodeURIComponent(meetingUrlQuery)
      : `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${meetingId}`,
  );

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [sidebarPanel, setSidebarPanel] = useState<SidebarPanel>('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [meetingStartTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [actionStatuses] = useState<any[]>([]); // Automation feed statuses

  const audioRef = useRef<HTMLAudioElement>(null);
  const manuallyMutedRef = useRef<boolean>(isMuted);
  // ChatGPT-like: Use Web Audio API for immediate playback (no queue, no WAV conversion)
  const audioOutputContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0); // Track next scheduled play time for seamless playback

  // Get backend URL and sessionId for WebSocket
  const BACKEND = useMemo(() => {
    const origin = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
    const protocol = origin.startsWith('https') ? 'wss:' : 'ws:';
    const host = origin.replace(/^https?:\/\//, '');
    return `${protocol}//${host}`;
  }, []);

  const sessionId = useMemo(() => {
    return meetingId || conversationId || callClient.sessionId || '';
  }, [meetingId, conversationId]);

  const [isWsReady, setIsWsReady] = useState(false);

  // Always use callClient's WebSocket - never create a duplicate connection
  // This ensures we use the same connection that callClient established
  const ws = useMemo(() => {
    // Only use callClient's WebSocket - no fallback to prevent duplicate connections
    // If callClient doesn't have a WebSocket yet, we'll wait for it (handled by isWsReady state)
    return callClient.ws;
  }, [callClient.ws]);

  // Load participants for this conversation from RT Gateway metadata
  useEffect(() => {
    const cid = conversationId || conversationIdQuery;
    if (!cid) return;

    let cancelled = false;

    const loadParticipants = async () => {
      try {
        const res = await axios.get(`/conversations/${cid}/metadata`);
        const metadata = res.data?.metadata || {};
        const backendParticipants = metadata.conversation_participants || metadata.participants;
        if (!Array.isArray(backendParticipants)) {
          return;
        }

        const mapped: MeetingParticipant[] = backendParticipants.map((p: any, index: number) => {
          const role = p.role as string | undefined;
    
          // Normalize IDs so UI logic (You / Assistant / Host) still works
          let id = typeof p.id === 'string' ? p.id : `participant-${index}`;
          if (role === 'user') {
            id = localParticipantId;
          } else if (role === 'context') {
            id = 'ai-assistant';
          }

          const name =
            typeof p.name === 'string' && p.name.trim().length > 0
              ? p.name
              : `Participant ${index + 1}`;

          return {
            id,
            name,
            isVideoEnabled: false,
            isMuted: role === 'context',
            isSpeaking: false,
            isHost: role === 'user' ? true : Boolean(p.isHost),
            joinedAt: new Date(),
          };
    });
    
        if (!cancelled && mapped.length > 0) {
          setParticipants(mapped);
        }
      } catch (error) {
        console.error('[MeetingRoom] Failed to load conversation metadata:', error);
      }
    };

    loadParticipants();
    
    return () => {
      cancelled = true;
    };
  }, [conversationId, conversationIdQuery, localParticipantId]);

  // Track WebSocket readiness for UI/controls
  useEffect(() => {
    if (!ws) {
      setIsWsReady(false);
      return;
    }

    const handleOpen = () => setIsWsReady(true);
    const handleClose = () => setIsWsReady(false);

    if (ws.readyState === WebSocket.OPEN) {
      setIsWsReady(true);
    }

    ws.addEventListener('open', handleOpen);
    ws.addEventListener('close', handleClose);

    return () => {
      ws.removeEventListener('open', handleOpen);
      ws.removeEventListener('close', handleClose);
    };
  }, [ws]);

  // Cleanup WebSocket on unmount (only if it's not callClient's WebSocket)
  useEffect(() => {
    return () => {
      if (ws && ws !== callClient.ws) {
        ws.close();
      }
    };
  }, [ws]);

  // Audio recording with integrated turn-taking and WebSocket
  const {
    listening: isRecording,
    speaking: isSpeaking,
    rms: audioLevel,
    start: startRecording,
    stop: stopRecording,
  } = useAudioRecording();
  
  const [audioError, setAudioError] = useState<string | null>(null);


  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - meetingStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [meetingStartTime]);

  // ChatGPT-like: Initialize Web Audio API for immediate playback
  const initAudioOutput = useCallback(() => {
    if (!audioOutputContextRef.current) {
      audioOutputContextRef.current = new AudioContext({ sampleRate: 16000 }); // Match backend: 16kHz PCM16
      // Don't try to resume here - browsers require user gesture for autoplay
      // It will be resumed when audio actually plays (in playAudioDelta)
    }
  }, []);

  // ChatGPT-like: Play audio delta immediately using Web Audio API (no WAV conversion, no queue)
  const playAudioDelta = useCallback(async (pcmData: ArrayBuffer) => {
    try {
      initAudioOutput();
      const audioContext = audioOutputContextRef.current;
      if (!audioContext) return;

      // Ensure AudioContext is running
      // Note: resume() may fail due to browser autoplay policy until user interacts
      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
        } catch (error) {
          // AudioContext will resume automatically on next user interaction
          // This is expected behavior due to browser autoplay policies
          return; // Skip playing this chunk - it will play once user interacts
        }
      }

      // Realtime API sends 16-bit PCM at 16kHz (matches backend config)
      // Convert to Float32Array for Web Audio API
      const pcm16 = new Int16Array(pcmData);
      const float32 = new Float32Array(pcm16.length);
      
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0; // Convert 16-bit PCM to float32 (-1 to 1)
      }

      // Create AudioBuffer at 16kHz to match backend audio format
      const audioBuffer = audioContext.createBuffer(1, float32.length, 16000);
      audioBuffer.copyToChannel(float32, 0);

      // Calculate duration of this chunk
      const duration = audioBuffer.duration;
      const currentTime = audioContext.currentTime;

      // ChatGPT-like: Schedule chunks to play sequentially without gaps
      // If this is the first chunk or enough time has passed, schedule immediately
      // Otherwise, schedule to play right after the previous chunk
      let scheduleTime = nextPlayTimeRef.current;
      if (scheduleTime < currentTime + 0.01) {
        // Play immediately if no previous chunk is scheduled
        scheduleTime = currentTime;
      }

      // Create source and schedule playback
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      // Schedule playback
      source.start(scheduleTime);
      
      // Update next play time for seamless sequential playback
      nextPlayTimeRef.current = scheduleTime + duration;
      
      // Cleanup after playback completes
      source.onended = () => {
        try {
          source.disconnect();
        } catch (e) {
          // Ignore cleanup errors
        }
      };
    } catch (error) {
      // Ignore playback errors (e.g., if context is closed)
      if (error instanceof Error && !error.message.includes('closed')) {
        console.error('Failed to play audio delta:', error);
      }
    }
  }, [initAudioOutput]);

  useEffect(() => {
    const unsubscribeMessage = callClient.onMessage((message) => {
      setMessages((prev) => {
        const newMessages = [...prev, message];
        return newMessages.slice(-100);
      });

      if (message.type === 'tts_audio' && message.audio) {
        // ChatGPT-like: Play audio delta immediately (no queue, no WAV conversion)
        // Realtime API sends raw 16-bit PCM, play it directly
        playAudioDelta(message.audio);
      }
    });

    callClient.onStatusChange((newStatus) => {
      setStatus(newStatus);

      // Stop recording when call is disconnected or not active
      if (!newStatus.isConnected || !newStatus.isCallActive || newStatus.connectionState !== 'connected') {
        void stopRecording();
      }
    });

    return () => {
      unsubscribeMessage();
      // Ensure audio recording is stopped when component unmounts
      void stopRecording();
    };
  }, [localParticipantId, stopRecording, playAudioDelta]);

  useEffect(() => {
    if (audioError) {
      // eslint-disable-next-line no-alert
      alert(audioError);
    }
  }, [audioError]);

  useEffect(() => {
    const resolvedMeetingId =
      typeof meetingIdQuery === 'string'
        ? meetingIdQuery
        : callClient.sessionId || '';
    const resolvedConversationId =
      typeof conversationIdQuery === 'string'
        ? conversationIdQuery
        : '';

    if (resolvedMeetingId) {
      setMeetingId(resolvedMeetingId);
    }
    if (resolvedConversationId) {
      setConversationId(resolvedConversationId);
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const resolvedMeetingUrl =
      typeof meetingUrlQuery === 'string'
        ? decodeURIComponent(meetingUrlQuery)
        : origin
        ? `${origin}/join/${resolvedMeetingId || resolvedConversationId}`
        : '';
    setMeetingUrl(resolvedMeetingUrl);
  }, [conversationIdQuery, meetingIdQuery, meetingUrlQuery]);

  useEffect(() => {
    if (!status.isCallActive) {
      const resolvedConversationId =
        typeof conversationIdQuery === 'string'
          ? conversationIdQuery
          : '';
      const resolvedMeetingId =
        typeof meetingIdQuery === 'string'
          ? meetingIdQuery
          : meetingId || '';

      if (resolvedConversationId && resolvedMeetingId) {
        callClient
          .joinCall(resolvedMeetingId)
          .then(() => {
          })
          .catch((error) => {
            console.error('Failed to join call from meeting room:', error);
          });
      }
    }
  }, [conversationIdQuery, meetingIdQuery, meetingId, status.isCallActive]);

  const addOrUpdateParticipant = useCallback(
    (participantId: string, updates: Partial<MeetingParticipant>) => {
      setParticipants((prev) => {
        const existing = prev.find((p) => p.id === participantId);
        if (existing) {
          return prev.map((p) =>
            p.id === participantId
              ? {
                  ...p,
                  ...updates,
                  joinedAt: updates.joinedAt
                    ? new Date(updates.joinedAt)
                    : p.joinedAt,
                }
              : p,
          );
        }
        return [
          ...prev,
          {
            id: participantId,
            name: updates.name || participantId,
            isVideoEnabled: updates.isVideoEnabled ?? false,
            isMuted: updates.isMuted ?? true,
            isSpeaking: updates.isSpeaking ?? false,
            isHost: updates.isHost ?? false,
            joinedAt: updates.joinedAt ? new Date(updates.joinedAt) : new Date(),
          },
        ];
      });
    },
    [],
  );

  useEffect(() => {
    // Initialize audio output context on mount (ChatGPT-like: Web Audio API for immediate playback)
    initAudioOutput();
    nextPlayTimeRef.current = 0; // Reset play time tracking
    
    return () => {
      // Cleanup Web Audio API
      if (audioOutputContextRef.current) {
        audioOutputContextRef.current.close().catch(() => {});
        audioOutputContextRef.current = null;
      }
      nextPlayTimeRef.current = 0;
      // Cleanup HTML audio element (if still used)
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [initAudioOutput]);

  useEffect(() => {
    manuallyMutedRef.current = isMuted;
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === localParticipantId
          ? {
              ...p,
              isSpeaking,
              isMuted,
            }
          : p,
      ),
    );
  }, [isSpeaking, isMuted, localParticipantId]);

  useEffect(() => {
    // Only start recording when call is active AND connected
    const canRecord = status.isCallActive && status.isConnected && status.connectionState === 'connected' && !audioError && !isMuted && ws && isWsReady;

    if (!status.isCallActive || !status.isConnected || status.connectionState !== 'connected' || audioError) {
      if (isRecording) {
        void stopRecording();
      }
      return;
    }

    if (isMuted) {
      if (isRecording) {
        void stopRecording();
      }
      return;
    }

    if (!isRecording && ws && isWsReady) {
      void startRecording();
    }
  }, [status.isCallActive, status.isConnected, status.connectionState, audioError, isMuted, isRecording, ws, isWsReady, startRecording, stopRecording]);

  // Cleanup when navigating away from the page
  useEffect(() => {
    const handleRouteChange = () => {
      void stopRecording();
    };

    router.events?.on('routeChangeStart', handleRouteChange);
    
    return () => {
      router.events?.off('routeChangeStart', handleRouteChange);
      // Also stop recording on unmount
      void stopRecording();
    };
  }, [router, stopRecording]);


  const connectionBadge = useMemo(() => {
    switch (status.connectionState) {
      case 'connected':
        return {
          label: 'Connected',
          className: 'text-emerald-400',
        };
      case 'connecting':
        return {
          label: 'Connecting...',
          className: 'text-yellow-400',
        };
      case 'disconnected':
        return {
          label: 'Disconnected',
          className: 'text-red-400',
        };
      default:
        return {
          label: 'Disconnected',
          className: 'text-gray-400',
        };
    }
  }, [status.connectionState]);

  const toggleMute = async () => {
    if (!status.isCallActive && !status.isConnected) return;
    
    // Resume AudioContext on user interaction (browser autoplay policy)
    if (audioOutputContextRef.current?.state === 'suspended') {
      try {
        await audioOutputContextRef.current.resume();
      } catch (error) {
        // Ignore - will resume on next interaction
      }
    }
    
    setIsMuted((prev) => !prev);
  };

  const controlsDisabled = !isWsReady;

  const toggleVideo = () => {
    setIsCameraOn((prev) => !prev);
    addOrUpdateParticipant(localParticipantId, { isVideoEnabled: !isCameraOn });

    if (status.isConnected) {
      callClient.sendMessage(
        JSON.stringify({
          type: 'participant_update',
          participantId: localParticipantId,
          updates: { isVideoEnabled: !isCameraOn },
        }),
      );
    }
  };

  const toggleScreenShare = () => {
    setIsScreenSharing((prev) => !prev);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !status.isConnected) {
      return;
    }
    try {
      await callClient.sendMessage(inputMessage);
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const endMeetingForAll = async () => {
    try {
      // Notify backend that bot left the meeting
      const meetingId = typeof meetingIdQuery === 'string' ? meetingIdQuery : null;
      const conversationId = typeof conversationIdQuery === 'string' ? conversationIdQuery : null;
      
      if (meetingId && conversationId) {
        try {
          await apiClient.botLeft(meetingId, conversationId, 'host_ended_meeting');
        } catch (botLeftError) {
          console.error('Failed to notify bot left:', botLeftError);
          // Continue with ending even if bot-left call fails
        }
      }

      // Stop recording before ending call
      void stopRecording();
      // Explicitly close WebSocket
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      await callClient.endCall();
      // Force a full page reload to ensure all audio/WebSocket resources are released
      if (typeof window !== 'undefined') {
        window.location.href = '/meetings';
      } else {
      router.push('/meetings');
      }
    } catch (error) {
      console.error('Failed to end meeting:', error);
      // Ensure recording is stopped even if endCall fails
      void stopRecording();
    }
  };

  const leaveMeeting = async () => {
    try {
      // Stop recording before leaving
      void stopRecording();
      
      // Notify backend that bot left the meeting
      const meetingId = typeof meetingIdQuery === 'string' ? meetingIdQuery : null;
      const conversationId = typeof conversationIdQuery === 'string' ? conversationIdQuery : null;
      
      if (meetingId && conversationId) {
        try {
          await apiClient.botLeft(meetingId, conversationId, 'user_left');
        } catch (botLeftError) {
          console.error('Failed to notify bot left:', botLeftError);
          // Continue with leaving even if bot-left call fails
        }
      }

      callClient.sendMessage(
        JSON.stringify({
          type: 'participant_left',
          participantId: localParticipantId,
        }),
      );
      // Explicitly close WebSocket
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      await callClient.endCall();
      // Force a full page reload to ensure all audio/WebSocket resources are released
      if (typeof window !== 'undefined') {
        window.location.href = '/meetings';
      } else {
      router.push('/meetings');
      }
    } catch (error) {
      console.error('Failed to leave meeting:', error);
    }
  };

  const isHost = useMemo(
    () => participants.find((p) => p.id === localParticipantId)?.isHost ?? false,
    [participants, localParticipantId],
  );

  const formattedDuration = useMemo(() => {
    const minutes = Math.floor(elapsedSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [elapsedSeconds]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-950 text-white">
      <audio ref={audioRef} className="hidden" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(99,102,241,0.18),_transparent_40%)]" />

      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2.5 backdrop-blur-lg sm:px-6 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-base sm:text-lg font-semibold text-white truncate">Meeting Room</h1>
              <span className={cn('text-[10px] sm:text-xs font-semibold uppercase tracking-wide flex-shrink-0', connectionBadge.className)}>
                {connectionBadge.label}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-slate-300">
              <span className="inline-flex items-center gap-1">
                <WifiIcon className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                <span className="hidden sm:inline">{meetingId || 'Session'}</span>
                <span className="sm:hidden">{(meetingId || 'Session').slice(0, 8)}...</span>
              </span>
              {conversationId && (
                <span className="hidden sm:inline-flex items-center gap-1">
                  <RectangleStackIcon className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                  {conversationId.slice(0, 8)}...
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                {formattedDuration}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-500/80 to-accent-500/80 px-3 py-1.5 text-xs sm:text-sm font-medium text-white transition hover:from-primary-500 hover:to-accent-500 shadow-lg shadow-primary-500/30"
          >
            <UserGroupIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden md:inline">Invite</span>
          </button>
          {isHost ? (
            <button
              onClick={endMeetingForAll}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-red-500 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-red-600 shadow-lg"
            >
              <PhoneSolidIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">End For All</span>
              <span className="sm:hidden">End</span>
            </button>
          ) : (
            <button
              onClick={leaveMeeting}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-orange-500 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-orange-600 shadow-lg"
            >
              <ArrowRightOnRectangleIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main className="flex flex-1 flex-col min-h-0 overflow-hidden">
          <section className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 pt-2 sm:px-6">
            <div
              className={cn(
                'grid h-full gap-4 rounded-3xl bg-black/20 p-3 backdrop-blur-lg sm:p-4',
                {
                  'grid-cols-1': participants.length <= 1,
                  'grid-cols-1 md:grid-cols-2': participants.length === 2,
                  'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': participants.length > 2 && participants.length <= 6,
                  'grid-cols-1 md:grid-cols-3 lg:grid-cols-4': participants.length > 6,
                },
              )}
            >
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className={cn(
                    'relative flex min-h-[200px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-3 transition sm:min-h-[240px] sm:p-4',
                    {
                      'ring-2 ring-primary-400/50 ring-offset-2 ring-offset-slate-950': participant.isSpeaking,
                    },
                  )}
                >
                  <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between rounded-xl bg-black/40 px-3 py-2 text-xs text-slate-200 backdrop-blur">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-semibold text-white shadow-lg">
                        {participant.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {participant.id === localParticipantId ? `${participant.name} (You)` : participant.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-slate-400">
                          {participant.isHost ? 'Host' : participant.id === 'ai-assistant' ? 'Assistant' : 'Participant'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-1">
                        {participant.isMuted ? (
                          <MicrophoneIcon className="h-4 w-4 text-red-400" />
                        ) : (
                          <MicrophoneSolidIcon className="h-4 w-4 text-accent-400" />
                        )}
                        {participant.isVideoEnabled ? (
                          <VideoCameraIcon className="h-4 w-4 text-primary-300" />
                        ) : (
                          <VideoCameraSlashIcon className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-20 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-black/20">
                    {participant.isSpeaking && (
                      <div className="speaking-sun-ball" />
                    )}
                    {participant.isVideoEnabled ? (
                      <div className="h-full w-full rounded-xl bg-slate-800" />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-center text-slate-500">
                        <VideoCameraSlashIcon className="h-10 w-10" />
                        <span className="text-xs uppercase tracking-wide text-slate-500">
                          Camera off
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer className="shrink-0 border-t border-white/10 bg-black/30 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <div className="hidden items-center gap-3 text-xs text-slate-300 sm:flex">
                <div className="flex items-center gap-2">
                  <span className="block h-2 w-2 rounded-full bg-accent-400 shadow-lg shadow-accent-400/50" />
                  {participants.length} participants
                </div>
                <div className={cn(
                  "flex items-center gap-2 transition-colors",
                  isSpeaking && "text-red-300"
                )}>
                  {/* {isSpeaking ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                      </span>
                      <span className="font-medium">Speaking</span>
                      <span className="text-xs opacity-75">({Math.round(audioLevel * 100)}%)</span>
                    </>
                  ) : (
                    <>
                      <span className="block h-2 w-2 rounded-full bg-primary-400 shadow-lg shadow-primary-400/50" />
                      <span className="text-xs">Audio: {Math.round(audioLevel * 100)}%</span>
                    </>
                  )} */}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {controlsDisabled && (
                  <div className="mr-2 flex items-center gap-2 text-xs text-slate-300">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
                    <span>Connecting audio...</span>
                  </div>
                )}
                <button
                  onClick={toggleMute}
                  disabled={controlsDisabled}
                  className={cn(
                    'relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full transition shadow-lg',
                    controlsDisabled && 'cursor-not-allowed opacity-60',
                    isMuted 
                      ? 'bg-white/10 text-white hover:bg-white/20' 
                      : isSpeaking
                        ? 'bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 animate-pulse'
                        : 'bg-gradient-to-br from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600',
                  )}
                  title={isMuted ? 'Unmute' : isSpeaking ? 'Speaking...' : 'Mute'}
                >
                  {isSpeaking && !isMuted && (
                    <span className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping" />
                  )}
                  {isMuted ? (
                    <MicrophoneIcon className="h-5 w-5 sm:h-6 sm:w-6 relative z-10" />
                  ) : (
                    <MicrophoneSolidIcon className={cn(
                      "h-5 w-5 sm:h-6 sm:w-6 relative z-10",
                      isSpeaking && "animate-pulse"
                    )} />
                  )}
                </button>

                <button
                  onClick={toggleVideo}
                  disabled={controlsDisabled}
                  className={cn(
                    'flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full transition',
                    controlsDisabled && 'cursor-not-allowed opacity-60',
                    isCameraOn
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-white text-slate-900 hover:bg-slate-200',
                  )}
                  title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isCameraOn ? (
                    <VideoCameraIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <VideoCameraSlashIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                </button>

                <button
                  onClick={toggleScreenShare}
                  disabled={controlsDisabled}
                  className={cn(
                    'hidden h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full transition sm:flex',
                    controlsDisabled && 'cursor-not-allowed opacity-60',
                    isScreenSharing
                      ? 'bg-sky-500 text-white hover:bg-sky-600'
                      : 'bg-white/10 text-white hover:bg-white/20',
                  )}
                  title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                >
                  <ComputerDesktopIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>

                <button
                  onClick={isHost ? endMeetingForAll : leaveMeeting}
                  disabled={controlsDisabled}
                  className={cn(
                    'flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full transition',
                    controlsDisabled && 'cursor-not-allowed opacity-60',
                    isHost ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600',
                  )}
                  title={isHost ? 'End meeting for all' : 'Leave meeting'}
                >
                  {isHost ? (
                    <PhoneSolidIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <PhoneIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarPanel((prev) => (prev === 'chat' ? null : 'chat'))}
                  disabled={controlsDisabled}
                  className={cn(
                    'flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition',
                    controlsDisabled && 'cursor-not-allowed opacity-60',
                    sidebarPanel === 'chat' ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20',
                  )}
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  Chat
                </button>
                <button
                  onClick={() => setSidebarPanel((prev) => (prev === 'participants' ? null : 'participants'))}
                  disabled={controlsDisabled}
                  className={cn(
                    'flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition',
                    controlsDisabled && 'cursor-not-allowed opacity-60',
                    sidebarPanel === 'participants'
                      ? 'bg-white text-slate-900'
                      : 'bg-white/10 text-white hover:bg-white/20',
                  )}
                >
                  <UserGroupIcon className="h-5 w-5" />
                  Participants
                </button>
                <button
                  onClick={() => setSidebarPanel((prev) => (prev === 'actions' ? null : 'actions'))}
                  disabled={controlsDisabled}
                  className={cn(
                    'hidden h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition sm:flex',
                    controlsDisabled && 'cursor-not-allowed opacity-60',
                    sidebarPanel === 'actions'
                      ? 'bg-white text-slate-900'
                      : 'bg-white/10 text-white hover:bg-white/20',
                  )}
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                  Actions
                </button>
              </div>
            </div>
          </footer>
        </main>

        {sidebarPanel && (
          <aside className="hidden w-96 flex-col border-l border-white/10 bg-black/50 p-5 backdrop-blur-lg md:flex">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {sidebarPanel === 'chat' && 'Meeting Chat'}
                {sidebarPanel === 'participants' && 'Participants'}
                {sidebarPanel === 'actions' && 'Live Actions'}
              </h2>
              <button
                onClick={() => setSidebarPanel(null)}
                className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              >
                <PauseCircleIcon className="h-5 w-5" />
              </button>
            </div>

            {sidebarPanel === 'chat' && (
              <div className="flex h-full flex-col gap-4">
                <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-black/30 p-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                      <ChatBubbleLeftRightIcon className="h-10 w-10 text-slate-600" />
                      <p className="mt-3 text-sm">No messages yet. Say something to get started.</p>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const timestamp = new Date();
                      let content = '';
                      if (message.type === 'transcript') {
                        content = message.text;
                      } else if (message.type === 'error') {
                        content = message.message;
                      } else if (message.type === 'tts_audio') {
                        content = `Audio: ${message.audio.byteLength} bytes`;
                      } else if (message.type === 'status') {
                        content = `Status: ${message.status.connectionState}`;
                      } else {
                        content = message.type;
                      }
                      
                      return (
                        <div
                          key={`${message.type}-${index}-${timestamp.getTime()}`}
                        className={cn('flex flex-col gap-2 rounded-xl p-3 text-sm', {
                            'bg-blue-500/20 text-blue-100': message.type === 'transcript',
                            'bg-white/10 text-white': message.type === 'status',
                          'bg-emerald-500/20 text-emerald-100': message.type === 'tts_audio',
                            'bg-red-500/20 text-red-100': message.type === 'error',
                        })}
                      >
                        <span className="text-xs uppercase tracking-wide text-slate-400">
                          {message.type.replace('_', ' ')}
                        </span>
                          <p className="leading-relaxed">{content}</p>
                        <span className="text-[10px] uppercase tracking-wide text-slate-500">
                            {timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      );
                    })
                  )}
                </div>
                  <div className="rounded-2xl bg-black/30 p-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(event) => setInputMessage(event.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-400/60"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                        Send
                      </button>
                    </div>
                  </div>
              </div>
            )}

            {sidebarPanel === 'participants' && (
              <div className="flex h-full flex-col gap-4">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>{participants.length} people in meeting</span>
                  <button
                    onClick={() => setShowParticipantModal(true)}
                    className="text-blue-300 transition hover:text-blue-200"
                  >
                    Open list
                  </button>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-black/30 p-4">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold">
                          {participant.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">
                              {participant.id === localParticipantId ? `${participant.name} (You)` : participant.name}
                            </span>
                            {participant.isHost && (
                              <span className="rounded-full bg-blue-500/30 px-2 py-0.5 text-xs uppercase tracking-wide text-blue-200">
                                Host
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            Joined {participant.joinedAt.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        {participant.isSpeaking && <FaceSmileIcon className="h-5 w-5 text-emerald-300" />}
                        {participant.isMuted ? (
                          <MicrophoneIcon className="h-4 w-4 text-red-400" />
                        ) : (
                          <MicrophoneSolidIcon className="h-4 w-4 text-emerald-300" />
                        )}
                        {participant.isVideoEnabled ? (
                          <VideoCameraIcon className="h-4 w-4 text-emerald-300" />
                        ) : (
                          <VideoCameraSlashIcon className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sidebarPanel === 'actions' && (
              <div className="flex h-full flex-col gap-4">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Automation feed</span>
                  <span>{actionStatuses.length} active</span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-black/30 p-4">
                  {actionStatuses.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                      <Cog6ToothIcon className="h-10 w-10 text-slate-600" />
                      <p className="mt-3 text-sm">No active automations. The assistant will show progress here.</p>
                    </div>
                  ) : (
                    actionStatuses.map((action) => (
                      <div
                        key={action.id}
                        className={cn(
                          'flex flex-col gap-2 rounded-xl border border-white/10 p-3 text-sm',
                          {
                            'bg-emerald-500/10 text-emerald-100': action.status === 'completed',
                            'bg-red-500/10 text-red-100': action.status === 'failed',
                            'bg-blue-500/10 text-blue-100': action.status === 'in_progress',
                          },
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase tracking-wide text-slate-400">{action.type}</span>
                          <span className="text-[10px] uppercase tracking-wide text-slate-500">
                            {action.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="leading-relaxed text-white/90">{action.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        meetingId={meetingId}
        meetingUrl={meetingUrl}
      />
      <ParticipantList
        isOpen={showParticipantModal}
        onClose={() => setShowParticipantModal(false)}
        participants={participants}
      />
    </div>
  );
};

export default MeetingRoom;

