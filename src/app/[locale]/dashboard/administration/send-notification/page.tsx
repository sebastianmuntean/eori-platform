'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';
import { PermissionLoadingState } from '@/components/ui/PermissionLoadingState';
import { SendNotificationPageContent } from '@/components/administration/send-notification/SendNotificationPageContent';

/**
 * Send Notification page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in SendNotificationPageContent
 */
export default function SendNotificationPage() {
  const params = useParams();
  const locale = params.locale as string;
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('sendNotification') || 'Send Notification');

  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.NOTIFICATIONS_SEND);

  if (permissionLoading) {
    return <PermissionLoadingState />;
  }

  return <SendNotificationPageContent locale={locale} />;
}
