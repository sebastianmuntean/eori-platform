'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useTranslations } from 'next-intl';
import { useUsers, User } from '@/hooks/useUsers';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';

type NotificationType = 'info' | 'warning' | 'error' | 'success';

const isValidNotificationType = (value: string): value is NotificationType => {
  return ['info', 'success', 'warning', 'error'].includes(value);
};

export default function SendNotificationPage() {
  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.NOTIFICATIONS_SEND);
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const t = useTranslations('common');
  const { toasts, error: showError, success: showSuccess, removeToast } = useToast();

  const { users, loading: usersLoading, fetchUsers } = useUsers();

  const [formData, setFormData] = useState({
    userIds: [] as string[],
    title: '',
    message: '',
    type: 'info' as NotificationType,
    module: '',
    link: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers({ page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' });
  }, [fetchUsers]);

  // Memoize filtered users for performance
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        if (!userSearch) return true;
        const searchLower = userSearch.toLowerCase();
        return (
          (user.name?.toLowerCase().includes(searchLower) || false) ||
          user.email.toLowerCase().includes(searchLower)
        );
      })
      .filter((user) => !formData.userIds.includes(user.id));
  }, [users, userSearch, formData.userIds]);

  // Cleanup redirect timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [redirectTimer]);

  const handleAddUser = useCallback((user: User) => {
    if (!formData.userIds.includes(user.id)) {
      setFormData((prev) => ({
        ...prev,
        userIds: [...prev.userIds, user.id],
      }));
    }
    setUserSearch('');
    setIsUserDropdownOpen(false);
  }, [formData.userIds]);

  const handleRemoveUser = useCallback((userId: string) => {
    setFormData((prev) => ({
      ...prev,
      userIds: prev.userIds.filter((id) => id !== userId),
    }));
  }, []);

  const getSelectedUsers = useCallback(() => {
    return users.filter((user) => formData.userIds.includes(user.id));
  }, [users, formData.userIds]);

  const handleTypeChange = useCallback((value: string) => {
    if (isValidNotificationType(value)) {
      setFormData((prev) => ({ ...prev, type: value }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.userIds.length === 0) {
      const errorMsg = t('selectAtLeastOneRecipient') || 'Please select at least one recipient';
      setError(errorMsg);
      showError(errorMsg);
      return;
    }
    if (!formData.title.trim()) {
      const errorMsg = t('titleRequired') || 'Title is required';
      setError(errorMsg);
      showError(errorMsg);
      return;
    }
    if (!formData.message.trim()) {
      const errorMsg = t('messageRequired') || 'Message is required';
      setError(errorMsg);
      showError(errorMsg);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: formData.userIds,
          title: formData.title.trim(),
          message: formData.message.trim(),
          type: formData.type,
          module: formData.module.trim() || undefined,
          link: formData.link.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to send notifications');
      }

      const successMsg = t('notificationsSentSuccessfully') || `Notifications sent successfully to ${formData.userIds.length} user(s)`;
      showSuccess(successMsg);
      
      // Reset form
      setFormData({
        userIds: [],
        title: '',
        message: '',
        type: 'info',
        module: '',
        link: '',
      });
      setUserSearch('');

      // Redirect after 2 seconds with cleanup
      const timer = setTimeout(() => {
        router.push(`/${locale}/dashboard/administration/notifications`);
      }, 2000);
      setRedirectTimer(timer);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send notifications';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error sending notifications:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (permissionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  const selectedUsers = getSelectedUsers();

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('breadcrumbAdministration'), href: `/${locale}/dashboard/administration` },
          { label: t('sendNotification') || 'Send Notification' },
        ]}
        title={t('sendNotification') || 'Send Notification'}
      />

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipients */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('recipients') || 'Recipients'} <span className="text-danger">*</span>
              </label>
              
              {/* Selected users */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedUsers.map((user) => (
                    <Badge
                      key={user.id}
                      variant="primary"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {user.name || user.email} ({user.email})
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(user.id)}
                        className="ml-1 hover:text-danger"
                        aria-label={`Remove ${user.name || user.email}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* User search and selection */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t('searchUsers') || 'Search users by name or email...'}
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setIsUserDropdownOpen(true);
                  }}
                  onFocus={() => setIsUserDropdownOpen(true)}
                  onBlur={() => {
                    // Delay closing to allow clicks on dropdown items
                    setTimeout(() => setIsUserDropdownOpen(false), 200);
                  }}
                  disabled={usersLoading}
                />
                {isUserDropdownOpen && filteredUsers.length > 0 && (
                  <div 
                    className="absolute z-10 w-full mt-1 bg-bg-primary border border-border rounded-md shadow-lg max-h-60 overflow-auto"
                    onMouseDown={(e) => e.preventDefault()} // Prevent onBlur from firing
                  >
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleAddUser(user)}
                        className="w-full px-4 py-2 text-left hover:bg-bg-secondary focus:bg-bg-secondary focus:outline-none"
                      >
                        <div className="font-medium text-text-primary">{user.name || user.email}</div>
                        <div className="text-sm text-text-secondary">{user.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {usersLoading && (
                <p className="mt-1 text-sm text-text-secondary">{t('loading')}</p>
              )}
            </div>

            {/* Title */}
            <Input
              label={`${t('title') || 'Title'} *`}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder={t('enterTitle') || 'Enter notification title'}
            />

            {/* Message */}
            <Textarea
              label={`${t('message') || 'Message'} *`}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={6}
              placeholder={t('enterMessage') || 'Enter notification message'}
            />

            {/* Type */}
            <Select
              label={`${t('type') || 'Type'} *`}
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              options={[
                { value: 'info', label: t('info') || 'Info' },
                { value: 'success', label: t('success') || 'Success' },
                { value: 'warning', label: t('warning') || 'Warning' },
                { value: 'error', label: t('error') || 'Error' },
              ]}
              required
            />

            {/* Module (optional) */}
            <Input
              label={t('module') || 'Module'}
              value={formData.module}
              onChange={(e) => setFormData({ ...formData, module: e.target.value })}
              placeholder={t('enterModule') || 'Enter module name (optional)'}
              helperText={t('moduleHelperText') || 'Optional: Track which module generated this notification'}
            />

            {/* Link (optional) */}
            <Input
              label={t('link') || 'Link'}
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder={t('enterLink') || 'Enter link URL (optional)'}
              helperText={t('linkHelperText') || 'Optional: Link to related resource'}
            />

            {/* Error message */}
            {error && (
              <div className="p-4 bg-danger/10 border border-danger rounded text-danger">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${locale}/dashboard/administration/notifications`)}
                disabled={loading}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" isLoading={loading} disabled={loading}>
                {t('send') || t('sendNotification') || 'Send Notification'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </PageContainer>
  );
}
