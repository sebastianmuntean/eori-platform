'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useChatSSE, Message } from './useChatSSE';

export interface ChatMessage extends Message {}

interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sending: boolean;
  hasMore: boolean;
  fetchMessages: (params?: {
    page?: number;
    pageSize?: number;
    beforeMessageId?: string;
  }) => Promise<void>;
  sendMessage: (content: string) => Promise<ChatMessage | null>;
  sendMessageWithFiles: (files: File[], content?: string) => Promise<ChatMessage | null>;
  markAsRead: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useChat(conversationId: string | null): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { connected, onMessage, offMessage } = useChatSSE(conversationId);

  // Handle incoming messages from SSE
  useEffect(() => {
    if (!connected) return;

    const handleMessage = (message: ChatMessage) => {
      setMessages((prev) => {
        // Check if message already exists
        const existingIndex = prev.findIndex((m) => m.id === message.id);
        if (existingIndex !== -1) {
          // Update existing message (e.g., when attachments are added)
          const updated = [...prev];
          updated[existingIndex] = message;
          return updated;
        }

        // Add new message
        return [...prev, message];
      });
    };

    onMessage(handleMessage);

    return () => {
      offMessage(handleMessage);
    };
  }, [connected, onMessage, offMessage]);

  const fetchMessages = useCallback(async (params?: {
    page?: number;
    pageSize?: number;
    beforeMessageId?: string;
  }) => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 50;
      
      queryParams.append('page', page.toString());
      queryParams.append('pageSize', pageSize.toString());
      if (params?.beforeMessageId) {
        queryParams.append('beforeMessageId', params.beforeMessageId);
      }

      const url = `/api/chat/conversations/${conversationId}/messages?${queryParams.toString()}`;
      const response = await fetch(url);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch messages');
      }

      const fetchedMessages = (result.data || []).map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
        updatedAt: new Date(msg.updatedAt),
        attachments: (msg.attachments || []).map((att: any) => ({
          ...att,
          createdAt: new Date(att.createdAt),
        })),
      })) as ChatMessage[];

      if (params?.page === 1 || !params?.page) {
        // Replace messages for first page
        setMessages(fetchedMessages);
      } else {
        // Prepend for pagination
        setMessages((prev) => [...fetchedMessages, ...prev]);
      }

      setHasMore(result.pagination?.hasMore || false);
      setCurrentPage(page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string): Promise<ChatMessage | null> => {
    if (!conversationId || !content.trim()) {
      return null;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      // Message will be received via SSE, but we can fetch it if needed
      // For now, SSE will handle it
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      return null;
    } finally {
      setSending(false);
    }
  }, [conversationId]);

  const sendMessageWithFiles = useCallback(async (
    files: File[],
    content?: string
  ): Promise<ChatMessage | null> => {
    if (!conversationId || (files.length === 0 && !content?.trim())) {
      return null;
    }

    setSending(true);
    setError(null);

    try {
      // First, create the message
      const messageResponse = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content || null }),
      });

      const messageResult = await messageResponse.json();

      if (!messageResult.success) {
        throw new Error(messageResult.error || 'Failed to create message');
      }

      const messageId = messageResult.data.id;

      // Upload files
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const fileResponse = await fetch(
          `/api/chat/conversations/${conversationId}/messages/${messageId}/attachments`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const fileResult = await fileResponse.json();

        if (!fileResult.success) {
          console.error('Failed to upload file:', fileResult.error);
          // Continue with other files
        }
      }

      // Message will be received via SSE
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message with files';
      setError(errorMessage);
      return null;
    } finally {
      setSending(false);
    }
  }, [conversationId]);

  const markAsRead = useCallback(async () => {
    if (!conversationId) return;

    try {
      await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: 'PATCH',
      });
    } catch (err) {
      console.error('Failed to mark conversation as read:', err);
    }
  }, [conversationId]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    const oldestMessage = messages[0];
    if (oldestMessage) {
      await fetchMessages({
        page: currentPage + 1,
        beforeMessageId: oldestMessage.id,
      });
    }
  }, [hasMore, loading, messages, currentPage, fetchMessages]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      setMessages([]);
      fetchMessages({ page: 1 });
      markAsRead();
    }
  }, [conversationId, fetchMessages, markAsRead]);

  return {
    messages,
    loading,
    error,
    sending,
    hasMore,
    fetchMessages,
    sendMessage,
    sendMessageWithFiles,
    markAsRead,
    loadMore,
  };
}

