'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear, ParishFilter, FilterSelect } from '@/components/ui/FilterGrid';
import { Parish } from '@/hooks/useParishes';
import { FIXED_ASSET_STATUS } from '@/lib/fixed-assets/constants';
import { getCategoryOptions } from '@/lib/fixed-assets/helpers';
import { useTranslations } from 'next-intl';

interface FixedAssetsFiltersCardProps {
  searchTerm: string;
  parishFilter: string;
  categoryFilter: string;
  statusFilter: string;
  parishes: Parish[];
  onSearchChange: (value: string) => void;
  onParishFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

/**
 * Card component for fixed assets filters
 * Includes search, parish, category, and status filters
 */
export function FixedAssetsFiltersCard({
  searchTerm,
  parishFilter,
  categoryFilter,
  statusFilter,
  parishes,
  onSearchChange,
  onParishFilterChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onClearFilters,
}: FixedAssetsFiltersCardProps) {
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

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
              label={t('category') || 'Category'}
              value={categoryFilter}
              onChange={onCategoryFilterChange}
              options={getCategoryOptions(tMenu)}
            />
            <FilterSelect
              label={t('status') || 'Status'}
              value={statusFilter}
              onChange={onStatusFilterChange}
              options={[
                { value: '', label: t('all') || 'All' },
                { value: FIXED_ASSET_STATUS.ACTIVE, label: t('active') || 'Active' },
                { value: FIXED_ASSET_STATUS.INACTIVE, label: t('inactive') || 'Inactive' },
                { value: FIXED_ASSET_STATUS.DISPOSED, label: t('disposed') || 'Disposed' },
                { value: FIXED_ASSET_STATUS.DAMAGED, label: t('damaged') || 'Damaged' },
              ]}
            />
            <FilterClear onClear={onClearFilters} />
          </FilterGrid>
        </div>
      </CardBody>
    </Card>
  );
}

