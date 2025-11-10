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
import { callClient, CallMessage, CallStatus } from '@/lib/callClient';
import { useAudioRecording } from '@/hooks/useAudioRecording';
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

interface ActionStatus {
  id: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message: string;
  timestamp: Date;
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

  const [status, setStatus] = useState<CallStatus>(callClient.currentStatus);
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
    typeof meetingIdQuery === 'string' ? meetingIdQuery : callClient.currentSessionId || '',
  );
  const [conversationId, setConversationId] = useState<string>(
    typeof conversationIdQuery === 'string' ? conversationIdQuery : callClient.currentConversationId || '',
  );
  const [meetingUrl, setMeetingUrl] = useState<string>(
    typeof meetingUrlQuery === 'string'
      ? decodeURIComponent(meetingUrlQuery)
      : `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${meetingId}`,
  );

  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [sidebarPanel, setSidebarPanel] = useState<SidebarPanel>('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [actionStatuses, setActionStatuses] = useState<ActionStatus[]>([]);
  const [audioQueue, setAudioQueue] = useState<Array<{ data: ArrayBuffer; format: string }>>([]);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [meetingStartTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const manuallyMutedRef = useRef<boolean>(isMuted);
  const actionTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const {
    isRecording,
    isSpeaking,
    audioLevel,
    error: audioError,
    toggleRecording,
    stopRecording,
    requestMicrophonePermission,
  } = useAudioRecording({
    onAudioStream: async (audioChunk, format) => {
      if (manuallyMutedRef.current || !callClient.currentStatus.isCallActive) {
        return;
      }

      try {
        await callClient.sendAudioChunk(audioChunk, format);
      } catch (error) {
        console.error('Failed to send audio chunk:', error);
      }
    },
    onTranscript: async (transcript: string) => {
      if (manuallyMutedRef.current || !callClient.currentStatus.isCallActive) {
        return;
      }

      try {
        await callClient.sendMessage(transcript);
      } catch (error) {
        console.error('Failed to send transcript message:', error);
      }
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - meetingStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [meetingStartTime]);

  useEffect(() => {
    const unsubscribeMessage = callClient.onMessage((message) => {
      setMessages((prev) => [...prev, message]);
      parseActionFromMessage(message);

      if (message.type === 'tts_audio' && message.audioData) {
        setAudioQueue((prev) => [
          ...prev,
          {
            data: message.audioData!,
            format: message.audioFormat || 'audio/wav',
          },
        ]);
      }

      try {
        const parsed = JSON.parse(message.content);
        if (parsed.type === 'participant_joined') {
          const { participant } = parsed.data;
          addOrUpdateParticipant(participant.id, {
            ...participant,
            isVideoEnabled: participant.isVideoEnabled ?? false,
            isMuted: participant.id === localParticipantId ? manuallyMutedRef.current : true,
            isSpeaking: false,
            joinedAt: new Date(),
          });
        }
        if (parsed.type === 'participant_left') {
          const { participantId } = parsed.data;
          setParticipants((prev) => prev.filter((p) => p.id !== participantId));
        }
        if (parsed.type === 'participant_updated') {
          const { participantId, updates } = parsed.data;
          addOrUpdateParticipant(participantId, updates);
        }
      } catch {
        // not a participant event
      }
    });

    const unsubscribeStatus = callClient.onStatusChange((newStatus) => {
      setStatus(newStatus);

      if (!newStatus.isConnected) {
        stopRecording();
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeStatus();
    };
  }, [localParticipantId, stopRecording]);

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
        : callClient.currentSessionId || status.conversationId || '';
    const resolvedConversationId =
      typeof conversationIdQuery === 'string'
        ? conversationIdQuery
        : callClient.currentConversationId || status.conversationId || '';

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
  }, [conversationIdQuery, meetingIdQuery, meetingUrlQuery, status.conversationId]);

  useEffect(() => {
    if (!status.isCallActive) {
      const resolvedConversationId =
        typeof conversationIdQuery === 'string'
          ? conversationIdQuery
          : callClient.currentConversationId;

      if (resolvedConversationId) {
        callClient
          .joinCall(resolvedConversationId)
          .then(() => {
            console.log('Joined call in meeting room view');
          })
          .catch((error) => {
            console.error('Failed to join call from meeting room:', error);
          });
      }
    }
  }, [conversationIdQuery, status.isCallActive]);

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

  const playNextAudio = useCallback(async () => {
    if (audioQueue.length === 0 || !audioRef.current || isPlayingTTS) {
      return;
    }

    setIsPlayingTTS(true);
    const audioItem = audioQueue[0];

    try {
      const audioBlob = new Blob([audioItem.data], {
        type: audioItem.format || 'audio/wav',
      });
      const audioUrl = URL.createObjectURL(audioBlob);

      audioRef.current.src = audioUrl;
      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsPlayingTTS(false);
        setAudioQueue((prev) => prev.slice(1));
      };

      await audioRef.current.play();
    } catch (error) {
      console.error('Failed to play TTS audio:', error);
      setIsPlayingTTS(false);
      setAudioQueue((prev) => prev.slice(1));
    }
  }, [audioQueue, isPlayingTTS]);

  useEffect(() => {
    if (audioQueue.length > 0 && !isPlayingTTS) {
      void playNextAudio();
    }
  }, [audioQueue.length, isPlayingTTS, playNextAudio]);

  useEffect(() => {
    return () => {
      Object.values(actionTimeouts.current).forEach((timeout) => clearTimeout(timeout));
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === 'ai-assistant'
          ? {
              ...p,
              isSpeaking: isPlayingTTS,
            }
          : p,
      ),
    );
  }, [isPlayingTTS]);

  useEffect(() => {
    if (!status.isCallActive || audioError) {
      if (isRecording) {
        stopRecording();
      }
      return;
    }

    if (isMuted) {
      if (isRecording) {
        stopRecording();
      }
      return;
    }

    if (!isRecording) {
      toggleRecording();
    }
  }, [status.isCallActive, audioError, isMuted, isRecording, toggleRecording, stopRecording]);

  const addActionStatus = useCallback((action: ActionStatus) => {
    setActionStatuses((prev) => [...prev, action]);

    const timeout = setTimeout(() => {
      setActionStatuses((prev) => prev.filter((a) => a.id !== action.id));
    }, 6000);
    actionTimeouts.current[action.id] = timeout;
  }, []);

  const parseActionFromMessage = (message: CallMessage) => {
    if (message.type !== 'ai_response') return;
    const content = message.content.toLowerCase();

    if (content.includes('scheduling') || content.includes('calendar')) {
      addActionStatus({
        id: `action-${Date.now()}`,
        type: 'calendar',
        status: 'in_progress',
        message: 'Scheduling your meeting...',
        timestamp: new Date(),
      });
    } else if (content.includes('slack') || content.includes('message')) {
      addActionStatus({
        id: `action-${Date.now()}`,
        type: 'slack',
        status: 'in_progress',
        message: 'Sending a Slack message...',
        timestamp: new Date(),
      });
    } else if (content.includes('searching') || content.includes('looking up')) {
      addActionStatus({
        id: `action-${Date.now()}`,
        type: 'search',
        status: 'in_progress',
        message: 'Searching knowledge base...',
        timestamp: new Date(),
      });
    }
  };

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
      case 'error':
        return {
          label: 'Error',
          className: 'text-red-400',
        };
      default:
        return {
          label: 'Disconnected',
          className: 'text-gray-400',
        };
    }
  }, [status.connectionState]);

  const toggleMute = () => {
    if (!status.isCallActive && !status.isConnected) return;
    setIsMuted((prev) => !prev);
  };

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

      await callClient.endCall();
      router.push('/meetings');
    } catch (error) {
      console.error('Failed to end meeting:', error);
    }
  };

  const leaveMeeting = async () => {
    try {
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
      await callClient.endCall();
      router.push('/meetings');
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
            className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs sm:text-sm font-medium text-white transition hover:bg-white/20"
          >
            <UserGroupIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden md:inline">Invite</span>
          </button>
          {isHost ? (
            <button
              onClick={endMeetingForAll}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-red-500 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-red-600"
            >
              <PhoneSolidIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">End For All</span>
              <span className="sm:hidden">End</span>
            </button>
          ) : (
            <button
              onClick={leaveMeeting}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-orange-500 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-orange-600"
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
                      'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950': participant.isSpeaking,
                    },
                  )}
                >
                  <div className="absolute inset-x-4 top-4 flex items-center justify-between rounded-xl bg-black/40 px-3 py-2 text-xs text-slate-200 backdrop-blur">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold">
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
                      {participant.isSpeaking && (
                        <span className="flex items-center gap-1 text-xs text-emerald-300">
                          <SpeakerWaveIcon className="h-4 w-4" />
                          Speaking
                        </span>
                      )}
                      <div className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-1">
                        {participant.isMuted ? (
                          <MicrophoneIcon className="h-4 w-4 text-red-400" />
                        ) : (
                          <MicrophoneSolidIcon className="h-4 w-4 text-emerald-400" />
                        )}
                        {participant.isVideoEnabled ? (
                          <VideoCameraIcon className="h-4 w-4 text-emerald-300" />
                        ) : (
                          <VideoCameraSlashIcon className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-20 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-black/20">
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
                  <span className="block h-2 w-2 rounded-full bg-emerald-400" />
                  {participants.length} participants
                </div>
                <div className="flex items-center gap-2">
                  <span className="block h-2 w-2 rounded-full bg-sky-400" />
                  Audio level {Math.round(audioLevel * 100)}%
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={toggleMute}
                  className={cn(
                    'flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full transition',
                    isMuted ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white hover:bg-red-600',
                  )}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <MicrophoneIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <MicrophoneSolidIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                </button>

                <button
                  onClick={toggleVideo}
                  className={cn(
                    'flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full transition',
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
                  className={cn(
                    'hidden h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full transition sm:flex',
                    isScreenSharing
                      ? 'bg-sky-500 text-white hover:bg-sky-600'
                      : 'bg-white/10 text-white hover:bg-white/20',
                  )}
                  title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                >
                  <ComputerDesktopIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>

                <button
                  onClick={() => setIsVoiceMode((prev) => !prev)}
                  className={cn(
                    'hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition sm:flex',
                    isVoiceMode ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white/10 text-white hover:bg-white/20',
                  )}
                >
                  {isVoiceMode ? 'Voice Mode' : 'Hybrid Mode'}
                </button>

                <button
                  onClick={isHost ? endMeetingForAll : leaveMeeting}
                  className={cn(
                    'flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full transition',
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
                  className={cn(
                    'flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition',
                    sidebarPanel === 'chat' ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20',
                  )}
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  Chat
                </button>
                <button
                  onClick={() => setSidebarPanel((prev) => (prev === 'participants' ? null : 'participants'))}
                  className={cn(
                    'flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition',
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
                  className={cn(
                    'hidden h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition sm:flex',
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
                    messages.map((message, index) => (
                      <div
                        key={`${message.timestamp.toISOString()}-${index}`}
                        className={cn('flex flex-col gap-2 rounded-xl p-3 text-sm', {
                          'bg-blue-500/20 text-blue-100': message.type === 'user_speech',
                          'bg-white/10 text-white': message.type === 'ai_response',
                          'bg-emerald-500/20 text-emerald-100': message.type === 'tts_audio',
                          'bg-purple-500/20 text-purple-100': message.type === 'audio_data',
                        })}
                      >
                        <span className="text-xs uppercase tracking-wide text-slate-400">
                          {message.type.replace('_', ' ')}
                        </span>
                        <p className="leading-relaxed">{message.content}</p>
                        <span className="text-[10px] uppercase tracking-wide text-slate-500">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                {!isVoiceMode && (
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
                )}
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

