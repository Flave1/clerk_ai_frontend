/**
 * Real-time call client for Aurray
 * Connects to the RT-Gateway WebSocket for live audio conversations
 */
import { v4 as uuidv4 } from 'uuid';
import type { MeetingContext } from '@/types';
import axios from '@/lib/axios';

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
  private meetingId: string | null = null;
  private currentContext: MeetingContext | null = null;
  private isDisconnecting = false;
  private isReconnectScheduled = false;
  private readonly defaultSampleRate = 16000;
  private pendingTtsChunks: ArrayBuffer[] = [];
  private pendingTtsFormat: string | null = null;

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
    } | null = null;

    // Start conversation on backend first to get the real conversation ID
    try {
      const tempConversationId = uuidv4();
      const { data } = await axios.post('/conversations/start', {
        room_id: `room-${tempConversationId}`,
        user_id: tempConversationId,
        ...(context?.id ? { context_id: context.id } : {}),
        meeting_platform: 'aurray',
      });
      this.conversationId = data.conversation_id; // Use the backend-generated conversation ID
      this.meetingId = data.meeting_id ?? null;
      console.log('Backend conversation ID:', this.conversationId);
      callResult = {
        conversationId: this.conversationId,
        meetingId: data.meeting_id,
        meetingUrl: data.meeting_url,
        meetingUiUrl: data.meeting_ui_url || data.meeting_url,
      };
    } catch (error) {
      console.error('Failed to start conversation on backend:', error);
      throw error instanceof Error ? error : new Error('Failed to start conversation');
    }

    if (!callResult) {
      throw new Error('Conversation start failed without response.');
    }

    const sessionId = callResult.meetingId || callResult.conversationId || this.conversationId;
    if (!sessionId) {
      throw new Error('Unable to determine session identifier for call');
    }

    this.sessionId = sessionId;
    if (!this.meetingId && callResult.meetingId) {
      this.meetingId = callResult.meetingId;
    }
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

    return callResult;
  }

  async endCall(): Promise<void> {
    // Stop ping interval first
    this.stopPingInterval();
    
    // Call the backend endpoint first to properly end the conversation
    if (this.conversationId) {
      try {
        await axios.post(`/conversations/${this.conversationId}/end`);
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
    this.meetingId = null;
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
      const { data } = await axios.post(`/conversations/${conversationId}/join`, {
        user_id: userId
      });
      this.conversationId = data.conversation_id;
      console.log('Joined conversation:', this.conversationId);
      
      this.sessionId = this.conversationId;
      this.meetingId = null;
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
        await axios.delete(`/conversations/${this.conversationId}`);
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
    this.meetingId = null;
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
        try {
          socket.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error('Failed to send ping message', error);
        }
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
        reject(
          new Error(
            `Failed to connect audio output socket: ${this.describeSocketError(event)}`,
          ),
        );
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
      meetingId: this.meetingId ?? sessionId,
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
        reject(
          new Error(
            `Failed to connect audio input socket: ${this.describeSocketError(event)}`,
          ),
        );
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
      this.pendingTtsChunks = [];
      this.pendingTtsFormat = null;
    });

    ws.addEventListener('error', (event) => {
      console.error('Audio output stream error', event);
      this.connectionState = 'error';
      this.updateStatus();
    });

    const flushPendingTts = () => {
      if (this.pendingTtsChunks.length === 0) {
        return;
      }

      const mergedBuffer = this.mergeAudioChunks(this.pendingTtsChunks);
      this.pendingTtsChunks = [];

      if (mergedBuffer.byteLength === 0) {
        return;
      }

      const { data: normalizedBuffer, format } = this.normalizeAudioBuffer(
        mergedBuffer,
        this.defaultSampleRate,
      );

      this.emitMessage({
        type: 'tts_audio',
        content: `TTS audio: ${normalizedBuffer.byteLength} bytes`,
        timestamp: new Date(),
        conversationId: sessionId,
        audioData: normalizedBuffer,
        audioFormat: format,
      });
    };

    ws.addEventListener('message', (event) => {
      try {
        if (typeof event.data === 'string') {
          if (event.data === 'pong') {
            return;
          }
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'ai_response' && typeof parsed.content === 'string') {
              flushPendingTts();
              this.emitMessage({
                type: 'ai_response',
                content: parsed.content,
                timestamp: new Date(),
                conversationId: sessionId,
              });
              return;
            }
            if (parsed.type === 'transcription' && typeof parsed.content === 'string') {
              flushPendingTts();
              this.emitMessage({
                type: 'user_speech',
                content: parsed.content,
                timestamp: new Date(),
                conversationId: sessionId,
              });
              return;
            }
            if (parsed.type === 'tts_complete') {
              flushPendingTts();
              this.emitMessage({
                type: 'system_message',
                content: 'Playback complete.',
                timestamp: new Date(),
                conversationId: sessionId,
              });
              return;
            }
          } catch {
            flushPendingTts();
            this.emitMessage({
              type: 'ai_response',
              content: event.data,
              timestamp: new Date(),
              conversationId: sessionId,
            });
            return;
          }
        } else if (event.data instanceof ArrayBuffer) {
          this.pendingTtsChunks.push(event.data.slice(0));
        } else if (event.data instanceof Blob) {
          event.data.arrayBuffer().then((buffer) => {
            this.pendingTtsChunks.push(buffer);
          });
        }
      } catch (error) {
        console.error('Failed to process audio output message', error);
      }
    });
  }

  private normalizeAudioBuffer(
    buffer: ArrayBuffer,
    sampleRate: number,
  ): { data: ArrayBuffer; format: string } {
    if (buffer.byteLength >= 4) {
      const headerBytes = new Uint8Array(buffer, 0, 4);
      const header = String.fromCharCode(
        headerBytes[0],
        headerBytes[1],
        headerBytes[2],
        headerBytes[3],
      );

      if (header === 'RIFF') {
        return { data: buffer, format: 'audio/wav' };
      }

      if (header === 'ID3') {
        return { data: buffer, format: 'audio/mpeg' };
      }

      if (header === 'OggS') {
        return { data: buffer, format: 'audio/ogg' };
      }
    }

    const wavBuffer = this.convertFloat32PcmToWav(buffer, sampleRate);
    return { data: wavBuffer, format: 'audio/wav' };
  }

  private convertFloat32PcmToWav(
    pcmBuffer: ArrayBuffer,
    sampleRate: number,
  ): ArrayBuffer {
    if (pcmBuffer.byteLength === 0) {
      return pcmBuffer;
    }

    const float32Array = new Float32Array(pcmBuffer);
    const bytesPerSample = 2; // 16-bit PCM
    const wavBuffer = new ArrayBuffer(44 + float32Array.length * bytesPerSample);
    const view = new DataView(wavBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i += 1) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    let offset = 0;
    writeString(offset, 'RIFF');
    offset += 4;
    view.setUint32(offset, 36 + float32Array.length * bytesPerSample, true);
    offset += 4;
    writeString(offset, 'WAVE');
    offset += 4;
    writeString(offset, 'fmt ');
    offset += 4;
    view.setUint32(offset, 16, true); // Subchunk1Size
    offset += 4;
    view.setUint16(offset, 1, true); // PCM format
    offset += 2;
    view.setUint16(offset, 1, true); // Mono
    offset += 2;
    view.setUint32(offset, sampleRate, true);
    offset += 4;
    const byteRate = sampleRate * bytesPerSample;
    view.setUint32(offset, byteRate, true);
    offset += 4;
    view.setUint16(offset, bytesPerSample, true); // Block align (channels * bytes per sample)
    offset += 2;
    view.setUint16(offset, bytesPerSample * 8, true); // Bits per sample (16)
    offset += 2;
    writeString(offset, 'data');
    offset += 4;
    view.setUint32(offset, float32Array.length * bytesPerSample, true);
    offset += 4;

    for (let i = 0; i < float32Array.length; i += 1, offset += 2) {
      let sample = float32Array[i];
      // Clamp to [-1, 1]
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed int
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    return wavBuffer;
  }

  private mergeAudioChunks(chunks: ArrayBuffer[]): ArrayBuffer {
    if (chunks.length === 1) {
      return chunks[0];
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const mergedArray = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      mergedArray.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    return mergedArray.buffer;
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
    if (
      this.isReconnectScheduled ||
      this.isDisconnecting ||
      !this.isCallActive ||
      !this.sessionId
    ) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnect attempts reached, ending call');
      this.emitMessage({
        type: 'system_message',
        content: 'Connection lost. Please restart the call.',
        timestamp: new Date(),
        conversationId: this.sessionId || this.conversationId || '',
      });
      this.isCallActive = false;
      this.cleanupAudioSockets();
      this.updateStatus();
      return;
    }

    this.isReconnectScheduled = true;
    this.reconnectAttempts += 1;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (!this.isCallActive || !this.sessionId) {
        this.isReconnectScheduled = false;
        return;
      }

      this.connectBotSockets(this.sessionId, this.currentContext ?? undefined)
        .then(() => {
          this.isReconnectScheduled = false;
        })
        .catch((error) => {
          this.isReconnectScheduled = false;
          this.handleReconnectFailure(error);
        });
    }, delay);
  }

  private handleReconnectFailure(error: unknown): void {
    if (!this.isCallActive) {
      return;
    }

    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Unknown error';
    console.error('Reconnect failed:', message);

    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('insufficient resources')) {
      this.emitMessage({
        type: 'system_message',
        content:
          'Unable to reconnect: server resources are limited. Please wait a moment and restart the call.',
        timestamp: new Date(),
        conversationId: this.sessionId || this.conversationId || '',
      });
      this.isCallActive = false;
      this.cleanupAudioSockets();
      this.updateStatus();
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
      return;
    }

    this.emitMessage({
      type: 'system_message',
      content: 'Connection lost after multiple attempts. Please restart the call.',
      timestamp: new Date(),
      conversationId: this.sessionId || this.conversationId || '',
    });
    this.isCallActive = false;
    this.cleanupAudioSockets();
    this.updateStatus();
  }

  private describeSocketError(event: Event): string {
    if ('message' in event && typeof (event as ErrorEvent).message === 'string') {
      return (event as ErrorEvent).message || 'Unknown error';
    }

    return (event && (event as any).reason) || 'Unknown error';
  }

  private async endCallOnBackend(): Promise<void> {
    if (!this.conversationId) return;
    
    try {
      await axios.post(`/conversations/${this.conversationId}/end`);
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
      await axios.delete(`/conversations/${conversationId}`);
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
      const { data: result } = await axios.post('/conversations/bulk-delete', {
        conversation_ids: conversationIds
      });
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
