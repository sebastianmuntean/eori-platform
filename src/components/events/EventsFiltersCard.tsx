'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Parish } from '@/hooks/useParishes';
import { EventStatus } from '@/hooks/useEvents';
import { useTranslations } from 'next-intl';
import { VALID_EVENT_STATUSES, EVENT_STATUS_OPTIONS } from './constants';

interface EventsFiltersCardProps {
  searchTerm: string;
  parishFilter: string;
  statusFilter: EventStatus | '';
  dateFrom: string;
  dateTo: string;
  parishes: Parish[];
  onSearchChange: (value: string) => void;
  onParishFilterChange: (value: string) => void;
  onStatusFilterChange: (value: EventStatus | '') => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

/**
 * Shared card component for event filters (funerals, baptisms, weddings)
 * Includes search, parish, status, and date range filters
 */
export function EventsFiltersCard({
  searchTerm,
  parishFilter,
  statusFilter,
  dateFrom,
  dateTo,
  parishes,
  onSearchChange,
  onParishFilterChange,
  onStatusFilterChange,
  onDateFromChange,
  onDateToChange,
}: EventsFiltersCardProps) {
  const t = useTranslations('common');

  const handleStatusChange = (value: string) => {
    // Runtime validation for status filter
    if (VALID_EVENT_STATUSES.includes(value as EventStatus | '')) {
      onStatusFilterChange(value as EventStatus | '');
    }
  };

  return (
    <Card variant="outlined" className="mb-6">
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <select
            className="px-3 py-2 border border-border rounded-md bg-background text-text-primary"
            value={parishFilter}
            onChange={(e) => onParishFilterChange(e.target.value)}
          >
            <option value="">{t('allParishes')}</option>
            {parishes.map((parish) => (
              <option key={parish.id} value={parish.id}>
                {parish.name}
              </option>
            ))}
          </select>
          <select
            className="px-3 py-2 border border-border rounded-md bg-background text-text-primary"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">{t('allStatuses')}</option>
            {EVENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey) || option.fallback}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            type="date"
            placeholder={t('dateFrom')}
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
          <Input
            type="date"
            placeholder={t('dateTo')}
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>
      </CardBody>
    </Card>
  );
}

