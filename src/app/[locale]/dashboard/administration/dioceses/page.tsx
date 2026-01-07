'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';
import { PermissionLoadingState } from '@/components/ui/PermissionLoadingState';
import { DiocesesPageContent } from '@/components/administration/dioceses/DiocesesPageContent';

/**
 * Dioceses page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in DiocesesPageContent
 */
export default function DiocesesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('dioceses'));

  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.DIOCESES_VIEW);

  if (permissionLoading) {
    return <PermissionLoadingState />;
  }

  return <DiocesesPageContent locale={locale} />;
}

