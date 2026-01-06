'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { useTranslations } from 'next-intl';
import { HRReports } from '@/components/hr/HRReports';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { HR_PERMISSIONS } from '@/lib/permissions/hr';
import { useHRBreadcrumbs } from '@/lib/hr/breadcrumbs';

export default function HRReportsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle(t('reports'));
  
  const breadcrumbs = useHRBreadcrumbs(locale, t('reports'));

  // Check permission to view HR reports
  const { loading } = useRequirePermission(HR_PERMISSIONS.REPORTS_VIEW);

  // Don't render content while checking permissions
  if (loading) {
    return null;
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('reports')}
      />

      <HRReports />
    </PageContainer>
  );
}


