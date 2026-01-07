'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { SUPERADMIN_PERMISSIONS } from '@/lib/permissions/superadmin';
import { PageContainer } from '@/components/ui/PageContainer';
import { RolesPageContent } from '@/components/superadmin/roles/RolesPageContent';

/**
 * Roles page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in RolesPageContent
 */
export default function RolesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('roles'));

  // Check permission to access roles
  const { loading: permissionLoading } = useRequirePermission(SUPERADMIN_PERMISSIONS.ROLES_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <RolesPageContent locale={locale} />;
}

