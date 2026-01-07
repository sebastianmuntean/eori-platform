'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { HR_PERMISSIONS } from '@/lib/permissions/hr';
import { PageContainer } from '@/components/ui/PageContainer';
import { SalariesPageContent } from '@/components/hr/SalariesPageContent';

/**
 * Salaries page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in SalariesPageContent
 */
export default function SalariesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle(`${t('salaries')} - EORI`);

  // Check permission to access salaries
  const { loading: permissionLoading } = useRequirePermission(HR_PERMISSIONS.SALARIES_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <SalariesPageContent locale={locale} />;
}


