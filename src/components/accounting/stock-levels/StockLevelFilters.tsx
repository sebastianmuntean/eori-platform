import { FilterGrid, FilterClear, ParishFilter } from '@/components/ui/FilterGrid';
import { Parish } from '@/hooks/useParishes';

interface StockLevelFiltersProps {
  parishFilter: string;
  onParishFilterChange: (value: string) => void;
  showLowStock: boolean;
  onShowLowStockChange: (value: boolean) => void;
  onClear: () => void;
  parishes: Parish[];
  t: (key: string) => string;
}

export function StockLevelFilters({
  parishFilter,
  onParishFilterChange,
  showLowStock,
  onShowLowStockChange,
  onClear,
  parishes,
  t,
}: StockLevelFiltersProps) {
  return (
    <FilterGrid>
      <ParishFilter value={parishFilter} onChange={onParishFilterChange} parishes={parishes} />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showLowStock"
          checked={showLowStock}
          onChange={(e) => onShowLowStockChange(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="showLowStock" className="text-sm">
          {t('showLowStock') || 'Show Low Stock Only'}
        </label>
      </div>
      <FilterClear onClear={onClear} />
    </FilterGrid>
  );
}





