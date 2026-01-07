'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { PageContainer } from '@/components/ui/PageContainer';
import { ProductsPageContent } from '@/components/accounting/products/ProductsPageContent';

/**
 * Products page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in ProductsPageContent
 */
export default function ProductsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('products'));

  // Check permission to access products
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.PRODUCTS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <ProductsPageContent locale={locale} />;
}

