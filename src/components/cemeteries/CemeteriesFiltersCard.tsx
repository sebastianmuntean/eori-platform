'use client';

import { Card, CardHeader } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, ParishFilter } from '@/components/ui/FilterGrid';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

interface CemeteriesFiltersCardProps {
  searchTerm: string;
  parishFilter: string;
  parishes: Parish[];
  onSearchChange: (value: string) => void;
  onParishFilterChange: (value: string) => void;
}

/**
 * Card component for cemetery filters
 * Includes search and parish filters
 */
export function CemeteriesFiltersCard({
  searchTerm,
  parishFilter,
  parishes,
  onSearchChange,
  onParishFilterChange,
}: CemeteriesFiltersCardProps) {
  const t = useTranslations('common');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4 mb-4">
          <SearchInput
            value={searchTerm}
            onChange={(value) => {
              onSearchChange(value);
            }}
            placeholder={`${t('search')} ${t('cemeteries') || 'cemeteries'}...`}
          />
          <FilterGrid>
            <ParishFilter
              parishes={parishes}
              value={parishFilter}
              onChange={onParishFilterChange}
            />
          </FilterGrid>
        </div>
      </CardHeader>
    </Card>
  );
}

