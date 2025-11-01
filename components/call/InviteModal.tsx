import React, { useState } from 'react';
import { XMarkIcon, ShareIcon, ClipboardIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  meetingUrl: string;
}

const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, meetingId, meetingUrl }) => {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleSendEmail = async () => {
    if (!email.trim()) return;
    
    try {
      // TODO: Implement email invitation API call
      console.log('Sending invitation to:', email);
      setEmail('');
      // Show success message
    } catch (error) {
      console.error('Failed to send invitation:', error);
    }
  };

  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendEmail();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Invite Participants
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Meeting Link Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meeting Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={meetingUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <ClipboardIcon className="w-4 h-4" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Email Invitation Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Send Email Invitation
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleEmailKeyPress}
                placeholder="Enter email address"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={handleSendEmail}
                disabled={!email.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <EnvelopeIcon className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>

          {/* Meeting Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <ShareIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Meeting Information
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <p><strong>Meeting ID:</strong> {meetingId}</p>
              <p><strong>Access:</strong> Public (Anyone with the link can join)</p>
              <p><strong>Participants:</strong> No limit</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
