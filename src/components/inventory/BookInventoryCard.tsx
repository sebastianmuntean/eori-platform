'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { FilterGrid, FilterClear, ParishFilter, FilterSelect } from '@/components/ui/FilterGrid';
import { BookInventoryItem } from '@/hooks/useInventory';
import { Parish } from '@/hooks/useParishes';
import { Warehouse } from '@/hooks/useWarehouses';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

interface BookInventoryCardProps {
  title: string;
  data: BookInventoryItem[];
  columns: any[];
  loading: boolean;
  emptyMessage: string;
  parishes: Parish[];
  warehouses: Warehouse[];
  parishFilter: string;
  warehouseFilter: string;
  typeFilter: string;
  onParishFilterChange: (value: string) => void;
  onWarehouseFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onClearFilters: () => void;
  onStartInventory: () => void;
  onSpotCheck: (item: BookInventoryItem) => void;
}

/**
 * Card component for displaying book inventory items
 * Includes filters, table, and action button
 */
export function BookInventoryCard({
  title,
  data,
  columns,
  loading,
  emptyMessage,
  parishes,
  warehouses,
  parishFilter,
  warehouseFilter,
  typeFilter,
  onParishFilterChange,
  onWarehouseFilterChange,
  onTypeFilterChange,
  onClearFilters,
  onStartInventory,
}: BookInventoryCardProps) {
  const t = useTranslations('common');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <Button onClick={onStartInventory}>
            {t('startInventory') || 'Începe Inventar'}
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <FilterGrid>
            <ParishFilter
              value={parishFilter}
              onChange={onParishFilterChange}
              parishes={parishes}
            />
            <FilterSelect
              label={t('warehouse') || 'Gestiune'}
              value={warehouseFilter}
              onChange={onWarehouseFilterChange}
              options={[
                { value: '', label: t('all') || 'Toate' },
                ...warehouses.map((w) => ({ value: w.id, label: w.name })),
              ]}
            />
            <FilterSelect
              label={t('type') || 'Tip'}
              value={typeFilter}
              onChange={onTypeFilterChange}
              options={[
                { value: '', label: t('all') || 'Toate' },
                { value: 'product', label: t('product') || 'Produse' },
                { value: 'fixed_asset', label: t('fixedAsset') || 'Mijloace Fixe' },
              ]}
            />
            <FilterClear onClear={onClearFilters} />
          </FilterGrid>

          {loading ? (
            <div className="text-center py-8 text-text-secondary">{t('loading') || 'Loading...'}</div>
          ) : (
            <Table data={data} columns={columns} emptyMessage={emptyMessage} />
          )}
        </div>
      </CardBody>
    </Card>
  );
}

