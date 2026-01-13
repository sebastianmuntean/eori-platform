import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear, FilterSelect } from '@/components/ui/FilterGrid';
import { Input } from '@/components/ui/Input';

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  isActiveFilter: string;
  onIsActiveFilterChange: (value: string) => void;
  onClear: () => void;
  t: (key: string) => string;
}

export function ProductFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  isActiveFilter,
  onIsActiveFilterChange,
  onClear,
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





