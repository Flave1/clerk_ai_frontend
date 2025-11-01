import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { VideoCameraIcon, UserIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const JoinMeetingPage: React.FC = () => {
  const router = useRouter();
  const { meetingId } = router.query;
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState<any>(null);

  useEffect(() => {
    if (meetingId) {
      // TODO: Fetch meeting information
      setMeetingInfo({
        id: meetingId,
        title: 'AI Meeting Room',
        host: 'AI Assistant',
        participants: 2
      });
    }
  }, [meetingId]);

  const handleJoinMeeting = async () => {
    if (!name.trim()) return;
    
    setIsJoining(true);
    
    try {
      // Generate participant ID
      const participantId = `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Join meeting via API to establish connection
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/meetings/${meetingId}/participants/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_name: name,
          participant_id: participantId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to join meeting');
      }
      
      const joinResult = await response.json();
      console.log('Successfully joined meeting:', joinResult);
      
      // Redirect to meeting with established connection
      const meetingUrl = `/standalone-call?meetingId=${meetingId}&participantId=${participantId}&name=${encodeURIComponent(name)}&joined=true`;
      
      // Open in new tab to join the meeting
      window.open(meetingUrl, '_blank');
      
      // Close this tab after a delay
      setTimeout(() => {
        window.close();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to join meeting:', error);
      setIsJoining(false);
      alert('Failed to join meeting. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinMeeting();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <VideoCameraIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Join Meeting</h1>
          <p className="text-blue-200">
            {meetingInfo ? `Meeting: ${meetingInfo.title}` : 'Loading meeting information...'}
          </p>
        </div>

        {/* Meeting Info Card */}
        {meetingInfo && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <VideoCameraIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{meetingInfo.title}</h3>
                  <p className="text-blue-200 text-sm">Hosted by {meetingInfo.host}</p>
                </div>
              </div>
              <div className="border-t border-white/20 pt-3">
                <p className="text-blue-200 text-sm">
                  {meetingInfo.participants} participant{meetingInfo.participants !== 1 ? 's' : ''} in meeting
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Join Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Your Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your name"
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-300"
                  disabled={isJoining}
                />
              </div>
            </div>

            <button
              onClick={handleJoinMeeting}
              disabled={!name.trim() || isJoining}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              {isJoining ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ArrowRightIcon className="w-5 h-5" />
                  <span>Join Meeting</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-blue-200 text-sm">
            You don't need to be logged in to join this meeting
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinMeetingPage;
