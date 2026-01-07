'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PARISHIONERS_PERMISSIONS } from '@/lib/permissions/parishioners';
import { PageContainer } from '@/components/ui/PageContainer';
import { ParishionerContractsPageContent } from '@/components/parishioners/contracts/ParishionerContractsPageContent';

/**
 * Parishioner Contracts page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in ParishionerContractsPageContent
 */
export default function ParishionerContractsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle(t('contracts') || 'Contracts - EORI');

  // Check permission to access contracts
  const { loading: permissionLoading } = useRequirePermission(PARISHIONERS_PERMISSIONS.CONTRACTS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <ParishionerContractsPageContent locale={locale} />;
}