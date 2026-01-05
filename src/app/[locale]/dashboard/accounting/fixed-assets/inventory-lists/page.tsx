'use client';

import { ReportPageWithCRUD } from '@/components/fixed-assets/ReportPageWithCRUD';
import { usePageLocale } from '@/hooks/usePageLocale';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { useTranslations } from 'next-intl';

export default function InventoryListsPage() {
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.FIXED_ASSETS_VIEW);
  const { href } = usePageLocale();
  const t = useTranslations('common');

  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <ReportPageWithCRUD
      title="Liste de inventar"
      titleKey="inventoryLists"
      href={href}
    />
  );
}
