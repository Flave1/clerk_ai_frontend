import React, { useState, useEffect, useRef } from 'react';
import { callClient, CallMessage, CallStatus } from '@/lib/callClient';
import { MicrophoneIcon, PhoneIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneIconSolid, PhoneIcon as PhoneIconSolid } from '@heroicons/react/24/solid';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { Conversation } from '@/types';

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use the audio recording hook for speech-to-text input only
  const {
    isRecording,
    isSpeaking,
    audioLevel,
    error: audioError,
    toggleRecording,
  } = useAudioRecording({
    onTranscript: (transcript: string) => {
      console.log('Speech-to-text result:', transcript);
      // Auto-fill the input field with the transcript
      setInputMessage(transcript);
      // Don't auto-send, let user review and send manually
    },
    // Remove audio streaming callbacks - we only want speech-to-text
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
    });

    const unsubscribeStatus = callClient.onStatusChange((newStatus: CallStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeStatus();
    };
  }, []);

  // Show audio error if any
  useEffect(() => {
    if (audioError) {
      alert(audioError);
    }
  }, [audioError]);

  // Handle existing conversation
  useEffect(() => {
    if (existingConversation && !loadingConversation) {
      console.log('Loading existing conversation:', existingConversation);
      // You can add logic here to load conversation history, set up the call state, etc.
      // For now, we'll just log it and potentially set up the conversation context
    }
  }, [existingConversation, loadingConversation]);

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

  const endCall = async () => {
    try {
      await callClient.endCall();
      if (status.conversationId && onCallEnd) {
        onCallEnd(status.conversationId);
      }
      setMessages([]);
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !status.isConnected) return;

    try {
      await callClient.sendMessage(inputMessage);
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  // Audio streaming functions removed - we only use speech-to-text for input

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Receptionist Call</h2>
          <p className={`text-sm ${getStatusColor()}`}>
            {loadingConversation ? 'Loading conversation...' : getStatusText()}
            {status.conversationId && (
              <span className="ml-2 text-gray-500 dark:text-gray-400">
                (ID: {status.conversationId.slice(0, 8)}...)
              </span>
            )}
            {existingConversation && !loadingConversation && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                (Existing: {existingConversation.status})
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {!status.isCallActive ? (
            <button
              onClick={startCall}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PhoneIcon className="w-5 h-5" />
              <span>{isLoading ? 'Starting...' : 'Start Call'}</span>
            </button>
          ) : (
            <button
              onClick={endCall}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PhoneIconSolid className="w-5 h-5" />
              <span>End Call</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <SpeakerWaveIcon className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p>No messages yet</p>
              <p className="text-sm">Start a call to begin talking with the AI</p>
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
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user_speech'
                      ? 'bg-blue-600 dark:bg-blue-500 text-white'
                      : message.type === 'ai_response'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Action Status Indicators */}
            {actionStatuses.map((action) => (
              <div key={action.id} className="flex justify-center">
                <div className={`px-3 py-2 rounded-lg text-sm flex items-center space-x-2 ${
                  action.status === 'completed' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    : action.status === 'failed'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    action.status === 'completed' 
                      ? 'bg-green-500 dark:bg-green-400'
                      : action.status === 'failed'
                      ? 'bg-red-500 dark:bg-red-400'
                      : 'bg-blue-500 dark:bg-blue-400 animate-pulse'
                  }`} />
                  <span>{action.message}</span>
                </div>
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {status.isConnected && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              disabled={!status.isConnected}
            />
            
            <button
              onClick={toggleRecording}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isRecording
                  ? isSpeaking
                    ? 'bg-red-500 text-white shadow-lg scale-105'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isRecording ? (isSpeaking ? 'Recording - You are speaking!' : 'Stop Recording') : 'Start Recording'}
            >
              {isRecording ? (
                <MicrophoneIconSolid className="w-5 h-5" />
              ) : (
                <MicrophoneIcon className="w-5 h-5" />
              )}
            </button>
            
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              Press Enter to send • Click microphone to record audio
            </p>
            
            {isRecording && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-red-600 font-medium">
                  {isSpeaking ? 'Speaking...' : 'Listening...'}
                </span>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">
                    {audioLevel.toFixed(2)}
                  </span>
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-100 ${
                          audioLevel > (i + 1) * 0.2
                            ? 'bg-red-500'
                            : 'bg-gray-300'
                        }`}
                        style={{
                          height: `${Math.max(8, audioLevel * 20 + 8)}px`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CallInterface;
