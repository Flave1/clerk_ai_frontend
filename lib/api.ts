import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  Conversation,
  ConversationCreate,
  Turn,
  Action,
  Room,
  RoomCreate,
  ConversationFilters,
  ActionFilters,
  Meeting,
  MeetingSummary,
  MeetingStatus,
  MeetingPlatform,
  ActionItem,
  TranscriptionChunk,
  MeetingConfig,
  MeetingJoinResponse,
  MeetingAgentStatus,
  MeetingFilters,
} from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://harlequinesque-nonhereditarily-roni.ngrok-free.dev',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Conversations
  async getConversations(filters?: ConversationFilters): Promise<Conversation[]> {
    const response = await this.client.get('/api/v1/conversations', {
      params: filters,
    });
    return response.data;
  }

  async getConversation(id: string): Promise<Conversation> {
    const response = await this.client.get(`/api/v1/conversations/${id}`);
    return response.data;
  }

  async createConversation(data: ConversationCreate): Promise<Conversation> {
    const response = await this.client.post('/api/v1/conversations', data);
    return response.data;
  }

  async updateConversationStatus(
    id: string,
    status: string,
    summary?: string
  ): Promise<Conversation> {
    const response = await this.client.put(`/api/v1/conversations/${id}/status`, {
      status,
      summary,
    });
    return response.data;
  }

  async deleteConversation(id: string): Promise<void> {
    await this.client.delete(`/api/v1/conversations/${id}`);
  }

  async getConversationTurns(
    conversationId: string,
    limit = 100,
    offset = 0
  ): Promise<Turn[]> {
    const response = await this.client.get(
      `/api/v1/conversations/${conversationId}/turns`,
      {
        params: { limit, offset },
      }
    );
    return response.data;
  }

  // Actions
  async getActions(filters?: ActionFilters): Promise<Action[]> {
    const response = await this.client.get('/api/v1/actions', {
      params: filters,
    });
    return response.data;
  }

  async getAction(id: string): Promise<Action> {
    const response = await this.client.get(`/api/v1/actions/${id}`);
    return response.data;
  }

  async updateAction(
    id: string,
    status: string,
    result?: Record<string, any>,
    error_message?: string
  ): Promise<Action> {
    const response = await this.client.put(`/api/v1/actions/${id}`, {
      status,
      result,
      error_message,
    });
    return response.data;
  }

  async getConversationActions(
    conversationId: string,
    limit = 50,
    offset = 0
  ): Promise<Action[]> {
    const response = await this.client.get(
      `/api/v1/actions/conversation/${conversationId}`,
      {
        params: { limit, offset },
      }
    );
    return response.data;
  }

  // Rooms
  async getRooms(): Promise<Room[]> {
    const response = await this.client.get('/api/v1/rooms');
    return response.data;
  }

  async getRoom(id: string): Promise<Room> {
    const response = await this.client.get(`/api/v1/rooms/${id}`);
    return response.data;
  }

  async createRoom(data: RoomCreate): Promise<Room> {
    const response = await this.client.post('/api/v1/rooms', data);
    return response.data;
  }

  async updateRoomParticipants(
    roomId: string,
    participantCount: number
  ): Promise<Room> {
    const response = await this.client.put(`/api/v1/rooms/${roomId}/participants`, {
      participant_count: participantCount,
    });
    return response.data;
  }

  async deleteRoom(id: string): Promise<void> {
    await this.client.delete(`/api/v1/rooms/${id}`);
  }

  // Meeting Agent API Methods
  async getMeetings(filters?: MeetingFilters): Promise<Meeting[]> {
    const response = await this.client.get('/api/v1/meetings', {
      params: filters,
    });
    return response.data;
  }

  async getMeeting(id: string): Promise<Meeting> {
    const response = await this.client.get(`/api/v1/meetings/${id}`);
    return response.data;
  }

  async getMeetingSummary(id: string): Promise<MeetingSummary> {
    const response = await this.client.get(`/api/v1/meetings/${id}/summary`);
    return response.data;
  }

  async getMeetingSummaries(limit = 50, offset = 0): Promise<MeetingSummary[]> {
    const response = await this.client.get('/api/v1/meetings/summaries', {
      params: { limit, offset },
    });
    return response.data;
  }

  async joinMeeting(id: string): Promise<MeetingJoinResponse> {
    const response = await this.client.post(`/api/v1/meetings/${id}/join`);
    return response.data;
  }

  async leaveMeeting(id: string): Promise<void> {
    await this.client.post(`/api/v1/meetings/${id}/leave`);
  }

  async getActiveMeetings(): Promise<Meeting[]> {
    const response = await this.client.get('/api/v1/meetings/active');
    return response.data;
  }

  async sendMeetingNotification(
    id: string,
    notificationType: 'summary' | 'action_items' | 'reminder'
  ): Promise<void> {
    await this.client.post(`/api/v1/meetings/${id}/notify`, {
      notification_type: notificationType,
    });
  }

  async getMeetingParticipants(id: string): Promise<{
    meeting_id: string;
    participants: any[];
    total_count: number;
  }> {
    const response = await this.client.get(`/api/v1/meetings/${id}/participants`);
    return response.data;
  }

  async getMeetingTranscription(id: string): Promise<{
    meeting_id: string;
    transcription: string;
    chunks: string[];
    chunk_count: number;
  }> {
    const response = await this.client.get(`/api/v1/meetings/${id}/transcription`);
    return response.data;
  }

  async getMeetingActionItems(id: string): Promise<ActionItem[]> {
    const response = await this.client.get(`/api/v1/meetings/${id}/action-items`);
    return response.data;
  }

  async updateActionItem(
    meetingId: string,
    actionItemId: string,
    status: string
  ): Promise<void> {
    await this.client.put(`/api/v1/meetings/${meetingId}/action-items/${actionItemId}`, {
      status,
    });
  }

  async getMeetingConfig(): Promise<MeetingConfig> {
    const response = await this.client.get('/api/v1/meetings/config');
    return response.data;
  }

  async updateMeetingConfig(config: MeetingConfig): Promise<MeetingConfig> {
    const response = await this.client.put('/api/v1/meetings/config', config);
    return response.data;
  }

  async getMeetingAgentStatus(): Promise<MeetingAgentStatus> {
    const response = await this.client.get('/api/v1/meetings/status');
    return response.data;
  }

  async startMeetingScheduler(): Promise<void> {
    await this.client.post('/api/v1/meetings/start-scheduler');
  }

  async stopMeetingScheduler(): Promise<void> {
    await this.client.post('/api/v1/meetings/stop-scheduler');
  }

  async bulkDeleteMeetings(meetingIds: string[]): Promise<{
    success: boolean;
    deleted_count: number;
    total_requested: number;
    failed_deletions: Array<{ meeting_id: string; error: string }>;
  }> {
    const response = await this.client.delete('/api/v1/meetings/bulk', {
      data: meetingIds,
    });
    return response.data;
  }

  // Dashboard Stats (mock for now - would be implemented in backend)
  async getDashboardStats(): Promise<{
    total_conversations: number;
    active_conversations: number;
    completed_conversations: number;
    total_actions: number;
    pending_actions: number;
    completed_actions: number;
    failed_actions: number;
    active_rooms: number;
  }> {
    // This would be a real endpoint in production
    const [conversations, actions, rooms] = await Promise.all([
      this.getConversations(),
      this.getActions(),
      this.getRooms(),
    ]);

    const activeConversations = conversations.filter(c => c.status === 'active').length;
    const completedConversations = conversations.filter(c => c.status === 'completed').length;
    const pendingActions = actions.filter(a => a.status === 'pending').length;
    const completedActions = actions.filter(a => a.status === 'completed').length;
    const failedActions = actions.filter(a => a.status === 'failed').length;
    const activeRooms = rooms.filter(r => r.is_active).length;

    return {
      total_conversations: conversations.length,
      active_conversations: activeConversations,
      completed_conversations: completedConversations,
      total_actions: actions.length,
      pending_actions: pendingActions,
      completed_actions: completedActions,
      failed_actions: failedActions,
      active_rooms: activeRooms,
    };
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export convenience functions for pages
export const fetchConversations = (filters?: ConversationFilters) => apiClient.getConversations(filters);
export const fetchConversation = (id: string) => apiClient.getConversation(id);
export const createConversation = (data: ConversationCreate) => apiClient.createConversation(data);
export const updateConversation = (id: string, data: any) => apiClient.updateConversationStatus(id, data.status, data.summary);
export const fetchActions = (filters?: ActionFilters) => apiClient.getActions(filters);
export const fetchAction = (id: string) => apiClient.getAction(id);
export const createAction = (data: any) => apiClient.updateAction(data.id, data.status, data.result, data.error_message);
export const updateAction = (id: string, data: any) => apiClient.updateAction(id, data.status, data.result, data.error_message);
export const fetchRooms = () => apiClient.getRooms();
export const fetchRoom = (id: string) => apiClient.getRoom(id);
export const createRoom = (data: RoomCreate) => apiClient.createRoom(data);
export const updateRoom = (id: string, data: any) => apiClient.updateRoomParticipants(id, data.participant_count);
export const fetchDashboardStats = () => apiClient.getDashboardStats();

export default apiClient;
