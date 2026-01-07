'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { ContractInvoice } from '@/hooks/useContracts';
import { formatCurrency } from '@/lib/utils/accounting';
import { formatDate } from '@/lib/utils/accounting';

/**
 * Hook to get contract invoice table columns
 */
export function useContractInvoiceTableColumns() {
  const t = useTranslations('common');

  const months = useMemo(
    () => [
      t('january') || 'Ianuarie',
      t('february') || 'Februarie',
      t('march') || 'Martie',
      t('april') || 'Aprilie',
      t('may') || 'Mai',
      t('june') || 'Iunie',
      t('july') || 'Iulie',
      t('august') || 'August',
      t('september') || 'Septembrie',
      t('october') || 'Octombrie',
      t('november') || 'Noiembrie',
      t('december') || 'Decembrie',
    ],
    [t]
  );

  const columns = useMemo(
    () => [
      {
        key: 'periodYear' as keyof ContractInvoice,
        label: t('period') || 'Perioadă',
        render: (value: any, row: ContractInvoice) => {
          return `${months[row.periodMonth - 1] || row.periodMonth} ${row.periodYear}`;
        },
      },
      {
        key: 'invoiceId' as keyof ContractInvoice,
        label: t('invoiceNumber'),
        render: (value: any, row: ContractInvoice) => row.invoice?.invoiceNumber || '-',
      },
      {
        key: 'contractId' as keyof ContractInvoice,
        label: t('date'),
        render: (value: any, row: ContractInvoice) =>
          row.invoice?.date ? formatDate(row.invoice.date) : '-',
      },
      {
        key: 'id' as keyof ContractInvoice,
        label: t('dueDate') || 'Scadență',
        render: (value: any, row: ContractInvoice) =>
          row.invoice?.dueDate ? formatDate(row.invoice.dueDate) : '-',
      },
      {
        key: 'generatedBy' as keyof ContractInvoice,
        label: t('amount') || 'Valoare',
        render: (value: any, row: ContractInvoice) =>
          row.invoice?.amount
            ? formatCurrency(row.invoice.amount, row.invoice?.currency || 'RON')
            : '-',
      },
      {
        key: 'periodMonth' as keyof ContractInvoice,
        label: t('vat') || 'TVA',
        render: (value: any, row: ContractInvoice) =>
          row.invoice?.vat ? formatCurrency(row.invoice.vat, row.invoice?.currency || 'RON') : '-',
      },
      {
        key: 'invoice' as keyof ContractInvoice,
        label: t('total'),
        render: (value: any, row: ContractInvoice) =>
          row.invoice?.total ? (
            <span className="font-semibold">
              {formatCurrency(row.invoice.total, row.invoice?.currency || 'RON')}
            </span>
          ) : (
            '-'
          ),
      },
      {
        key: 'periodYear' as keyof ContractInvoice,
        label: t('status'),
        render: (value: any, row: ContractInvoice) => {
          const status = row.invoice?.status;
          if (!status) return '-';
          const variantMap: Record<string, 'warning' | 'success' | 'danger' | 'secondary' | 'info'> = {
            draft: 'secondary',
            sent: 'info',
            paid: 'success',
            overdue: 'danger',
            cancelled: 'danger',
          };
          return (
            <Badge variant={variantMap[status] || 'secondary'} size="sm">
              {t(status)}
            </Badge>
          );
        },
      },
      {
        key: 'generatedAt' as keyof ContractInvoice,
        label: t('paymentDate') || 'Data plată',
        render: (value: any, row: ContractInvoice) =>
          row.invoice?.paymentDate ? (
            formatDate(row.invoice.paymentDate)
          ) : (
            <span className="text-text-secondary">-</span>
          ),
      },
      {
        key: 'generatedBy' as keyof ContractInvoice,
        label: t('generatedAt') || 'Generat la',
        render: (value: any, row: ContractInvoice) =>
          row.generatedAt ? new Date(row.generatedAt).toLocaleString('ro-RO') : '-',
      },
    ],
    [t, months]
  );

  return columns;
}

