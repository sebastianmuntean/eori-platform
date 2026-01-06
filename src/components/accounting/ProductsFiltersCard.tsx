'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { ProductFilters } from '@/components/accounting/products/ProductFilters';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

interface ProductsFiltersCardProps {
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
}

/**
 * Card component for product filters
 * Includes search, parish, category, and status filters
 */
export function ProductsFiltersCard({
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
}: ProductsFiltersCardProps) {
  const t = useTranslations('common');

  return (
    <Card variant="outlined" className="mb-6">
      <CardBody>
        <ProductFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          parishFilter={parishFilter}
          onParishFilterChange={onParishFilterChange}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
          isActiveFilter={isActiveFilter}
          onIsActiveFilterChange={onIsActiveFilterChange}
          onClear={onClear}
          parishes={parishes}
          t={t}
        />
      </CardBody>
    </Card>
  );
}

