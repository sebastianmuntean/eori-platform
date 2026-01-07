'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';
import { PermissionLoadingState } from '@/components/ui/PermissionLoadingState';
import { SendEmailPageContent } from '@/components/administration/send-email/SendEmailPageContent';

/**
 * Send Email page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in SendEmailPageContent
 */
export default function SendEmailPage() {
  const params = useParams();
  const locale = params.locale as string;
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('sendEmail') || 'Send Email');

  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.EMAIL_TEMPLATES_SEND);

  if (permissionLoading) {
    return <PermissionLoadingState />;
  }

  return <SendEmailPageContent locale={locale} />;
}

