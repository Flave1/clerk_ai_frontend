import React, { useState, useEffect } from 'react';
import CallInterface from '@/components/call/CallInterface';
import { Conversation } from '@/types';

const StandaloneCallPage: React.FC = () => {
  const [existingConversation, setExistingConversation] = useState<Conversation | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [participantInfo, setParticipantInfo] = useState<{id: string, name: string} | null>(null);

  // Handle URL parameters for conversation ID and participant info
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('conversationId');
    const meetingId = urlParams.get('meetingId');
    const participantId = urlParams.get('participantId');
    const name = urlParams.get('name');
    const joined = urlParams.get('joined');
    
    if (conversationId) {
      setLoadingConversation(true);
      // You can load existing conversation data here if needed
      setLoadingConversation(false);
    }

    // Handle participant joining meeting
    if (meetingId && participantId && name) {
      setParticipantInfo({
        id: participantId,
        name: decodeURIComponent(name)
      });
      console.log('Participant joining meeting:', { meetingId, participantId, name, joined });
      
      // If this is a new join, establish the connection
      if (joined === 'true') {
        console.log('Established connection for participant:', participantId);
        // Connection is already established via the API call in join page
      }
    }
  }, []);

  const handleCallStart = (conversationId: string) => {
    console.log('Call started with conversation ID:', conversationId);
    // Update URL with conversation ID
    const url = new URL(window.location.href);
    url.searchParams.set('conversationId', conversationId);
    window.history.replaceState({}, '', url.toString());
  };

  const handleCallEnd = (conversationId: string) => {
    console.log('Call ended for conversation ID:', conversationId);
    // Remove conversation ID from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('conversationId');
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <div className="h-screen w-screen bg-gray-900 overflow-hidden">
      <CallInterface
        onCallStart={handleCallStart}
        onCallEnd={handleCallEnd}
        existingConversation={existingConversation}
        loadingConversation={loadingConversation}
      />
    </div>
  );
};

export default StandaloneCallPage;
