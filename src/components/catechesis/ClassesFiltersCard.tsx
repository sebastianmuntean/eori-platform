'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Parish } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

interface ClassesFiltersCardProps {
  searchTerm: string;
  parishFilter: string;
  gradeFilter: string;
  isActiveFilter: boolean | '';
  parishes: Parish[];
  onSearchChange: (value: string) => void;
  onParishFilterChange: (value: string) => void;
  onGradeFilterChange: (value: string) => void;
  onIsActiveFilterChange: (value: boolean | '') => void;
}

/**
 * Card component for catechesis class filters
 * Includes search, parish, grade, and status filters
 */
export function ClassesFiltersCard({
  searchTerm,
  parishFilter,
  gradeFilter,
  isActiveFilter,
  parishes,
  onSearchChange,
  onParishFilterChange,
  onGradeFilterChange,
  onIsActiveFilterChange,
}: ClassesFiltersCardProps) {
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');

  return (
    <Card variant="outlined">
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Select
            value={parishFilter}
            onChange={(e) => onParishFilterChange(e.target.value)}
            options={[
              { value: '', label: t('allParishes') || 'All Parishes' },
              ...parishes.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          <Select
            value={isActiveFilter.toString()}
            onChange={(e) => onIsActiveFilterChange(e.target.value === '' ? '' : e.target.value === 'true')}
            options={[
              { value: '', label: t('allStatuses') || 'All Status' },
              { value: 'true', label: tCatechesis('status.active') },
              { value: 'false', label: tCatechesis('status.inactive') },
            ]}
          />
          <Input
            placeholder={tCatechesis('classes.grade')}
            value={gradeFilter}
            onChange={(e) => onGradeFilterChange(e.target.value)}
          />
        </div>
      </CardBody>
    </Card>
  );
}

