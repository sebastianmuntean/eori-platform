'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { PageContainer } from '@/components/ui/PageContainer';
import { StockMovementsPageContent } from '@/components/accounting/stock-movements/StockMovementsPageContent';

/**
 * Stock Movements page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in StockMovementsPageContent
 */
export default function StockMovementsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('stockMovements'));

  // Check permission to access stock movements
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.STOCK_MOVEMENTS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <StockMovementsPageContent locale={locale} />;
}

