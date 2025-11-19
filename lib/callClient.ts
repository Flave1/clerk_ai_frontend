import { v4 as uuid } from "uuid";
import AudioEngine from "./AudioEngine";

export type CallMessage =
  | { type: "tts_audio"; audio: ArrayBuffer }
  | { type: "transcript"; text: string }
  | { type: "error"; message: string }
  | { type: "connected" }
  | { type: "pong" }
  | { type: "tts_complete" }
  | { type: "status"; status: CallStatus };

export type CallStatus = {
  isCallActive: boolean;
  isConnected: boolean;
  connectionState: "idle" | "connecting" | "connected" | "disconnected";
};

class CallClient {
  ws: WebSocket | null = null;
  engine = new AudioEngine();

  sessionId: string | null = null;

  handlers: ((msg: CallMessage) => void)[] = [];

  status: CallStatus = {
    isCallActive: false,
    isConnected: false,
    connectionState: "idle",
  };

  _audioChunkCount: number = 0;

  // -----------------------------------------------------
  // WS URL
  // -----------------------------------------------------
  get wsUrl() {
    const base =
      process.env.NEXT_PUBLIC_RT_GATEWAY_URL ||
      process.env.NEXT_PUBLIC_WS_URL ||
      window.location.origin;

    // Parse the base URL
    const u = new URL(base);
    // Change protocol to WebSocket
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    // Clear any existing path and set the WebSocket path
    u.pathname = "/ws/bot/";
    // Remove any query or hash
    u.search = "";
    u.hash = "";
    return u.toString();
    }

  // -----------------------------------------------------
  // Public API used by MeetingRoom
  // -----------------------------------------------------
  async joinCall(meetingId?: string) {
    this.sessionId = meetingId || uuid();
    this.updateStatus("connecting");
    return this._connect(this.sessionId);
  }

  endCall() {
    this.updateStatus("disconnected");
    if (this.ws) this.ws.close();
    this.ws = null;
    this.sessionId = null;
  }

  sendMessage(obj: any) {
    if (!this.ws) {
      console.warn('[CallClient] sendMessage: No WebSocket available');
      return;
    }
    if (this.ws.readyState !== WebSocket.OPEN) {
      console.warn(`[CallClient] sendMessage: WebSocket not open (state: ${this.ws.readyState})`);
      return;
    }
    this.ws.send(JSON.stringify(obj));
  }

  sendAudio(chunk: ArrayBuffer) {
    if (!this.ws) {
      console.warn('[CallClient] sendAudio: No WebSocket available');
      return;
  }
    if (this.ws.readyState !== WebSocket.OPEN) {
      console.warn(`[CallClient] sendAudio: WebSocket not open (state: ${this.ws.readyState})`);
      return;
    }
    this._audioChunkCount = (this._audioChunkCount || 0) + 1;
    try {
      this.ws.send(chunk);
    } catch (error) {
      console.error(`[CallClient] ❌ Failed to send audio chunk #${this._audioChunkCount - 1}:`, error);
    }
  }

  sendInterrupt() {
    this.sendMessage({ type: "interrupt" });
  }

  onStatusChange(h: (s: CallStatus) => void) {
    this.onMessage((m) => {
      if (m.type === "status") h(m.status);
    });
  }

  onMessage(handler: (msg: CallMessage) => void) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  // -----------------------------------------------------
  // Private WebSocket Logic
  // -----------------------------------------------------
  private _connect(sessionId: string) {
    return new Promise<void>((resolve, reject) => {
      const wsUrl = this.wsUrl + sessionId;
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = "arraybuffer";

      this.ws.onopen = () => {
        this.sendMessage({
          type: "register",
          sessionId,
          meetingId: sessionId, // sessionId is now the meetingId
          botName: "Aurray",
          platform: "aurray",
        });
      };

      this.ws.onerror = (err) => reject(err);

      this.ws.onclose = () => {
        this.updateStatus("disconnected");
      };

      this.ws.onmessage = async (ev) => {
        // AUDIO
        if (ev.data instanceof ArrayBuffer) {
          this.emit({ type: "tts_audio", audio: ev.data });
          this.engine.push(ev.data);
          return;
        }

        // TEXT JSON
        let json: any = null;
        try {
          json = JSON.parse(ev.data);
        } catch {
              return;
            }
            
        switch (json.type) {
          case "connected":
            this.updateStatus("connected");
            resolve();
            break;

          case "transcription":
            this.emit({
              type: "transcript",
              text: json.content,
              });
            break;

          case "tts_complete":
            this.emit({ type: "tts_complete" });
            break;

          case "error":
            this.emit({ type: "error", message: json.message });
            break;

          case "pong":
            this.emit({ type: "pong" });
            break;

          default:
            break;
        }
      };
    });
    }

  // -----------------------------------------------------
  // Util
  // -----------------------------------------------------
  private updateStatus(state: CallStatus["connectionState"]) {
    this.status = {
      isCallActive: state === "connected",
      isConnected: state === "connected",
      connectionState: state,
    };
    this.emit({ type: "status", status: this.status });
      }

  emit(msg: CallMessage) {
    this.handlers.forEach((h) => h(msg));
  }
}

export default new CallClient();
