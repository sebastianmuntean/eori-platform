'use client';

import { Card, CardHeader } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterDate, FilterClear, ParishFilter, StatusFilter, TypeFilter, ClientFilter, FilterSelect } from '@/components/ui/FilterGrid';
import { Parish } from '@/hooks/useParishes';
import { Client } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';

interface ContractsFiltersCardProps {
  searchTerm: string;
  parishFilter: string;
  directionFilter: string;
  typeFilter: string;
  statusFilter: string;
  clientFilter: string;
  dateFrom: string;
  dateTo: string;
  parishes: Parish[];
  clients: Client[];
  onSearchChange: (value: string) => void;
  onParishFilterChange: (value: string) => void;
  onDirectionFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onClientFilterChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClearFilters: () => void;
}

/**
 * Card component for contract filters
 * Includes search, parish, direction, type, status, client, and date range filters
 */
export function ContractsFiltersCard({
  searchTerm,
  parishFilter,
  directionFilter,
  typeFilter,
  statusFilter,
  clientFilter,
  dateFrom,
  dateTo,
  parishes,
  clients,
  onSearchChange,
  onParishFilterChange,
  onDirectionFilterChange,
  onTypeFilterChange,
  onStatusFilterChange,
  onClientFilterChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
}: ContractsFiltersCardProps) {
  const t = useTranslations('common');

  return (
    <Card variant="outlined" className="mb-6">
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
          <FilterSelect
            label={t('direction')}
            value={directionFilter}
            onChange={onDirectionFilterChange}
            options={[
              { value: 'incoming', label: t('incoming') },
              { value: 'outgoing', label: t('outgoing') },
            ]}
          />
          <TypeFilter
            value={typeFilter}
            onChange={onTypeFilterChange}
            types={[
              { value: 'rental', label: t('rental') },
              { value: 'concession', label: t('concession') },
              { value: 'sale_purchase', label: t('salePurchase') },
              { value: 'loan', label: t('loan') },
              { value: 'other', label: t('other') },
            ]}
          />
          <StatusFilter
            value={statusFilter}
            onChange={onStatusFilterChange}
            statuses={[
              { value: 'draft', label: t('draft') },
              { value: 'active', label: t('active') },
              { value: 'expired', label: t('expired') },
              { value: 'terminated', label: t('terminated') },
            ]}
          />
          <ClientFilter
            value={clientFilter}
            onChange={onClientFilterChange}
            clients={clients}
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





