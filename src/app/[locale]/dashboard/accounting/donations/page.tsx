'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { PageContainer } from '@/components/ui/PageContainer';
import { DonationsPageContent } from '@/components/accounting/donations/DonationsPageContent';

/**
 * Donations page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in DonationsPageContent
 */
export default function DonationsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('donations'));

  // Check permission to access donations
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.DONATIONS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <DonationsPageContent locale={locale} />;
}

