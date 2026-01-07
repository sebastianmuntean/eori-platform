'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';
import { PermissionLoadingState } from '@/components/ui/PermissionLoadingState';
import { DepartmentsPageContent } from '@/components/administration/departments/DepartmentsPageContent';

/**
 * Departments page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in DepartmentsPageContent
 */
export default function DepartmentsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('departments'));

  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.DEPARTMENTS_VIEW);

  if (permissionLoading) {
    return <PermissionLoadingState />;
  }

  return <DepartmentsPageContent locale={locale} />;
}

