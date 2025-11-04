import axiosInstance from './axios';
import Axios from 'axios';
import {
  Action,
  Room,
  RoomCreate,
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
  ApiKey,
  JoinMeetingRequest,
  JoinMeetingResponse,
} from '@/types';

class ApiClient {
  // Use the authenticated axios instance from axios.ts
  // It automatically adds the access token to all requests
  private get client() {
    return axiosInstance;
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

  // Actions
  async getActions(filters?: ActionFilters): Promise<Action[]> {
    const response = await this.client.get('/actions', {
      params: filters,
    });
    return response.data;
  }

  async getAction(id: string): Promise<Action> {
    const response = await this.client.get(`/actions/${id}`);
    return response.data;
  }

  async updateAction(
    id: string,
    status: string,
    result?: Record<string, any>,
    error_message?: string
  ): Promise<Action> {
    const response = await this.client.put(`/actions/${id}`, {
      status,
      result,
      error_message,
    });
    return response.data;
  }


  // Rooms
  async getRooms(): Promise<Room[]> {
    const response = await this.client.get('/rooms');
    return response.data;
  }

  async getRoom(id: string): Promise<Room> {
    const response = await this.client.get(`/rooms/${id}`);
    return response.data;
  }

  async createRoom(data: RoomCreate): Promise<Room> {
    const response = await this.client.post('/rooms', data);
    return response.data;
  }

  async updateRoomParticipants(
    roomId: string,
    participantCount: number
  ): Promise<Room> {
    const response = await this.client.put(`/rooms/${roomId}/participants`, {
      participant_count: participantCount,
    });
    return response.data;
  }

  async deleteRoom(id: string): Promise<void> {
    await this.client.delete(`/rooms/${id}`);
  }

  // Meeting Agent API Methods
  async getMeetings(filters?: MeetingFilters): Promise<Meeting[]> {
    const response = await this.client.get('/meetings', {
      params: filters,
    });
    return response.data;
  }

  async getMeeting(id: string): Promise<Meeting> {
    const response = await this.client.get(`/meetings/${id}`);
    return response.data;
  }

  async getMeetingSummary(id: string): Promise<MeetingSummary> {
    const response = await this.client.get(`/meetings/${id}/summary`);
    return response.data;
  }

  async getMeetingSummaries(limit = 50, offset = 0): Promise<MeetingSummary[]> {
    const response = await this.client.get('/meetings/summaries', {
      params: { limit, offset },
    });
    return response.data;
  }

  async joinMeeting(id: string): Promise<MeetingJoinResponse> {
    const response = await this.client.post(`/meetings/${id}/join`);
    return response.data;
  }

  async leaveMeeting(id: string): Promise<void> {
    await this.client.post(`/meetings/${id}/leave`);
  }

  async getActiveMeetings(): Promise<Meeting[]> {
    const response = await this.client.get('/meetings/active');
    return response.data;
  }

  async sendMeetingNotification(
    id: string,
    notificationType: 'summary' | 'action_items' | 'reminder'
  ): Promise<void> {
    await this.client.post(`/meetings/${id}/notify`, {
      notification_type: notificationType,
    });
  }

  async getMeetingParticipants(id: string): Promise<{
    meeting_id: string;
    participants: any[];
    total_count: number;
  }> {
    const response = await this.client.get(`/meetings/${id}/participants`);
    return response.data;
  }

  async getMeetingTranscription(id: string): Promise<{
    meeting_id: string;
    transcription: string;
    chunks: string[];
    chunk_count: number;
  }> {
    const response = await this.client.get(`/meetings/${id}/transcription`);
    return response.data;
  }

  async getMeetingActionItems(id: string): Promise<ActionItem[]> {
    const response = await this.client.get(`/meetings/${id}/action-items`);
    return response.data;
  }

  async updateActionItem(
    meetingId: string,
    actionItemId: string,
    status: string
  ): Promise<void> {
    await this.client.put(`/meetings/${meetingId}/action-items/${actionItemId}`, {
      status,
    });
  }

  async getMeetingConfig(): Promise<MeetingConfig> {
    const response = await this.client.get('/meetings/config');
    return response.data;
  }

  async updateMeetingConfig(config: MeetingConfig): Promise<MeetingConfig> {
    const response = await this.client.put('/meetings/config', config);
    return response.data;
  }

  async getMeetingAgentStatus(): Promise<MeetingAgentStatus> {
    const response = await this.client.get('/meetings/status');
    return response.data;
  }

  async startMeetingScheduler(): Promise<void> {
    await this.client.post('/meetings/start-scheduler');
  }

  async stopMeetingScheduler(): Promise<void> {
    await this.client.post('/meetings/stop-scheduler');
  }

  async bulkDeleteMeetings(meetingIds: string[]): Promise<{
    success: boolean;
    deleted_count: number;
    total_requested: number;
    failed_deletions: Array<{ meeting_id: string; error: string }>;
  }> {
    const response = await this.client.delete('/meetings/bulk', {
      data: meetingIds,
    });
    return response.data;
  }

  // Dashboard Stats (mock for now - would be implemented in backend)
  async getDashboardStats(): Promise<{
    total_actions: number;
    pending_actions: number;
    completed_actions: number;
    failed_actions: number;
    active_rooms: number;
  }> {
    // This would be a real endpoint in production
    const [actions, rooms] = await Promise.all([
      this.getActions(),
      this.getRooms(),
    ]);

    const pendingActions = actions.filter(a => a.status === 'pending').length;
    const completedActions = actions.filter(a => a.status === 'completed').length;
    const failedActions = actions.filter(a => a.status === 'failed').length;
    const activeRooms = rooms.filter(r => r.is_active).length;

    return {
      total_actions: actions.length,
      pending_actions: pendingActions,
      completed_actions: completedActions,
      failed_actions: failedActions,
      active_rooms: activeRooms,
    };
  }

  // API Keys
  async getApiKeys(): Promise<ApiKey[]> {
    const response = await this.client.get('/api-keys');
    return response.data;
  }

  async getApiKey(id: string): Promise<ApiKey> {
    const response = await this.client.get(`/api-keys/${id}`);
    return response.data;
  }

  async createApiKey(data: {
    name: string;
    expires_in_days?: number;
    scopes?: string[];
  }): Promise<ApiKey> {
    const response = await this.client.post('/api-keys', data);
    return response.data;
  }

  async updateApiKey(id: string, data: {
    name?: string;
    status?: string;
  }): Promise<ApiKey> {
    const response = await this.client.put(`/api-keys/${id}`, data);
    return response.data;
  }

  async deleteApiKey(id: string): Promise<void> {
    await this.client.delete(`/api-keys/${id}`);
  }

  // Webhooks
  async testJoinMeetingWebhook(data: {
    meeting_url: string;
    type: string;
    transcript: boolean;
    audio_record: boolean;
    video_record: boolean;
    voice_id: string;
    bot_name: string;
  }, apiKey?: string): Promise<JoinMeetingResponse> {
    // Webhook endpoints are at /v1/api.auray.net (not /api/v1)
    // This endpoint is not under /api/v1, so we need to use absolute URL
    // Since NEXT_PUBLIC_API_URL is now '/api', use hardcoded backend URL for webhooks
    // TODO: Consider adding a Next.js rewrite rule for /v1/* if needed
    const backendBaseUrl = 'http://3.235.168.161:8000';
    const webhookUrl = `${backendBaseUrl}/v1/api.auray.net/join_meeting`;
    
    // Use API key if provided, otherwise fall back to access token
    const authHeader = apiKey 
      ? { Authorization: `Bearer ${apiKey}` }
      : (typeof window !== 'undefined' && localStorage.getItem('clerk_access_token') 
          ? { Authorization: `Bearer ${localStorage.getItem('clerk_access_token')}` }
          : {});
    
    const response = await Axios.post(webhookUrl, data, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
      },
      timeout: 60000,
    });
    return response.data;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export convenience functions for pages
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
