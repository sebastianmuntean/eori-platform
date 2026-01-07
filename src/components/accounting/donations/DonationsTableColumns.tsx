'use client';

import { Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Donation } from '@/hooks/useDonations';
import { formatCurrency } from '@/lib/utils/accounting';

// Payment method translation map
const PAYMENT_METHOD_MAP: Record<string, string> = {
  cash: 'cash',
  bank_transfer: 'bankTransfer',
  card: 'card',
  check: 'check',
};

// Status badge variant map
const STATUS_VARIANT_MAP: Record<string, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

import { TableActionsIcon } from '@/components/accounting/shared/TableActionsIcon';

interface DonationsTableColumnsProps {
  t: (key: string) => string;
  onEdit: (donation: Donation) => void;
  onDelete: (donationId: string) => void;
  getClientName: (clientId: string | null) => string;
}

/**
 * Generates donations table columns
 * Extracted from page component for better separation of concerns
 */
export function getDonationsTableColumns({
  t,
  onEdit,
  onDelete,
  getClientName,
}: DonationsTableColumnsProps): Column<Donation>[] {
  return [
    { key: 'paymentNumber' as keyof Donation, label: t('paymentNumber'), sortable: true },
    { key: 'date' as keyof Donation, label: t('date'), sortable: true },
    {
      key: 'clientId' as keyof Donation,
      label: t('donor'),
      sortable: false,
      render: (value: string | null) => getClientName(value),
    },
    {
      key: 'amount' as keyof Donation,
      label: t('amount'),
      sortable: true,
      render: (value: string, row: Donation) => formatCurrency(value, row.currency),
    },
    {
      key: 'paymentMethod' as keyof Donation,
      label: t('paymentMethod'),
      sortable: false,
      render: (value: string | null) => {
        if (!value) return '-';
        const translationKey = PAYMENT_METHOD_MAP[value];
        return translationKey ? t(translationKey) : value;
      },
    },
    {
      key: 'status' as keyof Donation,
      label: t('status'),
      sortable: false,
      render: (value: 'pending' | 'completed' | 'cancelled') => {
        return (
          <Badge variant={STATUS_VARIANT_MAP[value] || 'secondary'} size="sm">
            {t(value)}
          </Badge>
        );
      },
    },
    {
      key: 'id' as keyof Donation,
      label: t('actions'),
      sortable: false,
      render: (_: any, row: Donation) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <TableActionsIcon />
            </Button>
          }
          items={[
            { label: t('edit'), onClick: () => onEdit(row) },
            { label: t('delete'), onClick: () => onDelete(row.id), variant: 'danger' },
          ]}
          align="right"
        />
      ),
    },
  ];
}

