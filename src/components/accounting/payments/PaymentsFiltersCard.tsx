'use client';

import { Card, CardHeader } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterDate, FilterClear, ParishFilter, StatusFilter, TypeFilter } from '@/components/ui/FilterGrid';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

interface PaymentsFiltersCardProps {
  searchTerm: string;
  parishFilter: string;
  typeFilter: string;
  statusFilter: string;
  dateFrom: string;
  dateTo: string;
  parishes: Parish[];
  onSearchChange: (value: string) => void;
  onParishFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClear: () => void;
}

/**
 * Card component for payment filters
 * Includes search, parish, type, status, and date range filters
 */
export function PaymentsFiltersCard({
  searchTerm,
  parishFilter,
  typeFilter,
  statusFilter,
  dateFrom,
  dateTo,
  parishes,
  onSearchChange,
  onParishFilterChange,
  onTypeFilterChange,
  onStatusFilterChange,
  onDateFromChange,
  onDateToChange,
  onClear,
}: PaymentsFiltersCardProps) {
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
          <TypeFilter
            value={typeFilter}
            onChange={onTypeFilterChange}
            types={[
              { value: 'income', label: t('income') },
              { value: 'expense', label: t('expense') },
            ]}
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
          <FilterClear onClear={onClear} />
        </FilterGrid>
      </CardHeader>
    </Card>
  );
}

