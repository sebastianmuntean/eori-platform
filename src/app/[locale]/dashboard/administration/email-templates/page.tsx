'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';
import { PermissionLoadingState } from '@/components/ui/PermissionLoadingState';
import { EmailTemplatesPageContent } from '@/components/administration/email-templates/EmailTemplatesPageContent';

/**
 * Email Templates page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in EmailTemplatesPageContent
 */
export default function EmailTemplatesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('emailTemplates'));

  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.EMAIL_TEMPLATES_VIEW);

  if (permissionLoading) {
    return <PermissionLoadingState />;
  }

  return <EmailTemplatesPageContent locale={locale} />;
}

