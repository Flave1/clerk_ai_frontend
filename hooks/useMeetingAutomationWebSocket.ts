import { useEffect, useRef, useState, useCallback } from 'react';
import { API_ORIGIN } from '@/lib/axios';

export interface AutomationStatusMessage {
  type: 'automation_status' | 'connected' | 'ping' | 'pong';
  session_id: string;
  stage?: string;
  message?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface UseMeetingAutomationWebSocketResult {
  messages: AutomationStatusMessage[];
  isConnected: boolean;
  connectionError: string | null;
  currentStage: string | null;
  reconnect: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

export function useMeetingAutomationWebSocket(
  sessionId: string | null,
  enabled: boolean = true
): UseMeetingAutomationWebSocketResult {
  const [messages, setMessages] = useState<AutomationStatusMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!sessionId || !enabled || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Clean up any existing connection
    cleanup();

    try {
      // Get backend URL - prioritize RT_GATEWAY_URL, then API_ORIGIN, then fallback
      const baseUrl = 
        process.env.NEXT_PUBLIC_RT_GATEWAY_URL ||
        process.env.NEXT_PUBLIC_WS_URL ||
        API_ORIGIN ||
        (typeof window !== 'undefined' ? window.location.origin : '');
      
      // Parse the base URL to construct WebSocket URL
      const url = new URL(baseUrl);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.pathname = `/ws/meeting-automation/${sessionId}`;
      url.search = '';
      url.hash = '';
      
      const wsUrl = url.toString();
      console.log(`Connecting to meeting automation WebSocket: ${wsUrl}`);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        console.log(`✅ Connected to meeting automation WebSocket for session ${sessionId}`);
      };

      ws.onmessage = (event) => {
        try {
          const data: AutomationStatusMessage = JSON.parse(event.data);
          
          if (data.type === 'automation_status') {
            setMessages((prev) => [...prev, data]);
            if (data.stage) {
              setCurrentStage(data.stage);
            }
          } else if (data.type === 'connected') {
            // Initial connection confirmation
            setIsConnected(true);
          } else if (data.type === 'ping') {
            // Respond to ping
            ws.send(JSON.stringify({ type: 'pong', session_id: sessionId }));
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        
        if (event.code !== 1000 && shouldReconnectRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          // Attempt to reconnect
          reconnectAttemptsRef.current += 1;
          const delay = RECONNECT_DELAY * reconnectAttemptsRef.current;
          
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setConnectionError('Failed to connect after multiple attempts');
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to establish connection');
      setIsConnected(false);
    }
  }, [sessionId, enabled, cleanup]);

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    if (sessionId && enabled) {
      shouldReconnectRef.current = true;
      connect();
    } else {
      cleanup();
      setIsConnected(false);
      setMessages([]);
      setCurrentStage(null);
      setConnectionError(null);
    }

    return () => {
      shouldReconnectRef.current = false;
      cleanup();
    };
  }, [sessionId, enabled, connect, cleanup]);

  return {
    messages,
    isConnected,
    connectionError,
    currentStage,
    reconnect,
  };
}

