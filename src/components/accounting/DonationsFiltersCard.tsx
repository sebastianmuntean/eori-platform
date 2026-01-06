'use client';

import { Card, CardHeader } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterDate, FilterClear, ParishFilter, StatusFilter } from '@/components/ui/FilterGrid';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

interface DonationsFiltersCardProps {
  searchTerm: string;
  parishFilter: string;
  statusFilter: string;
  dateFrom: string;
  dateTo: string;
  parishes: Parish[];
  onSearchChange: (value: string) => void;
  onParishFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClearFilters: () => void;
}

/**
 * Card component for donation filters
 * Includes search, parish, status, and date range filters
 */
export function DonationsFiltersCard({
  searchTerm,
  parishFilter,
  statusFilter,
  dateFrom,
  dateTo,
  parishes,
  onSearchChange,
  onParishFilterChange,
  onStatusFilterChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
}: DonationsFiltersCardProps) {
  const t = useTranslations('common');

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
              { value: 'pending', label: t('pending') },
              { value: 'completed', label: t('completed') },
              { value: 'cancelled', label: t('cancelled') },
            ]}
          />
          <FilterDate
            label={t('dateFrom')}
            value={dateFrom}
            onChange={onDateFromChange}
          />
          <FilterDate
            label={t('dateTo')}
            value={dateTo}
            onChange={onDateToChange}
          />
          <FilterClear onClear={onClearFilters} />
        </FilterGrid>
      </CardHeader>
    </Card>
  );
}
