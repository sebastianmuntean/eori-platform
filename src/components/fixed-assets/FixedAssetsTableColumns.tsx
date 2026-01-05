'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useTranslations } from 'next-intl';
import { formatMonetaryValue, formatDate } from '@/lib/fixed-assets/formatters';
import { getStatusBadgeVariant } from '@/lib/fixed-assets/helpers';

export interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  render?: (value: any, row?: any) => React.ReactNode;
}

/**
 * Hook to generate base table columns for fixed assets (without actions)
 * Centralizes column configuration to avoid duplication
 */
export function useFixedAssetsTableColumns(): TableColumn[] {
  const t = useTranslations('common');

  return useMemo(() => [
    {
      key: 'inventoryNumber',
      label: t('inventoryNumber') || 'Număr Inventar',
      sortable: true,
    },
    {
      key: 'name',
      label: t('name') || 'Name',
      sortable: true,
    },
    {
      key: 'location',
      label: t('location') || 'Location',
      sortable: false,
    },
    {
      key: 'acquisitionDate',
      label: t('acquisitionDate') || 'Acquisition Date',
      sortable: false,
      render: formatDate,
    },
    {
      key: 'acquisitionValue',
      label: t('acquisitionValue') || 'Acquisition Value',
      sortable: false,
      render: formatMonetaryValue,
    },
    {
      key: 'currentValue',
      label: t('currentValue') || 'Current Value',
      sortable: false,
      render: formatMonetaryValue,
    },
    {
      key: 'status',
      label: t('status') || 'Status',
      sortable: false,
      render: (value: string) => (
        <Badge variant={getStatusBadgeVariant(value)} size="sm">
          {value}
        </Badge>
      ),
    },
  ], [t]);
}

