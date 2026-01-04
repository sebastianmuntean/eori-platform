'use client';

import { useState, useCallback } from 'react';

export interface ConversationParticipant {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  joinedAt: Date;
  lastReadAt: Date | null;
}

export interface ConversationLastMessage {
  id: string;
  content: string | null;
  senderId: string;
  senderName: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title: string | null;
  type: 'direct' | 'group';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  participants: ConversationParticipant[];
  lastMessage?: ConversationLastMessage;
  unreadCount?: number;
}

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchConversations: (params?: {
    page?: number;
    pageSize?: number;
  }) => Promise<void>;
  createConversation: (data: {
    type: 'direct' | 'group';
    participantIds: string[];
    title?: string;
  }) => Promise<Conversation | null>;
  refreshConversations: () => Promise<void>;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseConversationsReturn['pagination']>(null);

  const fetchConversations = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

      const url = `/api/chat/conversations?${queryParams.toString()}`;
      const response = await fetch(url);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch conversations');
      }

      setConversations(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (data: {
    type: 'direct' | 'group';
    participantIds: string[];
    title?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create conversation');
      }

      // Refresh conversations list
      await fetchConversations();

      // Fetch the created conversation details
      const convResponse = await fetch(`/api/chat/conversations/${result.data.id}`);
      const convResult = await convResponse.json();

      if (convResult.success) {
        return convResult.data as Conversation;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchConversations]);

  const refreshConversations = useCallback(async () => {
    await fetchConversations({ page: pagination?.page || 1, pageSize: pagination?.pageSize || 20 });
  }, [fetchConversations, pagination]);

  return {
    conversations,
    loading,
    error,
    pagination,
    fetchConversations,
    createConversation,
    refreshConversations,
  };
}

