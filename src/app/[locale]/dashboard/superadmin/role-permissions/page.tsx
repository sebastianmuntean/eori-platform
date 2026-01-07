'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { SUPERADMIN_PERMISSIONS } from '@/lib/permissions/superadmin';
import { PageContainer } from '@/components/ui/PageContainer';
import { RolePermissionsPageContent } from '@/components/superadmin/role-permissions/RolePermissionsPageContent';

/**
 * Role Permissions page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in RolePermissionsPageContent
 */
export default function RolePermissionsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('rolePermissions') || 'Role Permissions');

  // Check permission to access role permissions
  const { loading: permissionLoading } = useRequirePermission(SUPERADMIN_PERMISSIONS.ROLE_PERMISSIONS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <RolePermissionsPageContent locale={locale} />;
}

