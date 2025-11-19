// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

// Action Types
export interface Action {
  id: string;
  turn_id?: string;
  action_type: ActionType;
  status: ActionStatus;
  parameters: Record<string, any>;
  result?: Record<string, any>;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export type ActionType = 
  | 'calendar_create'
  | 'calendar_update'
  | 'calendar_delete'
  | 'email_send'
  | 'slack_message'
  | 'crm_update'
  | 'knowledge_search'
  | 'meeting_join'
  | 'meeting_leave'
  | 'meeting_transcribe'
  | 'meeting_summarize';

export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

// Room Types
export interface Room {
  room_id: string;
  name: string;
  participant_count: number;
  is_active: boolean;
  created_at: string;
}

export interface RoomCreate {
  room_id: string;
  name: string;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: string;
  data: Record<string, any>;
  timestamp: string;
}

export interface ActionUpdate extends WebSocketMessage {
  type: 'action_update';
  action_id: string;
  update_type: string;
}

export interface RoomUpdate extends WebSocketMessage {
  type: 'room_update';
  room_id: string;
  update_type: string;
}

// Dashboard Stats
export interface DashboardStats {
  total_actions: number;
  pending_actions: number;
  completed_actions: number;
  failed_actions: number;
  active_rooms: number;
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  actions: number;
}

// Filter Types
export interface ActionFilters {
  status?: ActionStatus;
  action_type?: ActionType;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

// Meeting Types
export type MeetingPlatform = 'google_meet' | 'zoom' | 'microsoft_teams';
export type MeetingStatus = 'scheduled' | 'joining' | 'active' | 'ended' | 'failed' | 'cancelled';

export interface MeetingParticipant {
  email: string;
  name?: string;
  is_organizer: boolean;
  response_status: string;
}

export interface ActionItem {
  id: string;
  description: string;
  assignee?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface MeetingSummary {
  id: string;
  meeting_id: string;
  topics_discussed: string[];
  key_decisions: string[];
  action_items: ActionItem[];
  summary_text: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  duration_minutes?: number;
  created_at: string;
}

export interface Meeting {
  id: string;
  platform: MeetingPlatform;
  meeting_url: string;
  meeting_id_external: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  organizer_email: string;
  participants: MeetingParticipant[];
  status: MeetingStatus;
  ai_email: string;
  transcription_chunks: string[];
  full_transcription?: string;
  summary?: MeetingSummary;
  calendar_event_id?: string;
  join_attempts: number;
  last_join_attempt?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  joined_at?: string;
  ended_at?: string;
  audio_enabled: boolean;
  video_enabled: boolean;
  recording_enabled: boolean;
  meeting_started?: boolean;
  transcript?: boolean;
  voice_id?: string;
  bot_name?: string;
  context_id?: string;
}

export interface TranscriptionChunk {
  meeting_id: string;
  chunk_id: string;
  text: string;
  speaker?: string;
  confidence: number;
  timestamp: string;
  is_final: boolean;
}

export interface MeetingNotification {
  meeting_id: string;
  notification_type: 'summary' | 'action_items' | 'reminder';
  recipients: string[];
  subject: string;
  content: string;
  sent_at?: string;
  delivery_status: 'pending' | 'sent' | 'failed';
}

export interface MeetingConfig {
  auto_join_enabled: boolean;
  join_buffer_minutes: number;
  max_join_attempts: number;
  transcription_enabled: boolean;
  chunk_size_seconds: number;
  language: string;
  summarization_enabled: boolean;
  summary_frequency_minutes: number;
  final_summary_enabled: boolean;
  email_notifications_enabled: boolean;
  slack_notifications_enabled: boolean;
  notification_channels: string[];
  voice_participation_enabled: boolean;
  response_triggers: string[];
  store_audio: boolean;
  store_transcription: boolean;
  retention_days: number;
}

export interface MeetingJoinRequest {
  meeting_id: string;
  platform: MeetingPlatform;
  meeting_url: string;
  meeting_id_external: string;
  join_time: string;
}

export interface MeetingJoinResponse {
  success: boolean;
  meeting_id: string;
  error_message?: string;
  join_time: string;
}

export interface MeetingAgentStatus {
  status: 'running' | 'stopped';
  active_meetings_count: number;
  active_meetings: Array<{
    id: string;
    title: string;
    platform: MeetingPlatform;
  }>;
  services: {
    scheduler: 'running' | 'stopped';
    notification: 'initialized' | 'not_initialized';
    summarization: 'initialized' | 'not_initialized';
  };
}

export interface MeetingFilters {
  status?: MeetingStatus;
  platform?: MeetingPlatform;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

// API Key Types
export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  status: 'active' | 'revoked' | 'expired';
  last_used_at?: string;
  expires_at?: string;
  scopes: string[];
  created_at: string;
  updated_at: string;
  plain_key?: string; // Only present on creation
}

// Webhook Types
export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'GET' | 'PUT' | 'DELETE';
  description?: string;
  payload: Record<string, any>;
}

export interface JoinMeetingRequest {
  meeting_url: string;
  type: string; // 'zoom' | 'google_meet' | 'microsoft_teams'
  transcript: boolean;
  audio_record: boolean;
  video_record: boolean;
  voice_id: string;
  bot_name: string;
}

export interface JoinMeetingResponse {
  success: boolean;
  message: string;
  status: string;
  timestamp: string;
  meeting_id?: string;
  meeting_url?: string;
  platform?: string;
  voice_id?: string;
  capabilities?: {
    transcript_enabled?: boolean;
    audio_recording_enabled?: boolean;
    video_recording_enabled?: boolean;
  };
}

// Meeting Context Types
export type MeetingRole = 'listener' | 'participant' | 'presenter';
export type TonePersonality = 'formal' | 'friendly' | 'confident' | 'empathetic' | 'analytical' | 'custom';

export interface MeetingContext {
  id: string;
  name: string;
  voice_id: string;
  context_description: string;
  tools_integrations: string[];
  meeting_role: MeetingRole;
  tone_personality: TonePersonality;
  custom_tone?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_default: boolean;
}

export interface MeetingContextCreate {
  name: string;
  voice_id: string;
  context_description: string;
  tools_integrations: string[];
  meeting_role: MeetingRole;
  tone_personality: TonePersonality;
  custom_tone?: string;
  is_default?: boolean;
}
