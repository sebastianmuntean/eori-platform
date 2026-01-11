'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Parish } from '@/hooks/useParishes';
import { EventType, EventStatus } from '@/hooks/useEvents';
import { useTranslations } from 'next-intl';
import { VALID_EVENT_STATUSES, EVENT_STATUS_OPTIONS, EVENT_TYPES } from './constants';

interface EventsFiltersCardWithTypeProps {
  searchTerm: string;
  parishFilter: string;
  typeFilter: EventType | '';
  statusFilter: EventStatus | '';
  dateFrom: string;
  dateTo: string;
  parishes: Parish[];
  onSearchChange: (value: string) => void;
  onParishFilterChange: (value: string) => void;
  onTypeFilterChange: (value: EventType | '') => void;
  onStatusFilterChange: (value: EventStatus | '') => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

/**
 * Extended filters card component for main events page
 * Includes type filter in addition to standard filters
 */
export function EventsFiltersCardWithType({
  searchTerm,
  parishFilter,
  typeFilter,
  statusFilter,
  dateFrom,
  dateTo,
  parishes,
  onSearchChange,
  onParishFilterChange,
  onTypeFilterChange,
  onStatusFilterChange,
  onDateFromChange,
  onDateToChange,
}: EventsFiltersCardWithTypeProps) {
  const t = useTranslations('common');

  const handleStatusChange = (value: string) => {
    if (VALID_EVENT_STATUSES.includes(value as EventStatus | '')) {
      onStatusFilterChange(value as EventStatus | '');
    }
  };

  const handleTypeChange = (value: string) => {
    const validTypes: (EventType | '')[] = ['', EVENT_TYPES.WEDDING, EVENT_TYPES.BAPTISM, EVENT_TYPES.FUNERAL];
    if (validTypes.includes(value as EventType | '')) {
      onTypeFilterChange(value as EventType | '');
    }
  };

  return (
    <Card variant="outlined" className="mb-6">
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            value={typeFilter}
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            <option value="">{t('allTypes')}</option>
            <option value={EVENT_TYPES.WEDDING}>{t('wedding')}</option>
            <option value={EVENT_TYPES.BAPTISM}>{t('baptism')}</option>
            <option value={EVENT_TYPES.FUNERAL}>{t('funeral')}</option>
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


