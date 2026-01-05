'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { NotificationsList } from './NotificationsList';
import { Notification, useNotifications } from '@/hooks/useNotifications';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal component for displaying unread notifications
 * Shows notifications with icons by type, timestamps, View All button, Mark All as Read button
 */
export function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const t = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const {
    notifications,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useNotifications();

  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Fetch unread notifications when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications({ isRead: false, pageSize: 20 });
    }
  }, [isOpen, fetchNotifications]);

  const handleViewAll = useCallback(() => {
    onClose();
    router.push(`/${locale}/dashboard/administration/notifications`);
  }, [onClose, router, locale]);

  const handleMarkAllAsRead = useCallback(async () => {
    setIsMarkingAll(true);
    try {
      const success = await markAllAsRead();
      if (success) {
        // Refresh notifications list after marking all as read
        await fetchNotifications({ isRead: false, pageSize: 20 });
      }
    } finally {
      setIsMarkingAll(false);
    }
  }, [markAllAsRead, fetchNotifications]);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      // Close modal when notification is clicked
      onClose();
    },
    [onClose]
  );

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      await markAsRead(id);
      // Refresh notifications list after marking as read
      await fetchNotifications({ isRead: false, pageSize: 20 });
    },
    [markAsRead, fetchNotifications]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('unreadNotifications') || 'Unread Notifications'}
      size="lg"
    >
      <div className="flex flex-col h-full max-h-[600px]">
        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          <NotificationsList
            notifications={notifications}
            loading={loading}
            error={error}
            pagination={pagination}
            showFilters={false}
            showPagination={false}
            filterByRead={false}
            onNotificationClick={handleNotificationClick}
            onMarkAsRead={handleMarkAsRead}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-4 pt-4 mt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={loading || unreadCount === 0 || isMarkingAll}
            isLoading={isMarkingAll}
          >
            {t('markAllAsRead') || 'Mark All as Read'}
          </Button>
          <Button variant="primary" onClick={handleViewAll}>
            {t('viewAll') || 'View All'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
