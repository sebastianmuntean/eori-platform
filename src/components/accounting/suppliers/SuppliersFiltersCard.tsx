'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear } from '@/components/ui/FilterGrid';
import { useTranslations } from 'next-intl';

interface SuppliersFiltersCardProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
}

/**
 * Card component for supplier filters
 * Includes search and clear filters functionality
 */
export function SuppliersFiltersCard({
  searchTerm,
  onSearchChange,
  onClear,
}: SuppliersFiltersCardProps) {
  const t = useTranslations('common');

  return (
    <Card variant="outlined" className="mb-6">
      <CardBody>
        <div className="flex items-center gap-4 mb-4">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder={`${t('search')} ${t('suppliers')}...`}
          />
        </div>
        <FilterGrid>
          <FilterClear onClear={onClear} />
        </FilterGrid>
      </CardBody>
    </Card>
  );
}

