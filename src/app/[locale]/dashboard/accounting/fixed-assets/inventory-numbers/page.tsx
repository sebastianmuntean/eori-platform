'use client';

import { ReportPageWithCRUD } from '@/components/fixed-assets/ReportPageWithCRUD';
import { usePageLocale } from '@/hooks/usePageLocale';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { useTranslations } from 'next-intl';

/**
 * Inventory Numbers Register Page
 * 
 * Displays a complete register of all fixed asset inventory numbers
 * with full CRUD functionality (Create, Read, Update, Delete).
 * 
 * This page uses the ReportPageWithCRUD component which provides:
 * - List view with search and filtering
 * - Parish filtering
 * - Add/Edit/Delete modals
 * - Category-based organization
 * 
 * @component
 */
export default function InventoryNumbersRegisterPage() {
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.FIXED_ASSETS_VIEW);
  const { href } = usePageLocale();
  const t = useTranslations('common');

  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <ReportPageWithCRUD
      title="Registrul numerelor de inventar"
      titleKey="inventoryNumbersRegister"
      href={href}
    />
  );
}
