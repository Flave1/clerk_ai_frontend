import React from 'react';
import { UsersIcon, MicrophoneIcon, VideoCameraIcon, VideoCameraSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Participant {
  id: string;
  name: string;
  isVideoEnabled: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  isHost?: boolean;
  joinedAt: Date;
}

interface ParticipantListProps {
  participants: Participant[];
  isOpen: boolean;
  onClose: () => void;
}

const ParticipantList: React.FC<ParticipantListProps> = ({ participants, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <UsersIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Participants ({participants.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Participant List */}
        <div className="max-h-64 overflow-y-auto p-6">
          {participants.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <UsersIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No participants yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    participant.isSpeaking 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {participant.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    
                    {/* Name and Status */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {participant.name}
                        </span>
                        {participant.isHost && (
                          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                            Host
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Joined {new Date(participant.joinedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Icons */}
                  <div className="flex items-center space-x-2">
                    {participant.isMuted && (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <MicrophoneIcon className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {!participant.isVideoEnabled && (
                      <VideoCameraSlashIcon className="w-5 h-5 text-gray-400" />
                    )}
                    {participant.isSpeaking && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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

export default ParticipantList;
