'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { Input } from '@/components/ui/Input';
import { FilterGrid, FilterClear, ParishFilter, FilterSelect } from '@/components/ui/FilterGrid';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

interface ProductsFiltersCardProps {
  searchTerm: string;
  parishFilter: string;
  categoryFilter: string;
  isActiveFilter: string;
  parishes: Parish[];
  onSearchChange: (value: string) => void;
  onParishFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onIsActiveFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

/**
 * Card component for product filters in pangare module
 * Includes search, parish, category, and status filters
 */
export function ProductsFiltersCard({
  searchTerm,
  parishFilter,
  categoryFilter,
  isActiveFilter,
  parishes,
  onSearchChange,
  onParishFilterChange,
  onCategoryFilterChange,
  onIsActiveFilterChange,
  onClearFilters,
}: ProductsFiltersCardProps) {
  const t = useTranslations('common');

  return (
    <Card variant="outlined" className="mb-6">
      <CardBody>
        <div className="space-y-4">
          <div className="flex gap-4">
            <SearchInput
              value={searchTerm}
              onChange={onSearchChange}
              placeholder={t('search') || 'Căutare...'}
            />
          </div>

          <FilterGrid>
            <ParishFilter
              value={parishFilter}
              onChange={onParishFilterChange}
              parishes={parishes}
            />
            <Input
              label={t('category') || 'Categorie'}
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              placeholder={t('filterByCategory') || 'Filtrează după categorie...'}
            />
            <FilterSelect
              label={t('status') || 'Status'}
              value={isActiveFilter}
              onChange={onIsActiveFilterChange}
              options={[
                { value: '', label: t('all') || 'Toate' },
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

