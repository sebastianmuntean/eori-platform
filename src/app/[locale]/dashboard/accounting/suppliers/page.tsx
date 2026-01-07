'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { PageContainer } from '@/components/ui/PageContainer';
import { SuppliersPageContent } from '@/components/accounting/suppliers/SuppliersPageContent';

/**
 * Suppliers page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in SuppliersPageContent
 */
export default function SuppliersPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('suppliers'));

  // Check permission to access suppliers
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.SUPPLIERS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <SuppliersPageContent locale={locale} />;
}

