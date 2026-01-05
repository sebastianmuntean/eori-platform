'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Notification, NotificationType } from '@/hooks/useNotifications';
import { validateNavigationLink } from '@/lib/utils/url-validation';
import { sanitizeErrorMessage } from '@/lib/utils/error-sanitization';

export interface NotificationsListPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface NotificationsListProps {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  pagination: NotificationsListPagination | null;
  showFilters?: boolean;
  showPagination?: boolean;
  filterByRead?: boolean | null;
  filterByType?: NotificationType | null;
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (id: string) => Promise<void>;
  onPageChange?: (page: number) => void;
  onFilterChange?: (filters: { read?: boolean | null; type?: NotificationType | null }) => void;
  className?: string;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Reusable component for listing notifications
 * Used in both modal and page
 * Support for pagination, mark as read on click, filter by read status and type
 */
export function NotificationsList({
  notifications,
  loading,
  error,
  pagination,
  showFilters = true,
  showPagination = true,
  filterByRead: initialFilterByRead = null,
  filterByType: initialFilterByType = null,
  onNotificationClick,
  onMarkAsRead,
  onPageChange,
  onFilterChange,
  className,
}: NotificationsListProps) {
  const t = useTranslations('common');
  const router = useRouter();
  const [readFilter, setReadFilter] = useState<boolean | null>(initialFilterByRead);
  const [typeFilter, setTypeFilter] = useState<NotificationType | null>(initialFilterByType);

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      // Mark as read if not already read and handler provided
      if (!notification.isRead && onMarkAsRead) {
        await onMarkAsRead(notification.id);
      }

      // Call custom click handler if provided
      if (onNotificationClick) {
        onNotificationClick(notification);
      } else if (notification.link) {
        // Validate and navigate to link
        const safeLink = validateNavigationLink(notification.link);
        if (safeLink) {
          router.push(safeLink);
        } else {
          // Log warning in development, silently fail in production
          if (process.env.NODE_ENV === 'development') {
            console.warn('Invalid or unsafe notification link:', notification.link);
          }
        }
      }
    },
    [onMarkAsRead, onNotificationClick, router]
  );

  const handleReadFilterChange = useCallback(
    (value: string) => {
      const newFilter = value === '' ? null : value === 'true';
      setReadFilter(newFilter);
      onFilterChange?.({ read: newFilter, type: typeFilter });
    },
    [typeFilter, onFilterChange]
  );

  const handleTypeFilterChange = useCallback(
    (value: string) => {
      const newFilter = value === '' ? null : (value as NotificationType);
      setTypeFilter(newFilter);
      onFilterChange?.({ read: readFilter, type: newFilter });
    },
    [readFilter, onFilterChange]
  );

  const getNotificationIcon = useCallback((type: NotificationType) => {
    const iconClass = 'w-5 h-5';
    switch (type) {
      case 'success':
        return (
          <svg className={cn(iconClass, 'text-success')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className={cn(iconClass, 'text-danger')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={cn(iconClass, 'text-warning')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className={cn(iconClass, 'text-info')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  }, []);

  const formatNotificationDate = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return t('invalidDate') || 'Invalid date';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return t('invalidDate') || 'Invalid date';
    }
  }, [t]);

  const readFilterOptions = useMemo(
    () => [
      { value: '', label: t('all') || 'All' },
      { value: 'false', label: t('unreadNotifications') || 'Unread' },
      { value: 'true', label: t('read') || 'Read' },
    ],
    [t]
  );

  const typeFilterOptions = useMemo(
    () => [
      { value: '', label: t('allTypes') || 'All Types' },
      { value: 'info', label: t('info') || 'Info' },
      { value: 'success', label: t('success') || 'Success' },
      { value: 'warning', label: t('warning') || 'Warning' },
      { value: 'error', label: t('error') || 'Error' },
    ],
    [t]
  );

  if (loading && notifications.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <div className="text-text-secondary">{t('loading') || 'Loading...'}</div>
      </div>
    );
  }

  if (error) {
    const sanitizedError = sanitizeErrorMessage(error);
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <div className="text-danger">{sanitizedError}</div>
      </div>
    );
  }

  const currentPage = pagination?.page || 1;

  return (
    <div className={cn('flex flex-col', className)}>
      {showFilters && (
        <div className="flex gap-4 mb-4">
          <Select
            options={readFilterOptions}
            value={readFilter === null ? '' : readFilter.toString()}
            onChange={(e) => handleReadFilterChange(e.target.value)}
            className="flex-1"
          />
          <Select
            options={typeFilterOptions}
            value={typeFilter || ''}
            onChange={(e) => handleTypeFilterChange(e.target.value)}
            className="flex-1"
          />
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-text-secondary">{t('noNotifications') || 'No notifications'}</div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors',
                  notification.isRead
                    ? 'bg-bg-primary border-border hover:bg-bg-secondary'
                    : 'bg-bg-secondary border-primary/20 hover:bg-bg-secondary/80'
                )}
              >
                <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4
                        className={cn(
                          'text-sm font-medium',
                          notification.isRead ? 'text-text-primary' : 'text-text-primary font-semibold'
                        )}
                      >
                        {notification.title}
                      </h4>
                      <p className="text-sm text-text-secondary mt-1">{notification.message}</p>
                    </div>
                    {!notification.isRead && (
                      <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-text-muted">
                      {formatNotificationDate(notification.createdAt)}
                    </span>
                    {notification.module && (
                      <span className="text-xs text-text-muted">{notification.module}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showPagination && pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="text-sm text-text-secondary">
                {t('page') || 'Page'} {pagination.page} {t('of') || 'of'} {pagination.totalPages} ({pagination.total} {t('total') || 'total'})
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  {t('previous') || 'Previous'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={currentPage >= pagination.totalPages || loading}
                >
                  {t('next') || 'Next'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
