import React, { useState, useEffect } from 'react';
import CallInterface from '@/components/call/CallInterface';

const StandaloneCallPage: React.FC = () => {
  const [existingConversation, setExistingConversation] = useState<{ status?: string } | null>(null);
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
      // If this is a new join, establish the connection
      if (joined === 'true') {
        // Connection is already established via the API call in join page
      }
    }
  }, []);

  const handleCallStart = (conversationId: string) => {
    // Update URL with conversation ID
    const url = new URL(window.location.href);
    url.searchParams.set('conversationId', conversationId);
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <div className="h-screen w-screen bg-gray-900 overflow-hidden">
      <CallInterface
        onCallStart={handleCallStart}
        existingConversation={existingConversation}
        loadingConversation={loadingConversation}
      />
    </div>
  );
};

export default StandaloneCallPage;
