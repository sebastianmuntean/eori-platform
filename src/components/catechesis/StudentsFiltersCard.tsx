'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useTranslations } from 'next-intl';

interface StudentsFiltersCardProps {
  searchTerm: string;
  isActiveFilter: boolean | '';
  onSearchChange: (value: string) => void;
  onIsActiveFilterChange: (value: boolean | '') => void;
}

/**
 * Card component for catechesis student filters
 * Includes search and status filters
 */
export function StudentsFiltersCard({
  searchTerm,
  isActiveFilter,
  onSearchChange,
  onIsActiveFilterChange,
}: StudentsFiltersCardProps) {
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');

  return (
    <Card>
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <select
            value={isActiveFilter.toString()}
            onChange={(e) => onIsActiveFilterChange(e.target.value === '' ? '' : e.target.value === 'true')}
            className="px-4 py-2 border border-border rounded-md bg-bg-primary text-text-primary"
          >
            <option value="">All Status</option>
            <option value="true">{tCatechesis('status.active')}</option>
            <option value="false">{tCatechesis('status.inactive')}</option>
          </select>
        </div>
      </CardBody>
    </Card>
  );
}

