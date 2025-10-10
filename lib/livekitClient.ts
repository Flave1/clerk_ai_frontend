import { Room, RoomEvent, RemoteParticipant, LocalParticipant, Track, RemoteTrack, LocalTrack } from 'livekit-client';

export interface LiveKitConfig {
  url: string;
  token: string;
  roomName: string;
  participantName: string;
}

export interface LiveKitEvents {
  connected: () => void;
  disconnected: () => void;
  participantConnected: (participant: RemoteParticipant) => void;
  participantDisconnected: (participant: RemoteParticipant) => void;
  trackSubscribed: (track: RemoteTrack, participant: RemoteParticipant) => void;
  trackUnsubscribed: (track: RemoteTrack, participant: RemoteParticipant) => void;
  audioDataReceived: (audioData: Float32Array) => void;
  aiResponseReceived: (response: string) => void;
  error: (error: Error) => void;
}

export class LiveKitClient {
  private room: Room | null = null;
  private config: LiveKitConfig | null = null;
  private eventHandlers: Partial<LiveKitEvents> = {};
  private isConnected = false;
  private isConnecting = false;

  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Set up default event handlers
    this.eventHandlers = {
      connected: () => console.log('LiveKit connected'),
      disconnected: () => console.log('LiveKit disconnected'),
      participantConnected: (participant) => console.log('Participant connected:', participant.identity),
      participantDisconnected: (participant) => console.log('Participant disconnected:', participant.identity),
      trackSubscribed: (track, participant) => console.log('Track subscribed:', track.kind, participant.identity),
      trackUnsubscribed: (track, participant) => console.log('Track unsubscribed:', track.kind, participant.identity),
      audioDataReceived: (audioData) => console.log('Audio data received:', audioData.length),
      aiResponseReceived: (response) => console.log('AI response received:', response),
      error: (error) => console.error('LiveKit error:', error),
    };
  }

  async connect(config: LiveKitConfig): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      throw new Error('Already connected or connecting');
    }

    this.config = config;
    this.isConnecting = true;

    try {
      // Create room instance
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          videoSimulcastLayers: [],
          audioPreset: {
            maxBitrate: 16000,
            priority: 'high',
          },
        },
      });

      // Set up room event handlers
      this.setupRoomEventHandlers();

      // Connect to room
      await this.room.connect(config.url, config.token);

      // Enable camera and microphone
      await this.room.localParticipant.enableCameraAndMicrophone();

      this.isConnected = true;
      this.isConnecting = false;

      this.eventHandlers.connected?.();

    } catch (error) {
      this.isConnecting = false;
      this.eventHandlers.error?.(error as Error);
      throw error;
    }
  }

  private setupRoomEventHandlers() {
    if (!this.room) return;

    this.room
      .on(RoomEvent.Disconnected, (reason) => {
        this.isConnected = false;
        this.eventHandlers.disconnected?.();
      })
      .on(RoomEvent.ParticipantConnected, (participant) => {
        this.eventHandlers.participantConnected?.(participant);
        this.setupParticipantEventHandlers(participant);
      })
      .on(RoomEvent.ParticipantDisconnected, (participant) => {
        this.eventHandlers.participantDisconnected?.(participant);
      })
      .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (participant) {
          this.eventHandlers.trackSubscribed?.(track, participant);
          
          // Handle audio tracks for AI processing
          if (track.kind === Track.Kind.Audio) {
            this.handleAudioTrack(track, participant);
          }
        }
      })
      .on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        this.eventHandlers.trackUnsubscribed?.(track, participant);
      })
      .on(RoomEvent.DataReceived, (payload, participant) => {
        if (participant) {
          this.handleDataReceived(payload, participant);
        }
      });
  }

  private setupParticipantEventHandlers(participant: RemoteParticipant) {
    participant.on('trackSubscribed', (track, publication) => {
      this.eventHandlers.trackSubscribed?.(track, participant);
      
      if (track.kind === Track.Kind.Audio) {
        this.handleAudioTrack(track, participant);
      }
    });

    participant.on('trackUnsubscribed', (track, publication) => {
      this.eventHandlers.trackUnsubscribed?.(track, participant);
    });
  }

  private handleAudioTrack(track: RemoteTrack, participant: RemoteParticipant) {
    // Set up audio track processing
    const audioElement = track.attach();
    audioElement.play();

    // Process audio data for AI
    if (track.mediaStreamTrack) {
      const audioContext = new AudioContext();
      const mediaStream = new MediaStream([track.mediaStreamTrack]);
      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 2048;
      source.connect(analyser);

      const dataArray = new Float32Array(analyser.frequencyBinCount);
      
      const processAudio = () => {
        if (this.isConnected) {
          analyser.getFloatFrequencyData(dataArray);
          this.eventHandlers.audioDataReceived?.(dataArray);
          requestAnimationFrame(processAudio);
        }
      };

      processAudio();
    }
  }

  private handleDataReceived(payload: Uint8Array, participant: RemoteParticipant) {
    try {
      const message = JSON.parse(new TextDecoder().decode(payload));
      
      if (message.type === 'ai_response') {
        this.eventHandlers.aiResponseReceived?.(message.content);
      }
    } catch (error) {
      console.error('Failed to parse data message:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.room && this.isConnected) {
      await this.room.disconnect();
      this.room = null;
      this.isConnected = false;
      this.isConnecting = false;
    }
  }

  async sendTextMessage(message: string): Promise<void> {
    if (!this.room || !this.isConnected) {
      throw new Error('Not connected to room');
    }

    const payload = new TextEncoder().encode(
      JSON.stringify({
        type: 'text_message',
        content: message,
        timestamp: new Date().toISOString(),
      })
    );

    await this.room.localParticipant.publishData(payload);
  }

  async toggleMicrophone(): Promise<void> {
    if (!this.room || !this.isConnected) {
      throw new Error('Not connected to room');
    }

    const micTrack = this.room.localParticipant.audioTrackPublications.values().next().value;
    
    if (micTrack && micTrack.track) {
      if (micTrack.isMuted) {
        await micTrack.track.unmute();
      } else {
        await micTrack.track.mute();
      }
    }
  }

  async toggleCamera(): Promise<void> {
    if (!this.room || !this.isConnected) {
      throw new Error('Not connected to room');
    }

    const cameraTrack = this.room.localParticipant.videoTrackPublications.values().next().value;
    
    if (cameraTrack && cameraTrack.track) {
      if (cameraTrack.isMuted) {
        await cameraTrack.track.unmute();
      } else {
        await cameraTrack.track.mute();
      }
    }
  }

  getConnectionState(): string {
    if (this.isConnecting) return 'connecting';
    if (this.isConnected) return 'connected';
    return 'disconnected';
  }

  getParticipants(): RemoteParticipant[] {
    if (!this.room) return [];
    return Array.from(this.room.remoteParticipants.values());
  }

  getLocalParticipant(): LocalParticipant | null {
    return this.room?.localParticipant || null;
  }

  // Event handler registration
  on<K extends keyof LiveKitEvents>(event: K, handler: LiveKitEvents[K]): void {
    this.eventHandlers[event] = handler;
  }

  off<K extends keyof LiveKitEvents>(event: K): void {
    delete this.eventHandlers[event];
  }
}

// Create singleton instance
export const livekitClient = new LiveKitClient();
export default livekitClient;
