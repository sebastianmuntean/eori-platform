'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear } from '@/components/ui/FilterGrid';
import { useTranslations } from 'next-intl';

interface SuppliersFiltersCardProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
}

/**
 * Card component for supplier filters
 * Includes search and clear filters functionality
 */
export function SuppliersFiltersCard({
  searchTerm,
  onSearchChange,
  onClearFilters,
}: SuppliersFiltersCardProps) {
  const t = useTranslations('common');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4 mb-4">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder={`${t('search')} ${t('suppliers')}...`}
          />
        </div>
        <FilterGrid>
          <FilterClear onClear={onClearFilters} />
        </FilterGrid>
      </CardHeader>
    </Card>
  );
}

