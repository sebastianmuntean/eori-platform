'use client';

import { Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Invoice } from '@/hooks/useInvoices';
import { formatCurrency } from '@/lib/utils/accounting';
import { TableActionsIcon } from '@/components/accounting/shared/TableActionsIcon';

// Invoice status variant map
const INVOICE_STATUS_VARIANTS: Record<string, 'warning' | 'success' | 'danger' | 'secondary' | 'info'> = {
  draft: 'secondary',
  sent: 'info',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'secondary',
};

interface InvoicesTableColumnsProps {
  t: (key: string) => string;
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onMarkAsPaid: (invoiceId: string) => void;
  getClientName: (clientId: string) => string;
}

/**
 * Generates invoices table columns
 * Extracted from page component for better separation of concerns
 */
export function getInvoicesTableColumns({
  t,
  onView,
  onEdit,
  onDelete,
  onMarkAsPaid,
  getClientName,
}: InvoicesTableColumnsProps): Column<Invoice>[] {
  return [
    { key: 'invoiceNumber' as keyof Invoice, label: t('invoiceNumber'), sortable: true },
    { key: 'date' as keyof Invoice, label: t('date'), sortable: true },
    { key: 'dueDate' as keyof Invoice, label: t('dueDate'), sortable: false },
    {
      key: 'type' as keyof Invoice,
      label: t('invoiceType'),
      sortable: false,
      render: (value: 'issued' | 'received') => (
        <Badge variant={value === 'issued' ? 'primary' : 'info'} size="sm">
          {value === 'issued' ? t('issued') : t('received')}
        </Badge>
      ),
    },
    {
      key: 'clientId' as keyof Invoice,
      label: t('clients'),
      sortable: false,
      render: (value: string) => getClientName(value),
    },
    {
      key: 'total' as keyof Invoice,
      label: t('total'),
      sortable: true,
      render: (value: string, row: Invoice) => formatCurrency(value, row.currency),
    },
    {
      key: 'status' as keyof Invoice,
      label: t('status'),
      sortable: false,
      render: (value: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') => (
        <Badge variant={INVOICE_STATUS_VARIANTS[value] || 'secondary'} size="sm">
          {t(value)}
        </Badge>
      ),
    },
    {
      key: 'id' as keyof Invoice,
      label: t('actions'),
      sortable: false,
      render: (_: any, row: Invoice) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <TableActionsIcon />
            </Button>
          }
          items={[
            { label: t('view'), onClick: () => onView(row) },
            { label: t('edit'), onClick: () => onEdit(row) },
            ...(row.status !== 'paid' ? [{ label: t('markAsPaid'), onClick: () => onMarkAsPaid(row.id) }] : []),
            { label: t('delete'), onClick: () => onDelete(row.id), variant: 'danger' },
          ]}
          align="right"
        />
      ),
    },
  ];
}

