'use client';

import { useMemo } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { ClientStatementSummary } from '@/hooks/useClientStatement';
import { formatCurrency } from '@/lib/utils/accounting';
import { useTranslations } from 'next-intl';

interface ClientStatementSummaryCardsProps {
  summary: ClientStatementSummary;
}

interface SummaryCardConfig {
  labelKey: string;
  amount: number;
  count?: number;
  countLabelKey?: string;
  descriptionLabelKey?: string; // For balance card
  colorClass: string;
  variant?: 'elevated';
  className?: string;
  isBalance?: boolean;
}

/**
 * Summary cards component for client statement
 * Displays issued invoices, received invoices, payments received, payments made, and final balance
 */
export function ClientStatementSummaryCards({ summary }: ClientStatementSummaryCardsProps) {
  const t = useTranslations('common');

  // Define card configurations to reduce duplication
  const cardConfigs = useMemo<SummaryCardConfig[]>(
    () => [
      {
        labelKey: 'issuedInvoices',
        amount: summary.issuedInvoices,
        count: summary.issuedInvoicesCount,
        countLabelKey: 'invoices',
        colorClass: 'text-primary',
      },
      {
        labelKey: 'receivedInvoices',
        amount: summary.receivedInvoices,
        count: summary.receivedInvoicesCount,
        countLabelKey: 'invoices',
        colorClass: 'text-info',
      },
      {
        labelKey: 'paymentsReceived',
        amount: summary.paymentsReceived,
        count: summary.paymentsReceivedCount,
        countLabelKey: 'payments',
        colorClass: 'text-success',
      },
      {
        labelKey: 'paymentsMade',
        amount: summary.paymentsMade,
        count: summary.paymentsMadeCount,
        countLabelKey: 'payments',
        colorClass: 'text-danger',
      },
      {
        labelKey: 'finalBalance',
        amount: summary.balance,
        descriptionLabelKey: summary.balance >= 0 ? 'clientOwes' : 'weOwe',
        colorClass: summary.balance >= 0 ? 'text-success' : 'text-danger',
        className: 'border-2 border-primary',
        isBalance: true,
      },
    ],
    [summary]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {cardConfigs.map((config, index) => (
        <Card
          key={config.labelKey}
          variant={config.variant || 'elevated'}
          className={config.className}
        >
          <CardBody>
            <div>
              <p className="text-sm text-text-secondary mb-1">{t(config.labelKey)}</p>
              <p className={`text-2xl font-bold ${config.colorClass}`}>
                {formatCurrency(config.amount)}
              </p>
              {config.isBalance ? (
                <p className="text-xs text-text-secondary mt-1">
                  {config.descriptionLabelKey ? t(config.descriptionLabelKey) : ''}
                </p>
              ) : (
                <p className="text-xs text-text-secondary mt-1">
                  {config.count} {config.countLabelKey ? t(config.countLabelKey) : ''}
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

