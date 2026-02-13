'use client';
import { useEffect, useRef, useState } from 'react';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface UseWebSocketOptions {
  /** WebSocket server URL. Defaults to ws://localhost:8000/ws/tablet */
  url?: string;
  /** Callback fired when a JSON message is received */
  onMessage?: (data: unknown) => void;
  /** Delay in ms before attempting reconnect. Defaults to 3000 */
  reconnectDelay?: number;
}

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export function useWebSocket({
  url = `${WS_BASE_URL}/ws/tablet`,
  onMessage,
  reconnectDelay = 3000,
}: UseWebSocketOptions = {}) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  const mountedRef = useRef(true);

  // Keep the callback ref in sync so reconnects always use the latest handler
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      // Don't connect if already open/connecting or unmounted
      if (
        wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING
      ) {
        return;
      }

      setStatus('connecting');
      const ws = new WebSocket(url);

      ws.onopen = () => {
        if (mountedRef.current) {
          setStatus('connected');
        }
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current?.(data);
        } catch {
          // Non-JSON message (e.g. echo) — ignore or log
          console.debug('[useWebSocket] non-JSON message:', event.data);
        }
      };

      ws.onclose = () => {
        if (mountedRef.current) {
          setStatus('disconnected');
          // Schedule reconnect
          reconnectTimerRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, reconnectDelay);
        }
      };

      ws.onerror = (err) => {
        console.error('[useWebSocket] error:', err);
        // The browser will fire onclose after onerror, so reconnect is handled there
      };

      wsRef.current = ws;
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url, reconnectDelay]);

  return { status };
}
