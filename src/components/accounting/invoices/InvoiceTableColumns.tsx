import { useMemo, useCallback } from 'react';
import { Invoice } from '@/hooks/useInvoices';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { formatCurrency } from '@/lib/utils/invoiceUtils';

interface UseInvoiceTableColumnsProps {
  getClientName: (clientId: string) => string;
  handleView: (invoice: Invoice) => void;
  handleEdit: (invoice: Invoice) => void;
  handleMarkAsPaid: (id: string) => void;
  setDeleteConfirm: (id: string) => void;
  t: (key: string) => string;
}

export function useInvoiceTableColumns({
  getClientName,
  handleView,
  handleEdit,
  handleMarkAsPaid,
  setDeleteConfirm,
  t,
}: UseInvoiceTableColumnsProps) {
  const columns = useMemo(
    () => [
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
        render: (value: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') => {
          const variantMap: Record<string, 'warning' | 'success' | 'danger' | 'secondary' | 'info'> = {
            draft: 'secondary',
            sent: 'info',
            paid: 'success',
            overdue: 'danger',
            cancelled: 'secondary',
          };
          return (
            <Badge variant={variantMap[value] || 'secondary'} size="sm">
              {t(value)}
            </Badge>
          );
        },
      },
      {
        key: 'id' as keyof Invoice,
        label: t('actions'),
        sortable: false,
        render: (_: any, row: Invoice) => (
          <Dropdown
            trigger={
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </Button>
            }
            items={[
              { label: t('view'), onClick: () => handleView(row) },
              { label: t('edit'), onClick: () => handleEdit(row) },
              ...(row.status !== 'paid' ? [{ label: t('markAsPaid'), onClick: () => handleMarkAsPaid(row.id) }] : []),
              { label: t('delete'), onClick: () => setDeleteConfirm(row.id), variant: 'danger' },
            ]}
            align="right"
          />
        ),
      },
    ],
    [t, getClientName, handleView, handleEdit, handleMarkAsPaid, setDeleteConfirm]
  );

  return columns;
}

