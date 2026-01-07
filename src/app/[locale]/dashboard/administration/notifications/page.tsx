'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';
import { PermissionLoadingState } from '@/components/ui/PermissionLoadingState';
import { NotificationsPageContent } from '@/components/administration/notifications/NotificationsPageContent';

/**
 * Notifications page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in NotificationsPageContent
 */
export default function NotificationsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('notifications'));

  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.NOTIFICATIONS_VIEW);

  if (permissionLoading) {
    return <PermissionLoadingState />;
  }

  return <NotificationsPageContent locale={locale} />;
}
