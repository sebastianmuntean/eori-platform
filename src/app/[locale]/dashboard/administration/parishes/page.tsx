'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';
import { PermissionLoadingState } from '@/components/ui/PermissionLoadingState';
import { ParishesPageContent } from '@/components/administration/parishes/ParishesPageContent';

/**
 * Parishes page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in ParishesPageContent
 */
export default function ParishesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('parishes'));

  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.PARISHES_VIEW);

  if (permissionLoading) {
    return <PermissionLoadingState />;
  }

  return <ParishesPageContent locale={locale} />;
}

