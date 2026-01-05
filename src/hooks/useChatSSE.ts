'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
  attachments: Array<{
    id: string;
    fileName: string;
    storageName: string;
    storagePath: string;
    mimeType: string | null;
    fileSize: number;
    uploadedBy: string;
    createdAt: Date;
  }>;
}

interface UseChatSSEReturn {
  connected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  onMessage: (callback: (message: Message) => void) => void;
  offMessage: (callback: (message: Message) => void) => void;
}

export function useChatSSE(conversationId: string | null): UseChatSSEReturn {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const messageCallbacksRef = useRef<Set<(message: Message) => void>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!conversationId || eventSourceRef.current) {
      return;
    }

    const connectSSE = () => {
      try {
        const url = `/api/chat/conversations/${conversationId}/messages/stream`;
        const eventSource = new EventSource(url);

        eventSource.onopen = () => {
          console.log('SSE connected for conversation:', conversationId);
          setConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'connected') {
              console.log('SSE connection confirmed');
              return;
            }

            // Handle message data
            if (data.id && data.conversationId) {
              const message: Message = {
                ...data,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
                attachments: (data.attachments || []).map((att: any) => ({
                  ...att,
                  createdAt: new Date(att.createdAt),
                })),
              };

              messageCallbacksRef.current.forEach((callback) => {
                try {
                  callback(message);
                } catch (err) {
                  console.error('Error in message callback:', err);
                }
              });
            }
          } catch (err) {
            console.error('Error parsing SSE message:', err);
          }
        };

        eventSource.onerror = (err) => {
          console.error('SSE error:', err);
          setConnected(false);
          eventSource.close();

          // Reconnect with exponential backoff
          const attempts = reconnectAttemptsRef.current;
          if (attempts < 5) {
            const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
            reconnectAttemptsRef.current = attempts + 1;
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connectSSE();
            }, delay);
          } else {
            setError('Failed to connect to chat stream');
          }
        };

        eventSourceRef.current = eventSource;
      } catch (err) {
        console.error('Error creating SSE connection:', err);
        setError('Failed to create chat connection');
      }
    };

    connectSSE();
  }, [conversationId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  const onMessage = useCallback((callback: (message: Message) => void) => {
    messageCallbacksRef.current.add(callback);
  }, []);

  const offMessage = useCallback((callback: (message: Message) => void) => {
    messageCallbacksRef.current.delete(callback);
  }, []);

  useEffect(() => {
    if (conversationId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [conversationId, connect, disconnect]);

  return {
    connected,
    error,
    connect,
    disconnect,
    onMessage,
    offMessage,
  };
}

