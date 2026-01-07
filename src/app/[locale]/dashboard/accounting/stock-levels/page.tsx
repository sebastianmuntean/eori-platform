'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { PageContainer } from '@/components/ui/PageContainer';
import { StockLevelsPageContent } from '@/components/accounting/stock-levels/StockLevelsPageContent';

/**
 * Stock Levels page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in StockLevelsPageContent
 */
export default function StockLevelsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('stockLevels'));

  // Check permission to access stock levels
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.STOCK_LEVELS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <StockLevelsPageContent locale={locale} />;
}

