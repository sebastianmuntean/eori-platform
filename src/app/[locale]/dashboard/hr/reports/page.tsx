'use client';

import { useParams } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useTranslations } from 'next-intl';
import { HRReports } from '@/components/hr/HRReports';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { HR_PERMISSIONS } from '@/lib/permissions/hr';

export default function HRReportsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(t('reports'));

  // Check permission to view HR reports
  const { loading } = useRequirePermission(HR_PERMISSIONS.REPORTS_VIEW);

  // Don't render content while checking permissions
  if (loading) {
    return null;
  }

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: tMenu('hr') || 'Resurse Umane', href: `/${locale}/dashboard/hr` },
    { label: t('reports') },
  ];

  return (
    <div>
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbs} className="mb-2" />
        <h1 className="text-3xl font-bold text-text-primary">{t('reports')}</h1>
      </div>

      <HRReports />
    </div>
  );
}


