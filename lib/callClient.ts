/**
 * Real-time call client for AI Receptionist
 * Connects to the RT-Gateway WebSocket for live audio conversations
 */
import { v4 as uuidv4 } from 'uuid';

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

  // Event handlers
  private messageHandlers: CallEventHandler[] = [];
  private statusHandlers: StatusEventHandler[] = [];

  // RT-Gateway WebSocket URL
  private get wsUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_RT_GATEWAY_URL || 'ws://localhost:8001';
    const url = this.conversationId 
      ? `${baseUrl}/ws/${this.conversationId}`
      : `${baseUrl}/ws/temp-${Date.now()}`;
    console.log('WebSocket URL:', url);
    return url;
  }

  // Public methods
  async startCall(): Promise<string> {
    if (this.isCallActive) {
      throw new Error('Call is already active');
    }

    // Start conversation on backend first to get the real conversation ID
    try {
      const tempConversationId = uuidv4();
      const response = await fetch(`${process.env.NEXT_PUBLIC_RT_GATEWAY_URL || 'http://localhost:8001'}/conversations/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: `room-${tempConversationId}`,
          user_id: tempConversationId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }
      
      const data = await response.json();
      this.conversationId = data.conversation_id; // Use the backend-generated conversation ID
      console.log('Backend conversation ID:', this.conversationId);
    } catch (error) {
      console.error('Failed to start conversation on backend:', error);
      // Fallback to generating our own ID
      this.conversationId = uuidv4();
    }

    this.isCallActive = true;
    this.updateStatus();

    await this.connect();
    return this.conversationId!;
  }

  async endCall(): Promise<void> {
    // Stop ping interval first
    this.stopPingInterval();
    
    // Call the backend endpoint first to properly end the conversation
    if (this.conversationId) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_RT_GATEWAY_URL || 'http://localhost:8001'}/conversations/${this.conversationId}/end`, {
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
    this.updateStatus();
  }

  async joinCall(conversationId: string): Promise<void> {
    if (this.isCallActive) {
      throw new Error('Call is already active');
    }

    try {
      const userId = uuidv4();
      
      // Join existing conversation on backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_RT_GATEWAY_URL || 'http://localhost:8001'}/conversations/${conversationId}/join`, {
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
      
      // Connect WebSocket
      await this.connect();
      
      this.isCallActive = true;
      this.updateStatus();
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_RT_GATEWAY_URL || 'http://localhost:8001'}/conversations/${this.conversationId}`, {
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
    this.updateStatus();
  }

  async sendMessage(content: string): Promise<void> {
    if (!this.isConnected || !this.conversationId) {
      throw new Error('Not connected to call');
    }

    // Send message to RT-Gateway
    this.ws?.send(content);

    // Emit user message event
    this.emitMessage({
      type: 'user_speech',
      content,
      timestamp: new Date(),
      conversationId: this.conversationId,
    });
  }

  // Audio streaming methods
  async sendAudioChunk(audioChunk: ArrayBuffer, format: string = 'audio/webm'): Promise<void> {
    if (!this.isConnected || !this.conversationId) {
      throw new Error('Not connected to call');
    }

    // Send binary audio data to RT-Gateway
    this.ws?.send(audioChunk);

    // Emit audio data event for debugging
    this.emitMessage({
      type: 'audio_data',
      content: `Audio chunk: ${audioChunk.byteLength} bytes`,
      timestamp: new Date(),
      conversationId: this.conversationId,
      audioData: audioChunk,
      audioFormat: format,
    });
  }

  // Connection management
  private async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.connectionState = 'connecting';
    this.updateStatus();

    try {
      this.ws = new WebSocket(this.wsUrl);
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.connectionState = 'error';
      this.updateStatus();
      throw error;
    }
  }

  private disconnect(): void {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.connectionState = 'disconnected';
    this.updateStatus();
  }

  private startPingInterval(): void {
    this.stopPingInterval(); // Clear any existing interval
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
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
      console.log('Connected to AI Receptionist');
      this.isConnected = true;
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.updateStatus();

      // Start ping interval for keepalive
      this.startPingInterval();

      // Send initial system message
      this.emitMessage({
        type: 'system_message',
        content: 'Connected to AI Receptionist. How can I help you today?',
        timestamp: new Date(),
        conversationId: this.conversationId!,
      });
    };

    this.ws.onclose = (event) => {
      console.log('Disconnected from AI Receptionist:', event.code, event.reason);
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

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.isCallActive) {
        this.connect();
      }
    }, delay);
  }

  private async endCallOnBackend(): Promise<void> {
    if (!this.conversationId) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_RT_GATEWAY_URL || 'http://localhost:8001'}/conversations/${this.conversationId}/end`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_RT_GATEWAY_URL || 'http://localhost:8001'}/conversations/${conversationId}`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_RT_GATEWAY_URL || 'http://localhost:8001'}/conversations/bulk-delete`, {
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

  // Audio streaming removed - we only use text communication
}

// Export the class for static methods
export { CallClient };

// Create and export singleton instance
export const callClient = new CallClient();
export default callClient;
