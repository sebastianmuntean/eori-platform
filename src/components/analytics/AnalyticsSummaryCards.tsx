import { Card, CardBody } from '@/components/ui/Card';

interface SummaryCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

function SummaryCard({ label, value, subtitle }: SummaryCardProps) {
  return (
    <Card variant="elevated">
      <CardBody>
        <p className="text-sm text-text-secondary mb-1">{label}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        {subtitle && (
          <p className="text-xs text-text-muted mt-2">{subtitle}</p>
        )}
      </CardBody>
    </Card>
  );
}

interface AnalyticsSummaryCardsProps {
  metrics: {
    userActivity: {
      totalUsers: number;
      activeUsers: number;
    };
    documentCreation: {
      totalDocuments: number;
    };
    eventStatistics: {
      totalEvents: number;
    };
    financialSummary: {
      netAmount: number;
      totalIncome: number;
    };
  };
  t: (key: string) => string;
}

export function AnalyticsSummaryCards({
  metrics,
  t,
}: AnalyticsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <SummaryCard
        label={t('totalUsers') || 'Total Users'}
        value={metrics.userActivity.totalUsers}
        subtitle={`${metrics.userActivity.activeUsers} ${t('active') || 'active'}`}
      />
      <SummaryCard
        label={t('totalDocuments') || 'Total Documents'}
        value={metrics.documentCreation.totalDocuments}
      />
      <SummaryCard
        label={t('totalEvents') || 'Total Events'}
        value={metrics.eventStatistics.totalEvents}
      />
      <SummaryCard
        label={t('netAmount') || 'Net Amount'}
        value={`${metrics.financialSummary.netAmount.toFixed(2)} RON`}
        subtitle={`${t('income') || 'Income'}: ${metrics.financialSummary.totalIncome.toFixed(2)} RON`}
      />
    </div>
  );
}

