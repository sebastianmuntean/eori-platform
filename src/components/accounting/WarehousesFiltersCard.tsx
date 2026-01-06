'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear, ParishFilter, FilterSelect } from '@/components/ui/FilterGrid';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { WAREHOUSE_TYPE_OPTIONS } from '@/lib/validations/warehouses';

interface WarehousesFiltersCardProps {
  searchTerm: string;
  parishFilter: string;
  typeFilter: string;
  isActiveFilter: string;
  parishes: Parish[];
  onSearchChange: (value: string) => void;
  onParishFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onIsActiveFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

/**
 * Card component for warehouse filters
 * Includes search, parish, type, and status filters
 */
export function WarehousesFiltersCard({
  searchTerm,
  parishFilter,
  typeFilter,
  isActiveFilter,
  parishes,
  onSearchChange,
  onParishFilterChange,
  onTypeFilterChange,
  onIsActiveFilterChange,
  onClearFilters,
}: WarehousesFiltersCardProps) {
  const t = useTranslations('common');

  return (
    <Card variant="outlined" className="mb-6">
      <CardBody>
        <div className="space-y-4">
          <div className="flex gap-4">
            <SearchInput
              value={searchTerm}
              onChange={onSearchChange}
              placeholder={t('search') || 'Search...'}
            />
          </div>

          <FilterGrid>
            <ParishFilter
              value={parishFilter}
              onChange={onParishFilterChange}
              parishes={parishes}
            />
            <FilterSelect
              label={t('type') || 'Type'}
              value={typeFilter}
              onChange={onTypeFilterChange}
              options={[
                { value: '', label: t('all') || 'All' },
                ...WAREHOUSE_TYPE_OPTIONS,
              ]}
            />
            <FilterSelect
              label={t('status') || 'Status'}
              value={isActiveFilter}
              onChange={onIsActiveFilterChange}
              options={[
                { value: '', label: t('all') || 'All' },
                { value: 'true', label: t('active') || 'Active' },
                { value: 'false', label: t('inactive') || 'Inactive' },
              ]}
            />
            <FilterClear onClear={onClearFilters} />
          </FilterGrid>
        </div>
      </CardBody>
    </Card>
  );
}

