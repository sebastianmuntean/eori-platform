'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';
import { PermissionLoadingState } from '@/components/ui/PermissionLoadingState';
import { DeaneriesPageContent } from '@/components/administration/deaneries/DeaneriesPageContent';

/**
 * Deaneries page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in DeaneriesPageContent
 */
export default function DeaneriesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('deaneries'));

  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.DEANERIES_VIEW);

  if (permissionLoading) {
    return <PermissionLoadingState />;
  }

  return <DeaneriesPageContent locale={locale} />;
}

