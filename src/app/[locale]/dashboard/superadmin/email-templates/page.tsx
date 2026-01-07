'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';
import { PageContainer } from '@/components/ui/PageContainer';
import { EmailTemplatesPageContent } from '@/components/superadmin/email-templates/EmailTemplatesPageContent';

/**
 * Email Templates page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in EmailTemplatesPageContent
 */
export default function SuperadminEmailTemplatesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('emailTemplates') || t('emailTemplates'));

  // Check permission to access email templates
  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.EMAIL_TEMPLATES_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <EmailTemplatesPageContent locale={locale} />;
}

