'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { HR_PERMISSIONS } from '@/lib/permissions/hr';
import { PageContainer } from '@/components/ui/PageContainer';
import { EmployeesPageContent } from '@/components/hr/EmployeesPageContent';

/**
 * Employees page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in EmployeesPageContent
 */
export default function EmployeesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle(`${t('employees')} - EORI`);

  // Check permission to access employees
  const { loading: permissionLoading } = useRequirePermission(HR_PERMISSIONS.EMPLOYEES_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <EmployeesPageContent locale={locale} />;
}

