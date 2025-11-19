import axiosInstance, { API_BASE_URL, API_ORIGIN, API_PREFIX } from './axios';
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
  MeetingContext,
  MeetingContextCreate,
} from '@/types';

class ApiClient {
  // Use the authenticated axios instance from axios.ts
  // It automatically adds the access token to all requests
  private get client() {
    return axiosInstance;
  }

  private withPrefix(path: string): string {
    return `${API_PREFIX}${path}`;
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get(this.withPrefix('/health'));
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Actions
  async getActions(filters?: ActionFilters): Promise<Action[]> {
    const response = await this.client.get(this.withPrefix('/actions'), {
      params: filters,
    });
    return response.data;
  }

  async getAction(id: string): Promise<Action> {
    const response = await this.client.get(this.withPrefix(`/actions/${id}`));
    return response.data;
  }

  async updateAction(
    id: string,
    status: string,
    result?: Record<string, any>,
    error_message?: string
  ): Promise<Action> {
    const response = await this.client.put(this.withPrefix(`/actions/${id}`), {
      status,
      result,
      error_message,
    });
    return response.data;
  }


  // Rooms
  async getRooms(): Promise<Room[]> {
    const response = await this.client.get(this.withPrefix('/rooms'));
    return response.data;
  }

  async getRoom(id: string): Promise<Room> {
    const response = await this.client.get(this.withPrefix(`/rooms/${id}`));
    return response.data;
  }

  async createRoom(data: RoomCreate): Promise<Room> {
    const response = await this.client.post(this.withPrefix('/rooms'), data);
    return response.data;
  }

  async updateRoomParticipants(
    roomId: string,
    participantCount: number
  ): Promise<Room> {
    const response = await this.client.put(this.withPrefix(`/rooms/${roomId}/participants`), {
      participant_count: participantCount,
    });
    return response.data;
  }

  async deleteRoom(id: string): Promise<void> {
    await this.client.delete(this.withPrefix(`/rooms/${id}`));
  }

  // Meeting Agent API Methods
  async getMeetings(filters?: MeetingFilters): Promise<Meeting[]> {
    const response = await this.client.get(this.withPrefix('/meetings'), {
      params: filters,
    });
    return response.data;
  }

  async getMeeting(id: string): Promise<Meeting> {
    const response = await this.client.get(this.withPrefix(`/meetings/${id}`));
    return response.data;
  }

  async getMeetingSummary(id: string): Promise<MeetingSummary> {
    const response = await this.client.get(this.withPrefix(`/meetings/${id}/summary`));
    return response.data;
  }

  async getMeetingSummaries(limit = 50, offset = 0): Promise<MeetingSummary[]> {
    const response = await this.client.get(this.withPrefix('/meetings/summaries'), {
      params: { limit, offset },
    });
    return response.data;
  }

  async joinMeeting(id: string): Promise<MeetingJoinResponse> {
    const response = await this.client.post(this.withPrefix(`/meetings/${id}/join`));
    return response.data;
  }

  async startMeeting(id: string): Promise<{
    conversation_id: string;
    meeting_id: string;
    meeting_ui_url: string | null;
    status: string;
  }> {
    const response = await this.client.post(this.withPrefix(`/meetings/${id}/start`));
    return response.data;
  }

  async leaveMeeting(id: string): Promise<void> {
    await this.client.post(this.withPrefix(`/meetings/${id}/leave`));
  }

  async botLeft(meetingId: string, sessionId: string, reason?: string): Promise<void> {
    await this.client.post(this.withPrefix(`/meetings/${meetingId}/bot-left`), {
      sessionId,
      reason: reason || 'user_left',
      timestamp: new Date().toISOString(),
    });
  }

  async getActiveMeetings(): Promise<Meeting[]> {
    const response = await this.client.get(this.withPrefix('/meetings/active'));
    return response.data;
  }

  async sendMeetingNotification(
    id: string,
    notificationType: 'summary' | 'action_items' | 'reminder'
  ): Promise<void> {
    await this.client.post(this.withPrefix(`/meetings/${id}/notify`), {
      notification_type: notificationType,
    });
  }

  async getMeetingParticipants(id: string): Promise<{
    meeting_id: string;
    participants: any[];
    total_count: number;
  }> {
    const response = await this.client.get(this.withPrefix(`/meetings/${id}/participants`));
    return response.data;
  }

  async getMeetingTranscription(id: string): Promise<{
    meeting_id: string;
    transcription: string;
    chunks: string[];
    chunk_count: number;
  }> {
    const response = await this.client.get(this.withPrefix(`/meetings/${id}/transcription`));
    return response.data;
  }

  async getMeetingActionItems(id: string): Promise<ActionItem[]> {
    const response = await this.client.get(this.withPrefix(`/meetings/${id}/action-items`));
    return response.data;
  }

  async updateActionItem(
    meetingId: string,
    actionItemId: string,
    status: string
  ): Promise<void> {
    await this.client.put(this.withPrefix(`/meetings/${meetingId}/action-items/${actionItemId}`), {
      status,
    });
  }

  async getMeetingConfig(): Promise<MeetingConfig> {
    const response = await this.client.get(this.withPrefix('/meetings/config'));
    return response.data;
  }

  async updateMeetingConfig(config: MeetingConfig): Promise<MeetingConfig> {
    const response = await this.client.put(this.withPrefix('/meetings/config'), config);
    return response.data;
  }

  async getMeetingAgentStatus(): Promise<MeetingAgentStatus> {
    const response = await this.client.get(this.withPrefix('/meetings/status'));
    return response.data;
  }

  async startMeetingScheduler(): Promise<void> {
    await this.client.post(this.withPrefix('/meetings/start-scheduler'));
  }

  async stopMeetingScheduler(): Promise<void> {
    await this.client.post(this.withPrefix('/meetings/stop-scheduler'));
  }

  async bulkDeleteMeetings(meetingIds: string[]): Promise<{
    success: boolean;
    deleted_count: number;
    total_requested: number;
    failed_deletions: Array<{ meeting_id: string; error: string }>;
  }> {
    const response = await this.client.delete(this.withPrefix('/meetings/bulk'), {
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
    const response = await this.client.get(this.withPrefix('/api-keys'));
    return response.data;
  }

  async getApiKey(id: string): Promise<ApiKey> {
    const response = await this.client.get(this.withPrefix(`/api-keys/${id}`));
    return response.data;
  }

  async createApiKey(data: {
    name: string;
    expires_in_days?: number;
    scopes?: string[];
  }): Promise<ApiKey> {
    const response = await this.client.post(this.withPrefix('/api-keys'), data);
    return response.data;
  }

  async updateApiKey(id: string, data: {
    name?: string;
    status?: string;
  }): Promise<ApiKey> {
    const response = await this.client.put(this.withPrefix(`/api-keys/${id}`), data);
    return response.data;
  }

  async deleteApiKey(id: string): Promise<void> {
    await this.client.delete(this.withPrefix(`/api-keys/${id}`));
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
    const prefixPattern = API_PREFIX
      ? new RegExp(`${API_PREFIX.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i')
      : null;
    const origin = API_ORIGIN || (prefixPattern ? API_BASE_URL.replace(prefixPattern, '') : API_BASE_URL);
    const webhookUrl = `${origin}/v1/api.aurray.net/join_meeting`;
    
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

  // Integrations
  async getIntegrations(): Promise<any[]> {
    const response = await this.client.get(this.withPrefix('/integrations'));
    return response.data;
  }

  async getIntegration(integrationId: string): Promise<any> {
    const response = await this.client.get(this.withPrefix(`/integrations/${integrationId}`));
    return response.data;
  }

  async getConnectedIntegrations(): Promise<any[]> {
    const response = await this.client.get(this.withPrefix('/integrations/connected'));
    return response.data;
  }

  async getIntegrationOAuthUrl(integrationId: string): Promise<{ oauth_url: string; state: string }> {
    const response = await this.client.get(this.withPrefix(`/integrations/${integrationId}/oauth/authorize`));
    return response.data;
  }

  async disconnectIntegration(integrationId: string): Promise<void> {
    await this.client.post(this.withPrefix(`/integrations/${integrationId}/disconnect`));
  }

  async getIntegrationStatus(integrationId: string): Promise<any> {
    const response = await this.client.get(this.withPrefix(`/integrations/${integrationId}/status`));
    return response.data;
  }

  // Google Workspace Services
  async getGoogleWorkspaceServices(): Promise<Array<{ service: string; enabled: boolean; connected: boolean }>> {
    const response = await this.client.get(this.withPrefix('/integrations/google_workspace/services'));
    return response.data;
  }

  async connectGoogleWorkspaceService(serviceName: string): Promise<{ success: boolean; service: string; message: string }> {
    const response = await this.client.post(this.withPrefix(`/integrations/google_workspace/services/${serviceName}/connect`));
    return response.data;
  }

  async disconnectGoogleWorkspaceService(serviceName: string): Promise<{ success: boolean; service: string; message: string }> {
    const response = await this.client.post(this.withPrefix(`/integrations/google_workspace/services/${serviceName}/disconnect`));
    return response.data;
  }

  async getIntegrationOAuthUrlWithServices(integrationId: string, services?: string[]): Promise<{ oauth_url: string; state: string }> {
    const servicesParam = services && services.length > 0 ? services.join(',') : undefined;
    const response = await this.client.get(this.withPrefix(`/integrations/${integrationId}/oauth/authorize`), {
      params: servicesParam ? { services: servicesParam } : {},
    });
    return response.data;
  }

  // Meeting Contexts
  async getMeetingContexts(): Promise<MeetingContext[]> {
    const response = await this.client.get(this.withPrefix('/meeting-contexts'));
    return response.data;
  }

  async getMeetingContext(contextId: string): Promise<MeetingContext> {
    const response = await this.client.get(this.withPrefix(`/meeting-contexts/${contextId}`));
    return response.data;
  }

  async createMeetingContext(data: MeetingContextCreate): Promise<MeetingContext> {
    const response = await this.client.post(this.withPrefix('/meeting-contexts'), data);
    return response.data;
  }

  async updateMeetingContext(contextId: string, data: Partial<MeetingContextCreate>): Promise<MeetingContext> {
    const response = await this.client.put(this.withPrefix(`/meeting-contexts/${contextId}`), data);
    return response.data;
  }

  async deleteMeetingContext(contextId: string): Promise<void> {
    await this.client.delete(this.withPrefix(`/meeting-contexts/${contextId}`));
  }

  // Newsletter/Waiting List
  async signupNewsletter(data: { name: string; email: string; country: string }): Promise<{ success: boolean; message: string; timestamp: string }> {
    // Newsletter endpoint is public, so we use Axios directly without auth
    const response = await axiosInstance.post(this.withPrefix('/newsletter'), data);
    return response.data;
  }

  // User Profile
  async getCurrentUser(): Promise<{
    id: string;
    email: string;
    name: string;
    phone: string | null;
    timezone: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }> {
    const response = await this.client.get(this.withPrefix('/auth/me'));
    return response.data;
  }

  async updateUserProfile(data: {
    name?: string;
    phone?: string;
    timezone?: string;
  }): Promise<{
    id: string;
    email: string;
    name: string;
    phone: string | null;
    timezone: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }> {
    const response = await this.client.put(this.withPrefix('/auth/me'), data);
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
