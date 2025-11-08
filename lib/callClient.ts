/**
 * Real-time call client for Aurray
 * Connects to the RT-Gateway WebSocket for live audio conversations
 */
import { v4 as uuidv4 } from 'uuid';
import type { MeetingContext } from '@/types';

export interface CallMessage {
  type: 'user_speech' | 'ai_response' | 'system_message' | 'audio_data' | 'tts_audio';
  content: string;
  timestamp: Date;
  conversationId: string;
  audioData?: ArrayBuffer;
  audioFormat?: string;
}

export interface CallStatus {
  isConnected: boolean;
  isCallActive: boolean;
  conversationId: string | null;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export type CallEventHandler = (message: CallMessage) => void;
export type StatusEventHandler = (status: CallStatus) => void;

class CallClient {
  private ws: WebSocket | null = null;
  private conversationId: string | null = null;
  private isConnected = false;
  private isCallActive = false;
  private connectionState: CallStatus['connectionState'] = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimeout?: NodeJS.Timeout;
  private pingInterval?: NodeJS.Timeout;
  private audioInputWs: WebSocket | null = null;
  private audioOutputWs: WebSocket | null = null;
  private sessionId: string | null = null;
  private currentContext: MeetingContext | null = null;
  private isDisconnecting = false;

  // Event handlers
  private messageHandlers: CallEventHandler[] = [];
  private statusHandlers: StatusEventHandler[] = [];

  // Unified service WebSocket URL (convert HTTP to WebSocket protocol)
  // Note: WebSockets can't be proxied like HTTP requests, so we need the backend URL
  // For production HTTPS sites, backend should support WSS (WebSocket Secure)
  private get wsUrl(): string {
    // Use environment variable or default to the backend IP
    // In production, this should be set to the backend WebSocket endpoint
    const backendWsUrl = process.env.NEXT_PUBLIC_WS_URL 
      || process.env.NEXT_PUBLIC_RT_GATEWAY_URL 
      || 'ws://3.235.168.161:8000';
    
    // If NEXT_PUBLIC_API_URL is a relative path, construct WebSocket URL from backend
    let wsBaseUrl = backendWsUrl;
    if (backendWsUrl.startsWith('/')) {
      // If it's a relative path, we can't use it for WebSocket - use default backend
      wsBaseUrl = 'ws://3.235.168.161:8000';
    } else {
      // Convert HTTP/HTTPS to WS/WSS
      wsBaseUrl = backendWsUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
    }
    
    const url = this.conversationId 
      ? `${wsBaseUrl}/ws/${this.conversationId}`
      : `${wsBaseUrl}/ws/temp-${Date.now()}`;
    console.log('WebSocket URL:', url);
    return url;
  }
  
  private get gatewayBaseUrl(): string {
    const httpBase = this.httpBaseUrl;
    const parsed = new URL(httpBase);
    const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${parsed.host}`;
  }
  
  // Unified service HTTP URL - use relative path /api for Next.js rewrites
  private get httpBaseUrl(): string {
    const envUrl =
      process.env.NEXT_PUBLIC_RT_GATEWAY_HTTP_URL ||
      process.env.NEXT_PUBLIC_API_ORIGIN ||
      process.env.NEXT_PUBLIC_API_URL ||
      '';

    if (envUrl && /^https?:\/\//i.test(envUrl)) {
      return envUrl.replace(/\/$/, '');
    }
    return 'http://localhost:8000';
  }

  private get conversationsBaseUrl(): string {
    return `${this.httpBaseUrl}/conversations`;
  }

  // Public methods
  async startCall(context?: MeetingContext): Promise<{
    conversationId: string;
    meetingId?: string;
    meetingUrl?: string;
    meetingUiUrl?: string;
  }> {
    if (this.isCallActive) {
      throw new Error('Call is already active');
    }

    this.currentContext = context ?? null;

    let callResult: {
      conversationId: string;
      meetingId?: string;
      meetingUrl?: string;
      meetingUiUrl?: string;
    } = { conversationId: '' };

    // Start conversation on backend first to get the real conversation ID
    try {
      const tempConversationId = uuidv4();
      const response = await fetch(`${this.conversationsBaseUrl}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: `room-${tempConversationId}`,
          user_id: tempConversationId,
          ...(context?.id ? { context_id: context.id } : {}),
          meeting_platform: 'clerk',
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }
      
