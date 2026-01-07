'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { SUPERADMIN_PERMISSIONS } from '@/lib/permissions/superadmin';
import { PageContainer } from '@/components/ui/PageContainer';
import { PermissionsPageContent } from '@/components/superadmin/permissions/PermissionsPageContent';

/**
 * Permissions page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in PermissionsPageContent
 */
export default function PermissionsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('permissions'));

  // Check permission to access permissions
  const { loading: permissionLoading } = useRequirePermission(SUPERADMIN_PERMISSIONS.PERMISSIONS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <PermissionsPageContent locale={locale} />;
}

