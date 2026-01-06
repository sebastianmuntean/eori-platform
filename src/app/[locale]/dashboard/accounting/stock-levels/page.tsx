'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { useStockLevels } from '@/hooks/useStockLevels';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { StockLevelFilters } from '@/components/accounting/stock-levels/StockLevelFilters';
import { getStockLevelColumns } from '@/components/accounting/stock-levels/StockLevelColumns';
import { useStockLevelFilters } from '@/hooks/useStockLevelFilters';

export default function StockLevelsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('stockLevels'));

  // Check permission to access stock levels
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.STOCK_LEVELS_VIEW);

  const {
    stockLevels,
    loading,
    error,
    fetchStockLevels,
    fetchLowStock,
  } = useStockLevels();

  const { parishes, fetchParishes } = useParishes();
  const { filters, updateFilters, clearFilters } = useStockLevelFilters();

  // Memoize columns to avoid recreating on every render
  const columns = useMemo(() => getStockLevelColumns(t), [t]);

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
  }, [permissionLoading, fetchParishes]);

  useEffect(() => {
    if (permissionLoading) return;

    if (filters.showLowStock) {
      fetchLowStock(filters.parishFilter || undefined);
    } else {
      fetchStockLevels({
        parishId: filters.parishFilter || undefined,
        warehouseId: filters.warehouseFilter || undefined,
      });
    }
  }, [permissionLoading, filters.parishFilter, filters.warehouseFilter, filters.showLowStock, fetchStockLevels, fetchLowStock]);

  const handleFilterClear = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('accounting') || 'Accounting', href: `/${locale}/dashboard/accounting` },
          { label: t('stockLevels') || 'Stock Levels' },
        ]}
        title={t('stockLevels') || 'Stock Levels'}
      />

      <Card>
        <CardBody>
          <div className="space-y-4">
            <StockLevelFilters
              parishFilter={filters.parishFilter}
              onParishFilterChange={(value) => updateFilters({ parishFilter: value })}
              showLowStock={filters.showLowStock}
              onShowLowStockChange={(value) => updateFilters({ showLowStock: value })}
              onClear={handleFilterClear}
              parishes={parishes}
              t={t}
            />

            {error && (
              <div className="p-4 bg-danger/10 text-danger rounded">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-text-secondary">{t('loading') || 'Loading...'}</div>
            ) : (
              <Table
                data={stockLevels}
                columns={columns}
                emptyMessage={t('noData') || 'No stock levels available'}
              />
            )}
          </div>
        </CardBody>
      </Card>
    </PageContainer>
  );
}