      const data = await response.json();
      this.conversationId = data.conversation_id; // Use the backend-generated conversation ID
      console.log('Backend conversation ID:', this.conversationId);
      callResult = {
        conversationId: this.conversationId,
        meetingId: data.meeting_id,
        meetingUrl: data.meeting_url,
        meetingUiUrl: data.meeting_ui_url || data.meeting_url,
      };
    } catch (error) {
      console.error('Failed to start conversation on backend:', error);
      // Fallback to generating our own ID
      this.conversationId = uuidv4();
      callResult = { conversationId: this.conversationId };
    }

    const sessionId = callResult.meetingId || callResult.conversationId || this.conversationId;
    if (!sessionId) {
      throw new Error('Unable to determine session identifier for call');
    }

    this.sessionId = sessionId;
    this.isCallActive = true;
    this.updateStatus();

    try {
      await this.connectBotSockets(sessionId, this.currentContext ?? undefined);
    } catch (error) {
      console.error('Failed to connect bot sockets:', error);
      this.isCallActive = false;
      this.cleanupAudioSockets();
      throw error;
    }

    if (!callResult.conversationId && this.conversationId) {
      callResult.conversationId = this.conversationId;
    }
    return callResult;
  }

  async endCall(): Promise<void> {
    // Stop ping interval first
    this.stopPingInterval();
    
    // Call the backend endpoint first to properly end the conversation
    if (this.conversationId) {
      try {
        const response = await fetch(`${this.conversationsBaseUrl}/${this.conversationId}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to end conversation: ${response.status}`);
        }
        
        console.log('Conversation ended on backend:', this.conversationId);
      } catch (error) {
        console.error('Failed to end conversation on backend:', error);
        // Continue with frontend cleanup even if backend call fails
      }
    }
    
    // Clean up frontend state
    this.isCallActive = false;
    this.disconnect();
    this.conversationId = null;
    this.sessionId = null;
    this.currentContext = null;
    this.updateStatus();
  }

  async joinCall(conversationId: string): Promise<void> {
    if (this.isCallActive) {
      throw new Error('Call is already active');
    }

    try {
      const userId = uuidv4();
      
      // Join existing conversation on backend
      const response = await fetch(`${this.conversationsBaseUrl}/${conversationId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to join conversation');
      }
      
      const data = await response.json();
      this.conversationId = data.conversation_id;
      console.log('Joined conversation:', this.conversationId);
      
      this.sessionId = this.conversationId;
      this.isCallActive = true;
      this.updateStatus();
      await this.connectBotSockets(this.sessionId, this.currentContext ?? undefined);
      console.log('Successfully joined call');
      
    } catch (error) {
      console.error('Failed to join call:', error);
      throw error;
    }
  }

  async deleteCall(): Promise<void> {
    // Call the backend endpoint to delete the conversation and all related data
    if (this.conversationId) {
      try {
        const response = await fetch(`${this.conversationsBaseUrl}/${this.conversationId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete conversation: ${response.status}`);
        }
        
        console.log('Conversation deleted on backend:', this.conversationId);
      } catch (error) {
        console.error('Failed to delete conversation on backend:', error);
        // Continue with frontend cleanup even if backend call fails
      }
    }
    
    // Clean up frontend state
    this.isCallActive = false;
    this.disconnect();
    this.conversationId = null;
    this.sessionId = null;
    this.currentContext = null;
    this.updateStatus();
  }

  async sendMessage(content: string): Promise<void> {
    if (!this.isCallActive || !this.audioInputWs || this.audioInputWs.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to call');
    }

    // Send structured message to RT-Gateway
    this.audioInputWs.send(
      JSON.stringify({
        type: 'text',
        content,
      }),
    );

    // Emit user message event
    this.emitMessage({
      type: 'user_speech',
      content,
      timestamp: new Date(),
      conversationId: this.sessionId || this.conversationId || '',
    });
  }

  // Audio streaming methods
  async sendAudioChunk(audioChunk: ArrayBuffer, format: string = 'audio/webm'): Promise<void> {
    if (!this.isCallActive || !this.audioInputWs || this.audioInputWs.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to call');
    }

    // Send binary audio data to RT-Gateway
    this.audioInputWs.send(audioChunk);

    // Emit audio data event for debugging
    this.emitMessage({
      type: 'audio_data',
      content: `Audio chunk: ${audioChunk.byteLength} bytes`,
      timestamp: new Date(),
      conversationId: this.sessionId || this.conversationId || '',
      audioData: audioChunk,
      audioFormat: format,
    });
  }

  // Connection management
  private async connect(): Promise<void> {
    if (!this.sessionId) {
      throw new Error('Session not initialized');
    }
    await this.connectBotSockets(this.sessionId, this.currentContext ?? undefined);
  }

  private disconnect(): void {
    this.isDisconnecting = true;
    this.stopPingInterval();
    this.cleanupAudioSockets();
    this.ws = null;
    this.audioInputWs = null;
    this.audioOutputWs = null;
    this.isConnected = false;
    this.connectionState = 'disconnected';
    this.updateStatus();
    this.isDisconnecting = false;
  }

  private startPingInterval(): void {
    this.stopPingInterval(); // Clear any existing interval
    this.pingInterval = setInterval(() => {
      const socket = this.audioOutputWs || this.ws;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send('ping');
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('Connected to Aurray');
      this.isConnected = true;
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.updateStatus();

      // Start ping interval for keepalive
      this.startPingInterval();

      // Send initial system message
      this.emitMessage({
        type: 'system_message',
        content: 'Connected to Aurray. How can I help you today?',
        timestamp: new Date(),
        conversationId: this.conversationId!,
      });
    };

    this.ws.onclose = (event) => {
      console.log('Disconnected from Aurray:', event.code, event.reason);
      this.isConnected = false;
      this.connectionState = 'disconnected';
      this.updateStatus();

      // Stop ping interval
      this.stopPingInterval();

      // If call was active and this wasn't a manual disconnect, end the conversation
      if (this.isCallActive && this.conversationId && event.code !== 1000) {
        console.log('WebSocket closed unexpectedly, ending conversation on backend');
        this.endCallOnBackend();
      }

      if (this.isCallActive && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.connectionState = 'error';
      this.updateStatus();
    };

    this.ws.onmessage = (event) => {
      try {
        // Handle text responses from AI
        if (typeof event.data === 'string') {
          // Handle pong response for keepalive
          if (event.data === 'pong') {
            return; // Don't emit pong as a message
          }
          
          // Try to parse as JSON for structured messages (participant events)
          try {
            const parsedMessage = JSON.parse(event.data);
            if (parsedMessage.type) {
              // Handle structured messages (participant events)
              this.emitMessage({
                type: parsedMessage.type as any,
                content: JSON.stringify(parsedMessage),
                timestamp: new Date(),
                conversationId: this.conversationId!,
              });
              return;
            }
          } catch (e) {
            // Not JSON, continue with regular text handling
          }
          
          this.emitMessage({
            type: 'ai_response',
            content: event.data,
            timestamp: new Date(),
            conversationId: this.conversationId!,
          });
        }
        // Handle binary audio data (TTS responses)
        else if (event.data instanceof ArrayBuffer) {
          this.emitMessage({
            type: 'tts_audio',
            content: `TTS audio: ${event.data.byteLength} bytes`,
            timestamp: new Date(),
            conversationId: this.conversationId!,
            audioData: event.data,
            audioFormat: 'audio/mp3',
          });
        }
        // Handle Blob data (alternative binary format)
        else if (event.data instanceof Blob) {
          event.data.arrayBuffer().then(buffer => {
            this.emitMessage({
              type: 'tts_audio',
              content: `TTS audio: ${buffer.byteLength} bytes`,
              timestamp: new Date(),
              conversationId: this.conversationId!,
              audioData: buffer,
              audioFormat: event.data.type || 'audio/mp3',
            });
          });
        }
      } catch (error) {
        console.error('Failed to process message:', error);
      }
    };
  }

  private async connectBotSockets(sessionId: string, context?: MeetingContext): Promise<void> {
    const baseUrl = this.gatewayBaseUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');

    this.cleanupAudioSockets();

    const outputWs = new WebSocket(`${baseUrl}/ws/bot_audio_output/${sessionId}`);
    this.setupAudioOutputListeners(outputWs, sessionId);

    await new Promise<void>((resolve, reject) => {
      const handleOpen = () => {
        outputWs.removeEventListener('open', handleOpen);
        outputWs.removeEventListener('error', handleError);
        resolve();
      };
      const handleError = (event: Event) => {
        outputWs.removeEventListener('open', handleOpen);
        outputWs.removeEventListener('error', handleError);
        reject(new Error(`Failed to connect audio output socket: ${(event as ErrorEvent).message}`));
      };
      outputWs.addEventListener('open', handleOpen);
      outputWs.addEventListener('error', handleError);
    });

    this.audioOutputWs = outputWs;
    this.ws = outputWs;
    this.isConnected = true;
    this.connectionState = 'connected';
    this.reconnectAttempts = 0;
    this.updateStatus();
    this.startPingInterval();

    const registrationMessage = {
      type: 'bot_registration',
      sessionId,
      meetingId: sessionId,
      botName: context?.name ?? 'Web Client',
      platform: 'clerk',
      audioConfig: {
        sampleRate: 16000,
        channels: 1,
      },
    };

    try {
      outputWs.send(JSON.stringify(registrationMessage));
    } catch (error) {
      console.error('Failed to send registration message', error);
    }

    this.emitMessage({
      type: 'system_message',
      content: 'Connected to Aurray. How can I help you today?',
      timestamp: new Date(),
      conversationId: sessionId,
    });

    const inputWs = new WebSocket(`${baseUrl}/ws/bot_audio_input/${sessionId}`);
    this.setupAudioInputListeners(inputWs);

    await new Promise<void>((resolve, reject) => {
      const handleOpen = () => {
        inputWs.removeEventListener('open', handleOpen);
        inputWs.removeEventListener('error', handleError);
        resolve();
      };
      const handleError = (event: Event) => {
        inputWs.removeEventListener('open', handleOpen);
        inputWs.removeEventListener('error', handleError);
        reject(new Error(`Failed to connect audio input socket: ${(event as ErrorEvent).message}`));
      };
      inputWs.addEventListener('open', handleOpen);
      inputWs.addEventListener('error', handleError);
    });

    this.audioInputWs = inputWs;
  }

  private setupAudioOutputListeners(ws: WebSocket, sessionId: string): void {
    ws.addEventListener('close', (event) => {
      console.log('Audio output stream closed', event.code, event.reason);
      if (this.audioOutputWs === ws) {
        this.audioOutputWs = null;
      }
      if (this.ws === ws) {
        this.ws = null;
      }
      if (!this.isDisconnecting) {
        this.isConnected = false;
        this.connectionState = 'disconnected';
        this.updateStatus();
        this.stopPingInterval();
        if (this.isCallActive && this.sessionId) {
          this.scheduleReconnect();
        }
      }
    });

    ws.addEventListener('error', (event) => {
      console.error('Audio output stream error', event);
      this.connectionState = 'error';
      this.updateStatus();
    });

    ws.addEventListener('message', (event) => {
      try {
        if (typeof event.data === 'string') {
          if (event.data === 'pong') {
            return;
          }
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'ai_response' && typeof parsed.content === 'string') {
              this.emitMessage({
                type: 'ai_response',
                content: parsed.content,
                timestamp: new Date(),
                conversationId: sessionId,
              });
              return;
            }
            if (parsed.type === 'transcription' && typeof parsed.content === 'string') {
              this.emitMessage({
                type: 'user_speech',
                content: parsed.content,
                timestamp: new Date(),
                conversationId: sessionId,
              });
              return;
            }
            if (parsed.type === 'tts_complete') {
              this.emitMessage({
                type: 'system_message',
                content: 'Playback complete.',
                timestamp: new Date(),
                conversationId: sessionId,
              });
              return;
            }
          } catch {
            this.emitMessage({
              type: 'ai_response',
              content: event.data,
              timestamp: new Date(),
              conversationId: sessionId,
            });
            return;
          }
        } else if (event.data instanceof ArrayBuffer) {
          this.emitMessage({
            type: 'tts_audio',
            content: `TTS audio: ${event.data.byteLength} bytes`,
            timestamp: new Date(),
            conversationId: sessionId,
            audioData: event.data,
            audioFormat: 'audio/wav',
          });
        } else if (event.data instanceof Blob) {
          event.data.arrayBuffer().then((buffer) => {
            this.emitMessage({
              type: 'tts_audio',
              content: `TTS audio: ${buffer.byteLength} bytes`,
              timestamp: new Date(),
              conversationId: sessionId,
              audioData: buffer,
              audioFormat: event.data.type || 'audio/wav',
            });
          });
        }
      } catch (error) {
        console.error('Failed to process audio output message', error);
      }
    });
  }

  private setupAudioInputListeners(ws: WebSocket): void {
    ws.addEventListener('open', () => {
      console.log('Connected to bot audio input stream');
      ws.send(JSON.stringify({ type: 'connected' }));
    });

    ws.addEventListener('error', (event) => {
      console.error('Audio input stream error', event);
    });

    ws.addEventListener('close', () => {
      console.log('Audio input stream closed');
      if (this.audioInputWs === ws) {
        this.audioInputWs = null;
      }
      if (!this.isDisconnecting && this.isCallActive && this.sessionId) {
        this.scheduleReconnect();
      }
    });
  }

  private cleanupAudioSockets(): void {
    if (this.audioInputWs) {
      try {
        this.audioInputWs.close();
      } catch (error) {
        console.warn('Failed to close audio input socket', error);
      }
      this.audioInputWs = null;
    }

    if (this.audioOutputWs) {
      try {
        this.audioOutputWs.close();
      } catch (error) {
        console.warn('Failed to close audio output socket', error);
      }
      if (this.ws === this.audioOutputWs) {
        this.ws = null;
      }
      this.audioOutputWs = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.isCallActive && this.sessionId) {
        this.connectBotSockets(this.sessionId, this.currentContext ?? undefined).catch((error) => {
          console.error('Reconnect failed:', error);
        });
      }
    }, delay);
  }

  private async endCallOnBackend(): Promise<void> {
    if (!this.conversationId) return;
    
    try {
      const response = await fetch(`${this.conversationsBaseUrl}/${this.conversationId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to end conversation: ${response.status}`);
      }
      
      console.log('Conversation ended on backend due to disconnect:', this.conversationId);
    } catch (error) {
      console.error('Failed to end conversation on backend after disconnect:', error);
    }
  }

  // Event handling
  private emitMessage(message: CallMessage): void {
    this.messageHandlers.forEach(handler => handler(message));
  }

  private updateStatus(): void {
    const status: CallStatus = {
      isConnected: this.isConnected,
      isCallActive: this.isCallActive,
      conversationId: this.conversationId,
      connectionState: this.connectionState,
    };
    
    this.statusHandlers.forEach(handler => handler(status));
  }

  // Event subscription
  onMessage(handler: CallEventHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  onStatusChange(handler: StatusEventHandler): () => void {
    this.statusHandlers.push(handler);
    return () => {
      const index = this.statusHandlers.indexOf(handler);
      if (index > -1) {
        this.statusHandlers.splice(index, 1);
      }
    };
  }

  // Generic event handling methods for participant events
  on(event: string, handler: CallEventHandler): void {
    this.messageHandlers.push(handler);
  }

  off(event: string, handler: CallEventHandler): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  // Static method to delete any conversation by ID
  static async deleteConversation(conversationId: string): Promise<void> {
    try {
      const response = await fetch(`/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.status}`);
      }
      
      console.log('Conversation deleted:', conversationId);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }

  // Static method to bulk delete multiple conversations
  static async bulkDeleteConversations(conversationIds: string[]): Promise<{
    deleted_count: number;
    total_requested: number;
    failed_deletions: Array<{conversation_id: string; error: string}>;
  }> {
    try {
      const response = await fetch(`/conversations/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_ids: conversationIds })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to bulk delete conversations: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Bulk delete completed: ${result.deleted_count}/${result.total_requested} conversations deleted`);
      
      if (result.failed_deletions.length > 0) {
        console.warn('Some conversations failed to delete:', result.failed_deletions);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to bulk delete conversations:', error);
      throw error;
    }
  }

  // Getters
  get currentStatus(): CallStatus {
    return {
      isConnected: this.isConnected,
      isCallActive: this.isCallActive,
      conversationId: this.conversationId,
      connectionState: this.connectionState,
    };
  }

  get currentConversationId(): string | null {
    return this.conversationId;
  }

  get currentSessionId(): string | null {
    return this.sessionId;
  }

  // Audio streaming removed - we only use text communication
}

// Export the class for static methods
export { CallClient };

// Create and export singleton instance
export const callClient = new CallClient();
export default callClient;
