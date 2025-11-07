import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { 
  CogIcon,
  PlayIcon,
  StopIcon,
  BellIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useMeetingStore } from '@/store';
import apiClient from '@/lib/api';
import { MeetingConfig, MeetingAgentStatus } from '@/types';
import toast from 'react-hot-toast';
import Header from '@/components/layout/Header';
import Link from 'next/link';

// Configuration Section Component
function ConfigSection({ 
  title, 
  description, 
  children 
}: { 
  title: string; 
  description: string; 
  children: React.ReactNode; 
}) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}

// Status Indicator Component
function StatusIndicator({ 
  status, 
  label 
}: { 
  status: 'running' | 'stopped' | 'initialized' | 'not_initialized'; 
  label: string; 
}) {
  const isActive = status === 'running' || status === 'initialized';
  
  return (
    <div className="flex items-center space-x-2">
      <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
      <span className={`text-xs px-2 py-1 rounded-full ${
        isActive 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }`}>
        {status}
      </span>
    </div>
  );
}

const MeetingConfigPage: NextPage = () => {
  const { 
    meetingConfig, 
    meetingAgentStatus,
    configLoading,
    statusLoading,
    setMeetingConfig,
    setMeetingAgentStatus,
    setConfigLoading,
    setStatusLoading
  } = useMeetingStore();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [formData, setFormData] = useState<MeetingConfig>({
    auto_join_enabled: true,
    join_buffer_minutes: 5,
    max_join_attempts: 3,
    transcription_enabled: true,
    chunk_size_seconds: 30,
    language: 'en',
    summarization_enabled: true,
    summary_frequency_minutes: 10,
    final_summary_enabled: true,
    email_notifications_enabled: true,
    slack_notifications_enabled: true,
    notification_channels: [],
    voice_participation_enabled: false,
    response_triggers: [],
    store_audio: false,
    store_transcription: true,
    retention_days: 90,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setConfigLoading(true);
        setStatusLoading(true);
        
        const [configData, statusData] = await Promise.all([
          apiClient.getMeetingConfig(),
          apiClient.getMeetingAgentStatus(),
        ]);
        
        setMeetingConfig(configData);
        setFormData(configData);
        setMeetingAgentStatus(statusData);
      } catch (error) {
        console.error('Failed to load meeting configuration:', error);
        toast.error('Failed to load meeting configuration');
      } finally {
        setConfigLoading(false);
        setStatusLoading(false);
      }
    };

    loadData();
  }, [setMeetingConfig, setMeetingAgentStatus, setConfigLoading, setStatusLoading]);

  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      const updatedConfig = await apiClient.updateMeetingConfig(formData);
      setMeetingConfig(updatedConfig);
      toast.success('Configuration saved successfully');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartScheduler = async () => {
    try {
      setIsStarting(true);
      await apiClient.startMeetingScheduler();
      toast.success('Meeting scheduler started');
      // Reload status
      const statusData = await apiClient.getMeetingAgentStatus();
      setMeetingAgentStatus(statusData);
    } catch (error) {
      console.error('Failed to start scheduler:', error);
      toast.error('Failed to start scheduler');
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopScheduler = async () => {
    try {
      setIsStopping(true);
      await apiClient.stopMeetingScheduler();
      toast.success('Meeting scheduler stopped');
      // Reload status
      const statusData = await apiClient.getMeetingAgentStatus();
      setMeetingAgentStatus(statusData);
    } catch (error) {
      console.error('Failed to stop scheduler:', error);
      toast.error('Failed to stop scheduler');
    } finally {
      setIsStopping(false);
    }
  };

  const updateFormData = (field: keyof MeetingConfig, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (configLoading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Meeting Configuration - Aurray</title>
      </Head>

      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Meeting Configuration</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Configure AI meeting participation settings and behavior.
              </p>
            </div>
            
            <Link href="/meetings">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Meetings
              </button>
            </Link>
          </div>
        </div>

        {/* Service Status */}
        <div className="mb-8">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Service Status</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Meeting Agent</h3>
                  <div className="space-y-3">
                    <StatusIndicator 
                      status={meetingAgentStatus?.status || 'stopped'} 
                      label="Overall Status" 
                    />
                    <StatusIndicator 
                      status={meetingAgentStatus?.services.scheduler || 'stopped'} 
                      label="Scheduler" 
                    />
                    <StatusIndicator 
                      status={meetingAgentStatus?.services.notification || 'not_initialized'} 
                      label="Notifications" 
                    />
                    <StatusIndicator 
                      status={meetingAgentStatus?.services.summarization || 'not_initialized'} 
                      label="Summarization" 
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Active Meetings</h3>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {meetingAgentStatus?.active_meetings_count || 0}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Currently Active</p>
                  </div>
                  
                  {meetingAgentStatus?.active_meetings && meetingAgentStatus.active_meetings.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Active Meetings</h4>
                      <div className="space-y-2">
                        {meetingAgentStatus.active_meetings.map((meeting, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 dark:text-gray-300 truncate">{meeting.title}</span>
                            <span className="text-gray-500 dark:text-gray-400">{meeting.platform}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={handleStartScheduler}
                  disabled={isStarting || meetingAgentStatus?.status === 'running'}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  {isStarting ? 'Starting...' : 'Start Scheduler'}
                </button>
                
                <button
                  onClick={handleStopScheduler}
                  disabled={isStopping || meetingAgentStatus?.status === 'stopped'}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <StopIcon className="h-4 w-4 mr-2" />
                  {isStopping ? 'Stopping...' : 'Stop Scheduler'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Sections */}
        <div className="space-y-6">
          {/* Join Settings */}
          <ConfigSection
            title="Join Settings"
            description="Configure how the AI joins meetings automatically"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Auto Join Enabled</label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Automatically join scheduled meetings</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_join_enabled}
                    onChange={(e) => updateFormData('auto_join_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Join Buffer (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.join_buffer_minutes}
                  onChange={(e) => updateFormData('join_buffer_minutes', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">How many minutes before the meeting to join</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Join Attempts
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.max_join_attempts}
                  onChange={(e) => updateFormData('max_join_attempts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Maximum number of join attempts per meeting</p>
              </div>
            </div>
          </ConfigSection>

          {/* Transcription Settings */}
          <ConfigSection
            title="Transcription Settings"
            description="Configure real-time speech-to-text processing"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Transcription Enabled</label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enable real-time speech-to-text</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.transcription_enabled}
                    onChange={(e) => updateFormData('transcription_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chunk Size (seconds)
                </label>
                <input
                  type="number"
                  min="10"
                  max="60"
                  value={formData.chunk_size_seconds}
                  onChange={(e) => updateFormData('chunk_size_seconds', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Size of audio chunks for processing</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => updateFormData('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="ru">Russian</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
            </div>
          </ConfigSection>

          {/* Summarization Settings */}
          <ConfigSection
            title="Summarization Settings"
            description="Configure AI-powered meeting summarization"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Summarization Enabled</label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enable AI meeting summarization</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.summarization_enabled}
                    onChange={(e) => updateFormData('summarization_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Summary Frequency (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={formData.summary_frequency_minutes}
                  onChange={(e) => updateFormData('summary_frequency_minutes', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">How often to generate interim summaries</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Final Summary</label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Generate final summary at meeting end</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.final_summary_enabled}
                    onChange={(e) => updateFormData('final_summary_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </ConfigSection>

          {/* Notification Settings */}
          <ConfigSection
            title="Notification Settings"
            description="Configure how meeting summaries and updates are sent"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Notifications</label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Send summaries via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.email_notifications_enabled}
                    onChange={(e) => updateFormData('email_notifications_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Slack Notifications</label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Send summaries via Slack</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.slack_notifications_enabled}
                    onChange={(e) => updateFormData('slack_notifications_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </ConfigSection>

          {/* Storage Settings */}
          <ConfigSection
            title="Storage Settings"
            description="Configure data retention and storage options"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Store Audio</label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Save meeting audio recordings</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.store_audio}
                    onChange={(e) => updateFormData('store_audio', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Store Transcription</label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Save meeting transcriptions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.store_transcription}
                    onChange={(e) => updateFormData('store_transcription', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Retention Period (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.retention_days}
                  onChange={(e) => updateFormData('retention_days', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">How long to keep meeting data</p>
              </div>
            </div>
          </ConfigSection>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CogIcon className="h-5 w-5 mr-2" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </>
  );
};

export default MeetingConfigPage;
