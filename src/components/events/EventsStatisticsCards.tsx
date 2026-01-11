'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { useEventStatistics } from '@/hooks/useEventStatistics';
import { useTranslations } from 'next-intl';

interface EventsStatisticsCardsProps {
  statistics: ReturnType<typeof useEventStatistics>['statistics'];
}

/**
 * Statistics cards component for events overview
 * Displays total events, weddings, baptisms, and upcoming events
 */
export function EventsStatisticsCards({ statistics }: EventsStatisticsCardsProps) {
  const t = useTranslations('common');

  if (!statistics) {
    return null;
  }

  const cards = [
    {
      label: t('totalEvents'),
      value: statistics.total,
    },
    {
      label: t('weddings'),
      value: statistics.byType.wedding,
    },
    {
      label: t('baptisms'),
      value: statistics.byType.baptism,
    },
    {
      label: t('upcoming'),
      value: statistics.upcoming,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.label} variant="elevated">
          <CardBody>
            <div className="text-sm text-text-secondary">{card.label}</div>
            <div className="text-2xl font-bold text-text-primary">{card.value}</div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}


