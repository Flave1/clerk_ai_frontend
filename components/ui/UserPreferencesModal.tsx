import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';

interface UserPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

interface CalendarStatus {
  connected: boolean;
  integration_id: string;
  name: string;
  image_url: string;
}

const UserPreferencesModal: React.FC<UserPreferencesModalProps> = ({ isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoJoinGoogle, setAutoJoinGoogle] = useState(false);
  const [autoJoinOutlook, setAutoJoinOutlook] = useState(false);
  const [googleCalendar, setGoogleCalendar] = useState<CalendarStatus | null>(null);
  const [outlookCalendar, setOutlookCalendar] = useState<CalendarStatus | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPreferences();
      loadCalendarStatus();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await apiClient.getUserPreferences();
      setAutoJoinGoogle(prefs.auto_join_google_calendar_meeting);
      setAutoJoinOutlook(prefs.auto_join_outlook_calendar_meeting);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarStatus = async () => {
    try {
      const status = await apiClient.getCalendarIntegrationStatus();
      setGoogleCalendar(status.google_calendar);
      setOutlookCalendar(status.microsoft_calendar);
    } catch (error) {
      console.error('Failed to load calendar status:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.updateUserPreferences({
        auto_join_google_calendar_meeting: autoJoinGoogle,
        auto_join_outlook_calendar_meeting: autoJoinOutlook,
      });
      toast.success('Preferences saved successfully');
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Side Modal */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-[9999] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Auto-join Preferences
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Choose which calendar meetings Aurray should automatically join
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <>
                  {/* Google Calendar Option */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {googleCalendar && (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden p-1.5">
                            <img
                              src={googleCalendar.image_url}
                              alt={googleCalendar.name}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Google Calendar
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {googleCalendar?.connected ? 'Connected' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoJoinGoogle}
                          onChange={(e) => setAutoJoinGoogle(e.target.checked)}
                          disabled={!googleCalendar?.connected}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 pl-13">
                      Automatically join meetings from your Google Calendar
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-gray-700"></div>

                  {/* Outlook Calendar Option */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {outlookCalendar && (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden p-1.5">
                            <img
                              src={outlookCalendar.image_url}
                              alt={outlookCalendar.name}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Outlook Calendar
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {outlookCalendar?.connected ? 'Connected' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoJoinOutlook}
                          onChange={(e) => setAutoJoinOutlook(e.target.checked)}
                          disabled={!outlookCalendar?.connected}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 pl-13">
                      Automatically join meetings from your Outlook Calendar
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Note:</strong> Aurray will also auto-join meetings where it has been invited as a participant.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserPreferencesModal;

