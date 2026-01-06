'use client';

import { Card, CardHeader } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear, ParishFilter, StatusFilter } from '@/components/ui/FilterGrid';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

interface DepartmentsFiltersCardProps {
  searchTerm: string;
  parishFilter: string;
  statusFilter: string;
  parishes: Parish[];
  onSearchChange: (value: string) => void;
  onParishFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onClear?: () => void;
}

/**
 * Card component for department filters
 * Includes search, parish, and status filters
 */
export function DepartmentsFiltersCard({
  searchTerm,
  parishFilter,
  statusFilter,
  parishes,
  onSearchChange,
  onParishFilterChange,
  onStatusFilterChange,
  onClear,
}: DepartmentsFiltersCardProps) {
  const t = useTranslations('common');

  const handleClear = () => {
    onSearchChange('');
    onParishFilterChange('');
    onStatusFilterChange('');
    onClear?.();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4 mb-4">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder={t('search') + '...'}
          />
        </div>
        <FilterGrid>
          <ParishFilter
            value={parishFilter}
            onChange={onParishFilterChange}
            parishes={parishes}
          />
          <StatusFilter
            value={statusFilter}
            onChange={onStatusFilterChange}
            statuses={[
              { value: 'true', label: t('active') },
              { value: 'false', label: t('inactive') },
            ]}
          />
          {onClear && <FilterClear onClear={handleClear} />}
        </FilterGrid>
      </CardHeader>
    </Card>
  );
}

