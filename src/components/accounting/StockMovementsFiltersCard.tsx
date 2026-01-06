'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { FilterGrid, FilterClear, ParishFilter, FilterSelect, FilterDate } from '@/components/ui/FilterGrid';
import { Parish } from '@/hooks/useParishes';
import { Warehouse } from '@/hooks/useWarehouses';
import { Product } from '@/hooks/useProducts';
import { useTranslations } from 'next-intl';

interface StockMovementsFiltersCardProps {
  parishFilter: string;
  warehouseFilter: string;
  productFilter: string;
  typeFilter: string;
  dateFrom: string;
  dateTo: string;
  parishes: Parish[];
  warehouses: Warehouse[];
  products: Product[];
  onParishFilterChange: (value: string) => void;
  onWarehouseFilterChange: (value: string) => void;
  onProductFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClear: () => void;
}

/**
 * Card component for stock movements filters
 * Includes parish, warehouse, product, type, and date range filters
 */
export function StockMovementsFiltersCard({
  parishFilter,
  warehouseFilter,
  productFilter,
  typeFilter,
  dateFrom,
  dateTo,
  parishes,
  warehouses,
  products,
  onParishFilterChange,
  onWarehouseFilterChange,
  onProductFilterChange,
  onTypeFilterChange,
  onDateFromChange,
  onDateToChange,
  onClear,
}: StockMovementsFiltersCardProps) {
  const t = useTranslations('common');

  return (
    <Card variant="outlined" className="mb-6">
      <CardBody>
        <FilterGrid>
          <ParishFilter
            value={parishFilter}
            onChange={onParishFilterChange}
            parishes={parishes}
          />
          <FilterSelect
            label={t('warehouse') || 'Warehouse'}
            value={warehouseFilter}
            onChange={onWarehouseFilterChange}
            options={[
              { value: '', label: t('all') || 'All' },
              ...warehouses.map((w) => ({ value: w.id, label: w.name })),
            ]}
          />
          <FilterSelect
            label={t('product') || 'Product'}
            value={productFilter}
            onChange={onProductFilterChange}
            options={[
              { value: '', label: t('all') || 'All' },
              ...products.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          <FilterSelect
            label={t('type') || 'Type'}
            value={typeFilter}
            onChange={onTypeFilterChange}
            options={[
              { value: '', label: t('all') || 'All' },
              { value: 'in', label: 'IN' },
              { value: 'out', label: 'OUT' },
              { value: 'transfer', label: 'TRANSFER' },
              { value: 'adjustment', label: 'ADJUSTMENT' },
              { value: 'return', label: 'RETURN' },
            ]}
          />
          <FilterDate
            label={t('dateFrom') || 'Date From'}
            value={dateFrom}
            onChange={onDateFromChange}
          />
          <FilterDate
            label={t('dateTo') || 'Date To'}
            value={dateTo}
            onChange={onDateToChange}
          />
          <FilterClear onClear={onClear} />
        </FilterGrid>
      </CardBody>
    </Card>
  );
}

