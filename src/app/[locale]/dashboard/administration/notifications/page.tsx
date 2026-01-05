'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useTranslations } from 'next-intl';
import { formatDateTime } from '@/lib/utils/accounting';
import { safeNavigate } from '@/lib/utils/url-validation';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  readAt: string | null;
  createdBy: string | null;
  module: string | null;
  link: string | null;
  createdAt: string;
  updatedAt: string;
}

type NotificationType = 'info' | 'warning' | 'error' | 'success';
type ReadFilter = 'all' | 'unread';

const isValidNotificationType = (value: string): value is NotificationType => {
  return ['info', 'success', 'warning', 'error'].includes(value);
};

export default function NotificationsPage() {
  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.NOTIFICATIONS_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const t = useTranslations('common');
  const { toasts, error: showError, success: showSuccess, removeToast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
  } | null>(null);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('pageSize', '20');
      if (readFilter === 'unread') {
        queryParams.append('isRead', 'false');
      }
      if (typeFilter !== 'all') {
        queryParams.append('type', typeFilter);
      }

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Error fetching notifications:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, readFilter, typeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    setMarkingAsRead(id);
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

      // Refresh notifications
      await fetchNotifications();
      showSuccess(t('markAsReadSuccess') || 'Notification marked as read');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
      showError(errorMessage);
      console.error('Error marking notification as read:', errorMessage);
    } finally {
      setMarkingAsRead(null);
    }
  }, [fetchNotifications, showError, showSuccess, t]);

  const handleMarkAllAsRead = useCallback(async () => {
    setMarkingAllAsRead(true);
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

      // Refresh notifications
      await fetchNotifications();
      showSuccess(t('markAllAsReadSuccess') || 'All notifications marked as read');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      showError(errorMessage);
      console.error('Error marking all notifications as read:', errorMessage);
    } finally {
      setMarkingAllAsRead(false);
    }
  }, [fetchNotifications, showError, showSuccess, t]);

  const getTypeBadgeVariant = (type: string): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'danger';
      case 'info':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'success':
        return t('success') || 'Success';
      case 'warning':
        return t('warning') || 'Warning';
      case 'error':
        return t('error') || 'Error';
      case 'info':
        return t('info') || 'Info';
      default:
        return type;
    }
  };

  const columns = [
    {
      key: 'type',
      label: t('notificationType') || t('type') || 'Type',
      sortable: false,
      render: (value: string) => (
        <Badge variant={getTypeBadgeVariant(value)} size="sm">
          {getTypeLabel(value)}
        </Badge>
      ),
    },
    {
      key: 'title',
      label: t('title') || 'Title',
      sortable: true,
    },
    {
      key: 'message',
      label: t('message') || 'Message',
      sortable: false,
      render: (value: string) => (
        <div className="max-w-md truncate" title={value}>
          {value}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: t('date') || 'Date',
      sortable: true,
      render: (value: string) => formatDateTime(value, locale === 'ro' ? 'ro-RO' : locale === 'it' ? 'it-IT' : 'en-US'),
    },
    {
      key: 'isRead',
      label: t('status') || 'Status',
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'secondary' : 'warning'} size="sm">
          {value ? t('read') || 'Read' : t('unread') || 'Unread'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: t('actions'),
      sortable: false,
      render: (_: unknown, row: Notification) => (
        <div className="flex gap-2">
          {!row.isRead && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMarkAsRead(row.id)}
              disabled={markingAsRead === row.id}
              isLoading={markingAsRead === row.id}
            >
              {t('markAsRead') || 'Mark as read'}
            </Button>
          )}
          {row.link && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => safeNavigate(row.link!, router, { openExternalInNewTab: true })}
            >
              {t('view') || 'View'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('breadcrumbAdministration'), href: `/${locale}/dashboard/administration` },
    { label: t('notifications') || 'Notifications' },
  ];

  const hasUnreadNotifications = notifications.some((n) => !n.isRead);

  const handleReadFilterChange = useCallback((value: string) => {
    setReadFilter(value as ReadFilter);
    setCurrentPage(1);
  }, []);

  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  }, []);

  if (permissionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('notifications') || 'Notifications'}</h1>
        </div>
        {hasUnreadNotifications && (
          <Button 
            onClick={handleMarkAllAsRead} 
            variant="outline"
            disabled={markingAllAsRead}
            isLoading={markingAllAsRead}
          >
            {t('markAllAsRead') || 'Mark all as read'}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <Select
              value={readFilter}
              onChange={(e) => handleReadFilterChange(e.target.value)}
              options={[
                { value: 'all', label: t('all') || 'All' },
                { value: 'unread', label: t('unread') || 'Unread' },
              ]}
            />

            <Select
              value={typeFilter}
              onChange={(e) => handleTypeFilterChange(e.target.value)}
              options={[
                { value: 'all', label: t('all') || 'All' },
                { value: 'info', label: t('info') || 'Info' },
                { value: 'success', label: t('success') || 'Success' },
                { value: 'warning', label: t('warning') || 'Warning' },
                { value: 'error', label: t('error') || 'Error' },
              ]}
            />
          </div>
        </CardHeader>
        <CardBody>
          {error && (
            <div className="p-4 bg-danger/10 text-danger rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-text-secondary">{t('loading')}</div>
          ) : (
            <>
              <Table data={notifications} columns={columns} />
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-text-secondary">
                    {t('page')} {pagination.page} {t('of')} {pagination.totalPages} ({pagination.total} {t('total') || 'total'})
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      {t('previous')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= pagination.totalPages}
                    >
                      {t('next')}
                    </Button>
                  </div>
                </div>
              )}
              {!loading && notifications.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  {t('noNotifications') || t('noData') || 'No notifications found'}
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
