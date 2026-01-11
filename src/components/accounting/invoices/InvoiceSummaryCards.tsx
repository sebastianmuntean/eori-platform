import { Card, CardBody } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/invoiceUtils';

interface InvoiceSummary {
  totalIssued: number;
  totalReceived: number;
  unpaidCount: number;
  overdueCount: number;
}

interface InvoiceSummaryCardsProps {
  summary: InvoiceSummary | null;
  invoiceType: 'issued' | 'received';
  t: (key: string) => string;
}

export function InvoiceSummaryCards({ summary, invoiceType, t }: InvoiceSummaryCardsProps) {
  if (!summary) return null;

  const totalAmount = invoiceType === 'issued' ? summary.totalIssued : summary.totalReceived;
  const totalLabel = invoiceType === 'issued' 
    ? (t('totalIssued') || 'Total Emise')
    : (t('totalReceived') || 'Total Intrari');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card variant="elevated">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">{totalLabel}</p>
              <p className={`text-2xl font-bold ${invoiceType === 'issued' ? 'text-primary' : 'text-info'}`}>
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
      <Card variant="elevated">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">{t('unpaid')}</p>
              <p className="text-2xl font-bold text-warning">{summary.unpaidCount}</p>
            </div>
          </div>
        </CardBody>
      </Card>
      <Card variant="elevated">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">{t('overdue')}</p>
              <p className="text-2xl font-bold text-danger">{summary.overdueCount}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

