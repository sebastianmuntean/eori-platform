'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { SUPERADMIN_PERMISSIONS } from '@/lib/permissions/superadmin';
import { PageContainer } from '@/components/ui/PageContainer';
import { UserRolesPageContent } from '@/components/superadmin/user-roles/UserRolesPageContent';

/**
 * User Roles page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in UserRolesPageContent
 */
export default function UserRolesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('userRoles') || 'User Roles');

  // Check permission to access user roles
  const { loading: permissionLoading } = useRequirePermission(SUPERADMIN_PERMISSIONS.USER_ROLES_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <UserRolesPageContent locale={locale} />;
}

