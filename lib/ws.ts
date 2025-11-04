import { WebSocketMessage, ActionUpdate, RoomUpdate } from '@/types';

type WebSocketEventHandler = (message: WebSocketMessage) => void;
type ConnectionEventHandler = () => void;
type ErrorEventHandler = (error: Event) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private shouldReconnect = true;

  // Event handlers
  private messageHandlers: WebSocketEventHandler[] = [];
  private connectionHandlers: ConnectionEventHandler[] = [];
  private disconnectionHandlers: ConnectionEventHandler[] = [];
  private errorHandlers: ErrorEventHandler[] = [];

  constructor() {
    this.url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  }

  // Public methods
  connect(): void {
    if (this.isConnecting || this.isConnected()) {
      return;
    }

    this.isConnecting = true;
    console.log(`Connecting to WebSocket: ${this.url}`);

    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleConnectionError(error as Event);
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Event subscription methods
  onMessage(handler: WebSocketEventHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  onConnect(handler: ConnectionEventHandler): () => void {
    this.connectionHandlers.push(handler);
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  onDisconnect(handler: ConnectionEventHandler): () => void {
    this.disconnectionHandlers.push(handler);
    return () => {
      const index = this.disconnectionHandlers.indexOf(handler);
      if (index > -1) {
        this.disconnectionHandlers.splice(index, 1);
      }
    };
  }

  onError(handler: ErrorEventHandler): () => void {
    this.errorHandlers.push(handler);
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  // Message sending
  send(message: any): void {
    if (!this.isConnected()) {
      console.warn('WebSocket is not connected. Cannot send message:', message);
      return;
    }

    try {
      this.ws!.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
    }
  }

  // Specific message subscriptions
  subscribeToConversation(conversationId: string): void {
    this.send({
      type: 'subscribe',
      topic: 'conversation',
      conversation_id: conversationId,
    });
  }

  subscribeToRoom(roomId: string): void {
    this.send({
      type: 'subscribe',
      topic: 'room',
      room_id: roomId,
    });
  }

  subscribeToActions(): void {
    this.send({
      type: 'subscribe',
      topic: 'actions',
    });
  }

  unsubscribeFromConversation(conversationId: string): void {
    this.send({
      type: 'unsubscribe',
      topic: 'conversation',
      conversation_id: conversationId,
    });
  }

  unsubscribeFromRoom(roomId: string): void {
    this.send({
      type: 'unsubscribe',
      topic: 'room',
      room_id: roomId,
    });
  }

  unsubscribeFromActions(): void {
    this.send({
      type: 'unsubscribe',
      topic: 'actions',
    });
  }

  // Private methods
  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.connectionHandlers.forEach(handler => handler());
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.isConnecting = false;
      this.disconnectionHandlers.forEach(handler => handler());
      
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleConnectionError(error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.messageHandlers.forEach(handler => handler(message));
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error, event.data);
      }
    };
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  }

  private handleConnectionError(error: Event): void {
    this.isConnecting = false;
    this.errorHandlers.forEach(handler => handler(error));
  }
}

// Create and export a singleton instance
export const wsClient = new WebSocketClient();

// Auto-connect when imported (disabled for call testing)
// if (typeof window !== 'undefined') {
//   wsClient.connect();
// }

export default wsClient;
