'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { useStockLevels, StockLevel } from '@/hooks/useStockLevels';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { FilterGrid, FilterClear, ParishFilter, FilterSelect } from '@/components/ui/FilterGrid';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';

export default function StockLevelsPage() {
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.STOCK_LEVELS_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('stockLevels'));

  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const {
    stockLevels,
    loading,
    error,
    fetchStockLevels,
    fetchLowStock,
  } = useStockLevels();

  const { parishes, fetchParishes } = useParishes();

  const [parishFilter, setParishFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  useEffect(() => {
    if (showLowStock) {
      fetchLowStock(parishFilter || undefined);
    } else {
      fetchStockLevels({
        parishId: parishFilter || undefined,
        warehouseId: warehouseFilter || undefined,
      });
    }
  }, [parishFilter, warehouseFilter, showLowStock, fetchStockLevels, fetchLowStock]);

  const columns: any[] = [
    {
      key: 'warehouse',
      label: t('warehouse') || 'Warehouse',
      sortable: false,
      render: (value: StockLevel['warehouse']) => value ? value.name : '-',
    },
    {
      key: 'product',
      label: t('product') || 'Product',
      sortable: false,
      render: (value: StockLevel['product']) => value ? value.name : '-',
    },
    {
      key: 'quantity',
      label: t('quantity') || 'Quantity',
      sortable: true,
      render: (value: number, row: StockLevel) => {
        const unit = row.product?.unit || '';
        const isLow = row.product?.minStock && value < row.product.minStock;
        return (
          <div className="flex items-center gap-2">
            <span>{value.toFixed(3)} {unit}</span>
            {isLow && (
              <Badge variant="warning" size="sm">
                {t('lowStock') || 'Low Stock'}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'totalValue',
      label: t('totalValue') || 'Total Value',
      sortable: true,
      render: (value: number) => `${value.toFixed(2)} RON`,
    },
    {
      key: 'lastMovementDate',
      label: t('lastMovement') || 'Last Movement',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('accounting') || 'Accounting', href: `/${locale}/dashboard/accounting` },
          { label: t('stockLevels') || 'Stock Levels', href: `/${locale}/dashboard/accounting/stock-levels` },
        ]}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t('stockLevels') || 'Stock Levels'}</h1>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <FilterGrid>
              <ParishFilter
                value={parishFilter}
                onChange={(value) => {
                  setParishFilter(value);
                }}
                parishes={parishes}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showLowStock"
                  checked={showLowStock}
                  onChange={(e) => setShowLowStock(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="showLowStock" className="text-sm">{t('showLowStock') || 'Show Low Stock Only'}</label>
              </div>
              <FilterClear
                onClear={() => {
                  setParishFilter('');
                  setWarehouseFilter('');
                  setShowLowStock(false);
                }}
              />
            </FilterGrid>

            {error && (
              <div className="p-4 bg-danger/10 text-danger rounded">
                {error}
              </div>
            )}

            <Table
              data={stockLevels}
              columns={columns}
              loading={loading}
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

