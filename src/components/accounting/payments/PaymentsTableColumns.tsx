'use client';

import { Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Payment } from '@/hooks/usePayments';
import { formatCurrency, getStatusVariant, getTypeVariant, getPaymentMethodLabel } from '@/lib/utils/paymentUtils';

import { TableActionsIcon } from '@/components/accounting/shared/TableActionsIcon';

interface PaymentsTableColumnsProps {
  t: (key: string) => string;
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: string) => void;
  getClientNameById: (clientId: string | null) => string;
}

/**
 * Generates payments table columns
 * Extracted from page component for better separation of concerns
 */
export function getPaymentsTableColumns({
  t,
  onEdit,
  onDelete,
  getClientNameById,
}: PaymentsTableColumnsProps): Column<Payment>[] {
  return [
    { key: 'paymentNumber' as keyof Payment, label: t('paymentNumber'), sortable: true },
    { key: 'date' as keyof Payment, label: t('date'), sortable: true },
    {
      key: 'type' as keyof Payment,
      label: t('paymentType'),
      sortable: false,
      render: (value: 'income' | 'expense') => (
        <Badge variant={getTypeVariant(value)} size="sm">
          {value === 'income' ? t('income') : t('expense')}
        </Badge>
      ),
    },
    { key: 'category' as keyof Payment, label: t('category'), sortable: false, render: (value: string | null) => value || '-' },
    {
      key: 'clientId' as keyof Payment,
      label: t('parteneri'),
      sortable: false,
      render: (value: string | null) => getClientNameById(value),
    },
    {
      key: 'amount' as keyof Payment,
      label: t('amount'),
      sortable: true,
      render: (value: string, row: Payment) => formatCurrency(value, row.currency),
    },
    {
      key: 'paymentMethod' as keyof Payment,
      label: t('paymentMethod'),
      sortable: false,
      render: (value: string | null) => getPaymentMethodLabel(value as any, t),
    },
    {
      key: 'status' as keyof Payment,
      label: t('status'),
      sortable: false,
      render: (value: 'pending' | 'completed' | 'cancelled') => (
        <Badge variant={getStatusVariant(value)} size="sm">
          {t(value)}
        </Badge>
      ),
    },
    {
      key: 'id' as keyof Payment,
      label: t('actions'),
      sortable: false,
      render: (_: any, row: Payment) => (
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

