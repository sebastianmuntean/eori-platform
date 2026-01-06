'use client';

import { Card, CardHeader } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear, TypeFilter } from '@/components/ui/FilterGrid';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

interface ClientsFiltersCardProps {
  searchTerm: string;
  typeFilter: string;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

/**
 * Card component for client filters
 * Includes search input and type filter
 */
export function ClientsFiltersCard({
  searchTerm,
  typeFilter,
  onSearchChange,
  onTypeFilterChange,
  onClearFilters,
}: ClientsFiltersCardProps) {
  const t = useTranslations('common');

  // Client type filter options
  const typeOptions = useMemo(
    () => [
      { value: 'person', label: t('person') || 'Person' },
      { value: 'company', label: t('company') || 'Company' },
      { value: 'organization', label: t('organization') || 'Organization' },
    ],
    [t]
  );

  return (
    <Card variant="outlined" className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-4 mb-4">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder={`${t('search')} ${t('clients')}...`}
          />
        </div>
        <FilterGrid>
          <TypeFilter value={typeFilter} onChange={onTypeFilterChange} types={typeOptions} />
          <FilterClear onClear={onClearFilters} />
        </FilterGrid>
      </CardHeader>
    </Card>
  );
}

