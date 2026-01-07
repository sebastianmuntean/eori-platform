'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { HR_PERMISSIONS } from '@/lib/permissions/hr';
import { PageContainer } from '@/components/ui/PageContainer';
import { ContractsPageContent } from '@/components/hr/ContractsPageContent';

/**
 * Contracts page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in ContractsPageContent
 */
export default function ContractsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle(`${t('employmentContracts')} - EORI`);

  // Check permission to access contracts
  const { loading: permissionLoading } = useRequirePermission(HR_PERMISSIONS.CONTRACTS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <ContractsPageContent locale={locale} />;
}


