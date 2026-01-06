import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear, ParishFilter, FilterSelect } from '@/components/ui/FilterGrid';
import { Input } from '@/components/ui/Input';
import { Parish } from '@/hooks/useParishes';

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  parishFilter: string;
  onParishFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  isActiveFilter: string;
  onIsActiveFilterChange: (value: string) => void;
  onClear: () => void;
  parishes: Parish[];
  t: (key: string) => string;
}

export function ProductFilters({
  searchTerm,
  onSearchChange,
  parishFilter,
  onParishFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  isActiveFilter,
  onIsActiveFilterChange,
  onClear,
  parishes,
  t,
}: ProductFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={t('search') || 'Search...'}
        />
      </div>
      <FilterGrid>
        <ParishFilter value={parishFilter} onChange={onParishFilterChange} parishes={parishes} />
        <Input
          label={t('category') || 'Category'}
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          placeholder={t('filterByCategory') || 'Filter by category...'}
        />
        <FilterSelect
          label={t('status') || 'Status'}
          value={isActiveFilter}
          onChange={onIsActiveFilterChange}
          options={[
            { value: '', label: t('all') || 'All' },
            { value: 'true', label: t('active') || 'Active' },
            { value: 'false', label: t('inactive') || 'Inactive' },
          ]}
        />
        <FilterClear onClear={onClear} />
      </FilterGrid>
    </div>
  );
}





