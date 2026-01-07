'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { HR_PERMISSIONS } from '@/lib/permissions/hr';
import { PageContainer } from '@/components/ui/PageContainer';
import { TimeTrackingPageContent } from '@/components/hr/TimeTrackingPageContent';

/**
 * Time Tracking page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in TimeTrackingPageContent
 */
export default function TimeTrackingPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle(`${t('timeEntries')} - EORI`);

  // Check permission to access time entries
  const { loading: permissionLoading } = useRequirePermission(HR_PERMISSIONS.TIME_ENTRIES_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <TimeTrackingPageContent locale={locale} />;
}


