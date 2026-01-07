'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';
import { PermissionLoadingState } from '@/components/ui/PermissionLoadingState';
import { UsersPageContent } from '@/components/administration/users/UsersPageContent';

/**
 * Users page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in UsersPageContent
 */
export default function UtilizatoriPage() {
  const params = useParams();
  const locale = params.locale as string;
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('users'));

  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.USERS_VIEW);

  if (permissionLoading) {
    return <PermissionLoadingState />;
  }

  return <UsersPageContent locale={locale} />;
}

