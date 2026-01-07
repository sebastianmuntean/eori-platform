'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardBody } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { useStockLevels } from '@/hooks/useStockLevels';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { StockLevelFilters } from '@/components/accounting/stock-levels/StockLevelFilters';
import { getStockLevelColumns } from '@/components/accounting/stock-levels/StockLevelColumns';
import { useStockLevelFilters } from '@/hooks/useStockLevelFilters';

interface StockLevelsPageContentProps {
  locale: string;
}

/**
 * Stock Levels page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function StockLevelsPageContent({ locale }: StockLevelsPageContentProps) {
  const t = useTranslations('common');

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

  // Memoize breadcrumbs to avoid recreating on every render
  const breadcrumbs = useMemo(
    () => [
      { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
      { label: t('accounting') || 'Accounting', href: `/${locale}/dashboard/accounting` },
      { label: t('stockLevels') || 'Stock Levels' },
    ],
    [locale, t]
  );

  // Get page title
  const pageTitle = t('stockLevels') || 'Stock Levels';

  // Fetch parishes on mount
  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  // Fetch stock levels when filters change
  useEffect(() => {
    if (filters.showLowStock) {
      fetchLowStock(filters.parishFilter || undefined);
    } else {
      fetchStockLevels({
        parishId: filters.parishFilter || undefined,
        warehouseId: filters.warehouseFilter || undefined,
      });
    }
  }, [filters.parishFilter, filters.warehouseFilter, filters.showLowStock, fetchStockLevels, fetchLowStock]);

  // Memoize filter handlers to prevent unnecessary re-renders
  const handleParishFilterChange = useCallback(
    (value: string) => {
      updateFilters({ parishFilter: value });
    },
    [updateFilters]
  );

  const handleShowLowStockChange = useCallback(
    (value: boolean) => {
      updateFilters({ showLowStock: value });
    },
    [updateFilters]
  );

  const handleFilterClear = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  return (
    <PageContainer>
      <PageHeader breadcrumbs={breadcrumbs} title={pageTitle} />

      <Card>
        <CardBody>
          <div className="space-y-4">
            <StockLevelFilters
              parishFilter={filters.parishFilter}
              onParishFilterChange={handleParishFilterChange}
              showLowStock={filters.showLowStock}
              onShowLowStockChange={handleShowLowStockChange}
              onClear={handleFilterClear}
              parishes={parishes}
              t={t}
            />

            {error && (
              <div className="mb-4 p-4 bg-danger/10 text-danger rounded-md border border-danger/20">
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

