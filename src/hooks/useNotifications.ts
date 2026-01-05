'use client';

import { useState, useCallback, useEffect } from 'react';
import { logError } from '@/lib/utils/error-sanitization';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt: string | null;
  createdBy: string | null;
  module: string | null;
  link: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchNotifications: (params?: {
    page?: number;
    pageSize?: number;
    isRead?: boolean;
    type?: NotificationType;
  }) => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  refetch: () => Promise<void>;
  refetchUnreadCount: () => Promise<void>;
}

/**
 * Hook for fetching notifications and managing state
 * Returns notifications, loading, error, refetch, and unreadCount
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState<UseNotificationsReturn['pagination']>(null);
  const [lastFetchParams, setLastFetchParams] = useState<{
    page?: number;
    pageSize?: number;
    isRead?: boolean;
    type?: NotificationType;
  }>({});

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch unread count');
      }

      setUnreadCount(result.count || 0);
    } catch (err) {
      // Don't set error for unread count failures - just log it
      logError('Failed to fetch unread count', err);
    }
  }, []);

  const fetchNotifications = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
      if (params.type) queryParams.append('type', params.type);

      const response = await fetch(`/api/notifications?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch notifications');
      }

      setNotifications(result.data || []);
      setPagination(result.pagination || null);
      setLastFetchParams(params);

      // Refresh unread count after fetching notifications
      await fetchUnreadCount();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchUnreadCount]);

  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to mark notification as read');
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true, readAt: result.data?.readAt || new Date().toISOString() }
            : notification
        )
      );

      // Refresh unread count
      await fetchUnreadCount();

      return true;
    } catch (err) {
      logError('Failed to mark notification as read', err);
      return false;
    }
  }, [fetchUnreadCount]);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to mark all notifications as read');
      }

      // Update local state - mark all unread notifications as read
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.isRead
            ? notification
            : { ...notification, isRead: true, readAt: new Date().toISOString() }
        )
      );

      // Refresh unread count
      await fetchUnreadCount();

      return true;
    } catch (err) {
      logError('Failed to mark all notifications as read', err);
      return false;
    }
  }, [fetchUnreadCount]);

  const refetch = useCallback(async () => {
    await fetchNotifications(lastFetchParams);
  }, [fetchNotifications, lastFetchParams]);

  const refetchUnreadCount = useCallback(async () => {
    await fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Initial fetch of unread count
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refetch,
    refetchUnreadCount,
  };
}

