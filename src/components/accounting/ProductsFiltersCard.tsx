'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { ProductFilters } from '@/components/accounting/products/ProductFilters';
import { useTranslations } from 'next-intl';

interface ProductsFiltersCardProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  isActiveFilter: string;
  onIsActiveFilterChange: (value: string) => void;
  onClear: () => void;
}

/**
 * Card component for product filters
 * Includes search, parish, category, and status filters
 */
export function ProductsFiltersCard({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  isActiveFilter,
  onIsActiveFilterChange,
  onClear,
}: ProductsFiltersCardProps) {
  const t = useTranslations('common');

  return (
    <Card variant="outlined" className="mb-6">
      <CardBody>
        <ProductFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
          isActiveFilter={isActiveFilter}
          onIsActiveFilterChange={onIsActiveFilterChange}
          onClear={onClear}
          t={t}
        />
      </CardBody>
    </Card>
  );
}

