'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { HR_PERMISSIONS } from '@/lib/permissions/hr';
import { PageContainer } from '@/components/ui/PageContainer';
import { LeaveManagementPageContent } from '@/components/hr/LeaveManagementPageContent';

/**
 * Leave Management page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in LeaveManagementPageContent
 */
export default function LeaveManagementPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle(`${t('leaveRequests')} - EORI`);

  // Check permission to access leave requests
  const { loading: permissionLoading } = useRequirePermission(HR_PERMISSIONS.LEAVE_REQUESTS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <LeaveManagementPageContent locale={locale} />;
}

