'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { Input } from '@/components/ui/Input';
import { FilterGrid, FilterClear, FilterSelect } from '@/components/ui/FilterGrid';
import { useTranslations } from 'next-intl';

interface ProductsFiltersCardProps {
  searchTerm: string;
  categoryFilter: string;
  isActiveFilter: string;
  onSearchChange: (value: string) => void;
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
  categoryFilter,
  isActiveFilter,
  onSearchChange,
  onCategoryFilterChange,
  onIsActiveFilterChange,
  onClearFilters,
}: ProductsFiltersCardProps) {
  const t = useTranslations('common');

  return (
    <Card variant="outlined" className="mb-6">
      <CardBody>
        <FilterGrid>
          <div className="min-w-[200px] max-w-[250px]">
            <SearchInput
              value={searchTerm}
              onChange={onSearchChange}
              placeholder={t('search') || 'Căutare...'}
              className="w-full"
            />
          </div>
          <div className="min-w-[180px] max-w-[220px]">
            <Input
              label={t('category') || 'Categorie'}
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              placeholder={t('filterByCategory') || 'Filtrează după categorie...'}
            />
          </div>
          <div className="min-w-[150px] max-w-[180px]">
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
          </div>
          <FilterClear onClear={onClearFilters} />
        </FilterGrid>
      </CardBody>
    </Card>
  );
}

