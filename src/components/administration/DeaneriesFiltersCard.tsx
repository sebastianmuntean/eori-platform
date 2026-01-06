'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Diocese } from '@/hooks/useDioceses';
import { useTranslations } from 'next-intl';

interface DeaneriesFiltersCardProps {
  searchTerm: string;
  dioceseFilter: string;
  dioceses: Diocese[];
  diocesesLoading?: boolean;
  onSearchChange: (value: string) => void;
  onDioceseFilterChange: (value: string) => void;
}

/**
 * Card component for deanery filters
 * Includes search and diocese filter
 * Uses Select component for consistency with other form components
 */
export function DeaneriesFiltersCard({
  searchTerm,
  dioceseFilter,
  dioceses,
  diocesesLoading = false,
  onSearchChange,
  onDioceseFilterChange,
}: DeaneriesFiltersCardProps) {
  const t = useTranslations('common');

  const dioceseOptions = [
    { value: '', label: t('allDioceses') || 'All Dioceses' },
    ...dioceses.map((diocese) => ({
      value: diocese.id,
      label: diocese.name,
    })),
  ];

  return (
    <Card variant="outlined" className="mb-6">
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder={t('search') || 'Search deaneries...'}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Select
            value={dioceseFilter}
            onChange={(e) => onDioceseFilterChange(e.target.value)}
            options={dioceseOptions}
            placeholder={diocesesLoading ? (t('loading') || 'Loading...') : (t('allDioceses') || 'All Dioceses')}
            disabled={diocesesLoading}
          />
        </div>
      </CardBody>
    </Card>
  );
}
