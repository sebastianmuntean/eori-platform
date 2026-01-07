'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { PageContainer } from '@/components/ui/PageContainer';
import { WarehousesPageContent } from '@/components/accounting/warehouses/WarehousesPageContent';

/**
 * Warehouses page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in WarehousesPageContent
 */
export default function WarehousesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('warehouses'));

  // Check permission to access warehouses
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.WAREHOUSES_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <WarehousesPageContent locale={locale} />;
}

