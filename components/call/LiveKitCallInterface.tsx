import React, { useState, useEffect, useRef } from 'react';
import { livekitClient, LiveKitConfig } from '@/lib/livekitClient';
import { MicrophoneIcon, PhoneIcon, SpeakerWaveIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneIconSolid, PhoneIcon as PhoneIconSolid, VideoCameraIcon as VideoCameraIconSolid } from '@heroicons/react/24/solid';

interface LiveKitCallInterfaceProps {
  onCallEnd?: (conversationId: string) => void;
}

interface CallMessage {
  type: 'user_message' | 'ai_response' | 'status';
  content: string;
  timestamp: Date;
  conversationId?: string;
}

const LiveKitCallInterface: React.FC<LiveKitCallInterfaceProps> = ({ onCallEnd }) => {
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Setup LiveKit event handlers
  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      setIsConnecting(false);
      console.log('LiveKit connected');
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setIsCallActive(false);
      console.log('LiveKit disconnected');
    };

    const handleParticipantConnected = (participant: any) => {
      setParticipants(prev => [...prev, participant]);
      console.log('Participant connected:', participant.identity);
    };

    const handleParticipantDisconnected = (participant: any) => {
      setParticipants(prev => prev.filter(p => p.identity !== participant.identity));
      console.log('Participant disconnected:', participant.identity);
    };

    const handleAIResponse = (response: string) => {
      setMessages(prev => [...prev, {
        type: 'ai_response',
        content: response,
        timestamp: new Date(),
      }]);
    };

    const handleError = (error: Error) => {
      console.error('LiveKit error:', error);
      alert(`LiveKit error: ${error.message}`);
    };

    // Set up event handlers
    livekitClient.on('connected', handleConnected);
    livekitClient.on('disconnected', handleDisconnected);
    livekitClient.on('participantConnected', handleParticipantConnected);
    livekitClient.on('participantDisconnected', handleParticipantDisconnected);
    livekitClient.on('aiResponseReceived', handleAIResponse);
    livekitClient.on('error', handleError);

    // Cleanup function - remove event handlers
    return () => {
      livekitClient.off('connected');
      livekitClient.off('disconnected');
      livekitClient.off('participantConnected');
      livekitClient.off('participantDisconnected');
      livekitClient.off('aiResponseReceived');
      livekitClient.off('error');
    };
  }, []);

  const startCall = async () => {
    try {
      setIsConnecting(true);
      
      // Generate a conversation ID
      const newConversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setConversationId(newConversationId);

      // Configure LiveKit connection
      const config: LiveKitConfig = {
        url: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880',
        token: await generateLiveKitToken(newConversationId, 'user'),
        roomName: newConversationId,
        participantName: 'User',
      };

      // Connect to LiveKit room
      await livekitClient.connect(config);
      
      setIsCallActive(true);
      setMessages([{
        type: 'status',
        content: `Call started with conversation ID: ${newConversationId}`,
        timestamp: new Date(),
      }]);

    } catch (error) {
      console.error('Failed to start call:', error);
      setIsConnecting(false);
      alert('Failed to start call. Please check your LiveKit configuration.');
    }
  };

  const endCall = async () => {
    try {
      await livekitClient.disconnect();
      setIsCallActive(false);
      setIsConnected(false);
      
      if (conversationId && onCallEnd) {
        onCallEnd(conversationId);
      }
      
      setMessages(prev => [...prev, {
        type: 'status',
        content: 'Call ended.',
        timestamp: new Date(),
      }]);
      
      setConversationId(null);
      setParticipants([]);
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !isConnected) return;

    try {
      // Send text message through LiveKit
      await livekitClient.sendTextMessage(inputMessage);
      
      setMessages(prev => [...prev, {
        type: 'user_message',
        content: inputMessage,
        timestamp: new Date(),
        conversationId: conversationId || undefined,
      }]);
      
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

  const toggleMicrophone = async () => {
    try {
      await livekitClient.toggleMicrophone();
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  };

  const toggleVideo = async () => {
    try {
      await livekitClient.toggleCamera();
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  };

  const getConnectionStatus = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  const getConnectionColor = () => {
    if (isConnecting) return 'text-yellow-600';
    if (isConnected) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI Receptionist Call (LiveKit)</h2>
          <p className={`text-sm ${getConnectionColor()}`}>
            {getConnectionStatus()}
            {conversationId && (
              <span className="ml-2 text-gray-500">
                (ID: {conversationId.slice(0, 8)}...)
              </span>
            )}
          </p>
          {participants.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Participants: {participants.length + 1} (including you)
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {!isCallActive ? (
            <button
              onClick={startCall}
              disabled={isConnecting}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PhoneIcon className="w-5 h-5" />
              <span>{isConnecting ? 'Starting...' : 'Start Call'}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMicrophone}
                className={`p-2 rounded-lg transition-colors ${
                  isMuted
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <MicrophoneIconSolid className="w-5 h-5" />
                ) : (
                  <MicrophoneIcon className="w-5 h-5" />
                )}
              </button>
              
              <button
                onClick={toggleVideo}
                className={`p-2 rounded-lg transition-colors ${
                  isVideoEnabled
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isVideoEnabled ? 'Disable Video' : 'Enable Video'}
              >
                {isVideoEnabled ? (
                  <VideoCameraIconSolid className="w-5 h-5" />
                ) : (
                  <VideoCameraIcon className="w-5 h-5" />
                )}
              </button>
              
              <button
                onClick={endCall}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <PhoneIconSolid className="w-5 h-5" />
                <span>End Call</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <SpeakerWaveIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No messages yet</p>
              <p className="text-sm">Start a call to begin talking with the AI</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user_message' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user_message'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'ai_response'
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {isConnected && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!isConnected}
            />
            
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send • Use microphone/video controls above
          </p>
        </div>
      )}
    </div>
  );
};

// Helper function to generate LiveKit token
async function generateLiveKitToken(roomName: string, participantName: string): Promise<string> {
  try {
    // In a real implementation, this would call your backend to generate a token
    // For now, we'll create a simple token (this won't work in production)
    const response = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomName,
        participantName,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate token');
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Failed to generate LiveKit token:', error);
    // Return a placeholder token for development
    return 'dev-token-placeholder';
  }
}

export default LiveKitCallInterface;
