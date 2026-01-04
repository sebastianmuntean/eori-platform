'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { useStockLevels } from '@/hooks/useStockLevels';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { FilterGrid, ParishFilter, FilterSelect } from '@/components/ui/FilterGrid';

export default function PangarPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

  const { stockLevels, fetchStockLevels, loading } = useStockLevels();
  const { warehouses, fetchWarehouses } = useWarehouses();
  const { parishes, fetchParishes } = useParishes();

  const [parishFilter, setParishFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  useEffect(() => {
    fetchParishes({ all: true });
    fetchWarehouses({ pageSize: 1000 });
  }, [fetchParishes, fetchWarehouses]);

  useEffect(() => {
    // Fetch stock levels when filters are set, or fetch all if no filters
    fetchStockLevels({
      parishId: parishFilter || undefined,
      warehouseId: warehouseFilter || undefined,
    });
  }, [parishFilter, warehouseFilter, fetchStockLevels]);

  const columns: any[] = [
    {
      key: 'product',
      label: t('product') || 'Produs',
      sortable: true,
      render: (value: any, row: any) => (
        <div>
          <div className="font-medium">{value?.name || '-'}</div>
          {value?.code && (
            <div className="text-sm text-text-secondary">Cod: {value.code}</div>
          )}
        </div>
      ),
    },
    {
      key: 'warehouse',
      label: t('warehouse') || 'Gestiune',
      sortable: true,
      render: (value: any) => value?.name || '-',
    },
    {
      key: 'quantity',
      label: t('quantity') || 'Cantitate',
      sortable: true,
      render: (value: number, row: any) => `${value.toFixed(3)} ${row.product?.unit || ''}`,
    },
    {
      key: 'totalValue',
      label: t('value') || 'Valoare',
      sortable: true,
      render: (value: number) => `${value.toFixed(2)} RON`,
    },
    {
      key: 'lastMovementDate',
      label: t('lastMovement') || 'Ultima mișcare',
      sortable: true,
      render: (value: string) => value ? new Date(value).toLocaleDateString('ro-RO') : '-',
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tMenu('pangare') || 'Pangare', href: `/${locale}/dashboard/pangare` },
          { label: tMenu('pangar') || 'Pangar', href: `/${locale}/dashboard/pangare/pangar` },
        ]}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{tMenu('pangar') || 'Pangar'}</h1>
              <p className="text-sm text-text-secondary mt-1">
                {t('inventoryDisplay') || 'Afișare inventar produse stocate în pangare'}
              </p>
            </div>
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
              <FilterSelect
                label={t('warehouse') || 'Gestiune'}
                value={warehouseFilter}
                onChange={(value) => {
                  setWarehouseFilter(value);
                }}
                options={[
                  { value: '', label: t('all') || 'Toate' },
                  ...warehouses.map(w => ({ value: w.id, label: w.name })),
                ]}
              />
            </FilterGrid>

            {!loading && stockLevels.length === 0 && (
              <div className="text-center py-8 text-text-secondary">
                <p>{t('selectFiltersToViewInventory') || 'Selectați parohia sau gestiunea pentru a afișa inventarul'}</p>
                <p className="text-sm mt-2">{t('noData') || 'Nu există date'}</p>
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

