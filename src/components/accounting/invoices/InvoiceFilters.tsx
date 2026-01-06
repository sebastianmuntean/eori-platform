import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterDate, FilterClear, ParishFilter, StatusFilter, TypeFilter, ClientFilter } from '@/components/ui/FilterGrid';
import { Parish } from '@/hooks/useParishes';
import { Client } from '@/hooks/useClients';

interface InvoiceFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  parishFilter: string;
  onParishFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  clientFilter: string;
  onClientFilterChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  onClear: () => void;
  parishes: Parish[];
  clients: Client[];
  t: (key: string) => string;
}

export function InvoiceFilters({
  searchTerm,
  onSearchChange,
  parishFilter,
  onParishFilterChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  clientFilter,
  onClientFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClear,
  parishes,
  clients,
  t,
}: InvoiceFiltersProps) {
  return (
    <>
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
            { value: 'issued', label: t('issued') },
            { value: 'received', label: t('received') },
          ]}
        />
        <StatusFilter
          value={statusFilter}
          onChange={onStatusFilterChange}
          statuses={[
            { value: 'draft', label: t('draft') },
            { value: 'sent', label: t('sent') },
            { value: 'paid', label: t('paid') },
            { value: 'overdue', label: t('overdue') },
            { value: 'cancelled', label: t('cancelled') },
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
        <FilterClear onClear={onClear} />
      </FilterGrid>
    </>
  );
}





