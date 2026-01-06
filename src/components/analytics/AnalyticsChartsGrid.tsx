import { ChartDataPoint } from './ChartContainer';
import { AnalyticsChartCard } from './AnalyticsChartCard';
import { recordToChartData, combineFinancialData } from './utils';

interface AnalyticsChartsGridProps {
  metrics: {
    userActivity: {
      activityOverTime: Array<{ date: string; value: number }>;
    };
    documentCreation: {
      documentsByType: Record<string, number>;
      documentsOverTime: Array<{ date: string; value: number }>;
    };
    eventStatistics: {
      eventsByType: Record<string, number>;
    };
    financialSummary: {
      incomeOverTime: Array<{ date: string; value: number }>;
      expensesOverTime: Array<{ date: string; value: number }>;
    };
    parishionerGrowth: {
      growthOverTime: Array<{ date: string; value: number }>;
    };
  };
  t: (key: string) => string;
}

export function AnalyticsChartsGrid({ metrics, t }: AnalyticsChartsGridProps) {
  const documentsByTypeData = recordToChartData(
    metrics.documentCreation.documentsByType
  );
  const eventsByTypeData = recordToChartData(
    metrics.eventStatistics.eventsByType
  );
  const financialComparisonData = combineFinancialData(
    metrics.financialSummary.incomeOverTime,
    metrics.financialSummary.expensesOverTime
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <AnalyticsChartCard
        title={t('userActivity') || 'User Activity'}
        type="line"
        data={metrics.userActivity.activityOverTime}
        dataKey="value"
        height={250}
      />
      <AnalyticsChartCard
        title={t('documentCreation') || 'Document Creation'}
        type="bar"
        data={metrics.documentCreation.documentsOverTime}
        dataKey="value"
        height={250}
      />
      <AnalyticsChartCard
        title={t('documentsByType') || 'Documents by Type'}
        type="pie"
        data={documentsByTypeData}
        dataKey="value"
        height={250}
      />
      <AnalyticsChartCard
        title={t('eventsByType') || 'Events by Type'}
        type="pie"
        data={eventsByTypeData}
        dataKey="value"
        height={250}
      />
      <AnalyticsChartCard
        title={t('financialSummary') || 'Financial Summary'}
        type="line"
        data={financialComparisonData}
        dataKey="income"
        height={300}
        className="lg:col-span-2"
        subtitle={t('incomeVsExpenses') || 'Income vs Expenses'}
      />
      <AnalyticsChartCard
        title={t('parishionerGrowth') || 'Parishioner Growth'}
        type="line"
        data={metrics.parishionerGrowth.growthOverTime}
        dataKey="value"
        height={250}
        className="lg:col-span-2"
      />
    </div>
  );
}

