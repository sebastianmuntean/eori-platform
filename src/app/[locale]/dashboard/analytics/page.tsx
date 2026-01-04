'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { ChartContainer, ChartDataPoint } from '@/components/analytics/ChartContainer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';

interface DashboardMetrics {
  userActivity: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    activityOverTime: Array<{ date: string; value: number }>;
  };
  documentCreation: {
    totalDocuments: number;
    documentsByType: Record<string, number>;
    documentsOverTime: Array<{ date: string; value: number }>;
  };
  eventStatistics: {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsOverTime: Array<{ date: string; value: number }>;
  };
  financialSummary: {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    incomeOverTime: Array<{ date: string; value: number }>;
    expensesOverTime: Array<{ date: string; value: number }>;
  };
  parishionerGrowth: {
    totalParishioners: number;
    growthOverTime: Array<{ date: string; value: number }>;
  };
}

export default function AnalyticsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [showReportBuilder, setShowReportBuilder] = useState(false);

  const breadcrumbs = [
    { label: t('dashboard'), href: `/${locale}/dashboard` },
    { label: t('analytics') || 'Analytics', href: `/${locale}/dashboard/analytics` },
  ];

  useEffect(() => {
    fetchMetrics();
  }, [startDate, endDate]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/analytics/dashboard?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      if (result.success) {
        setMetrics(result.data);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div>
        <Breadcrumbs items={breadcrumbs} className="mb-6" />
        <h1 className="text-3xl font-bold text-text-primary mb-6">
          {t('analytics') || 'Analytics'}
        </h1>
        <div className="text-center py-12">
          <p className="text-text-secondary">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div>
        <Breadcrumbs items={breadcrumbs} className="mb-6" />
        <h1 className="text-3xl font-bold text-text-primary mb-6">
          {t('analytics') || 'Analytics'}
        </h1>
        <div className="text-center py-12">
          <p className="text-danger">{error}</p>
          <Button onClick={fetchMetrics} className="mt-4">
            {t('retry') || 'Retry'}
          </Button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  // Convert documents by type to chart data
  const documentsByTypeData: ChartDataPoint[] = Object.entries(
    metrics.documentCreation.documentsByType
  ).map(([name, value]) => ({
    name,
    value,
  }));

  // Convert events by type to chart data
  const eventsByTypeData: ChartDataPoint[] = Object.entries(
    metrics.eventStatistics.eventsByType
  ).map(([name, value]) => ({
    name,
    value,
  }));

  // Combine income and expenses for comparison
  // Create a map of dates to combine both series
  const financialMap = new Map<string, { income: number; expenses: number }>();
  
  metrics.financialSummary.incomeOverTime.forEach((item) => {
    financialMap.set(item.date, { income: item.value, expenses: 0 });
  });
  
  metrics.financialSummary.expensesOverTime.forEach((item) => {
    const existing = financialMap.get(item.date);
    if (existing) {
      existing.expenses = item.value;
    } else {
      financialMap.set(item.date, { income: 0, expenses: item.value });
    }
  });
  
  const financialComparisonData: ChartDataPoint[] = Array.from(financialMap.entries())
    .map(([date, values]) => ({
      date,
      income: values.income,
      expenses: values.expenses,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <Breadcrumbs items={breadcrumbs} className="mb-6" />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text-primary">
          {t('analytics') || 'Analytics'}
        </h1>
        <Button onClick={() => setShowReportBuilder(true)} variant="primary">
          {t('createReport') || 'Create Report'}
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card variant="elevated" className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="date"
              label={t('startDate') || 'Start Date'}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              label={t('endDate') || 'End Date'}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <div className="flex items-end">
              <Button onClick={fetchMetrics} variant="primary" className="w-full">
                {t('apply') || 'Apply'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card variant="elevated">
          <CardBody>
            <p className="text-sm text-text-secondary mb-1">
              {t('totalUsers') || 'Total Users'}
            </p>
            <p className="text-2xl font-bold text-text-primary">
              {metrics.userActivity.totalUsers}
            </p>
            <p className="text-xs text-text-muted mt-2">
              {metrics.userActivity.activeUsers} {t('active') || 'active'}
            </p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody>
            <p className="text-sm text-text-secondary mb-1">
              {t('totalDocuments') || 'Total Documents'}
            </p>
            <p className="text-2xl font-bold text-text-primary">
              {metrics.documentCreation.totalDocuments}
            </p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody>
            <p className="text-sm text-text-secondary mb-1">
              {t('totalEvents') || 'Total Events'}
            </p>
            <p className="text-2xl font-bold text-text-primary">
              {metrics.eventStatistics.totalEvents}
            </p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody>
            <p className="text-sm text-text-secondary mb-1">
              {t('netAmount') || 'Net Amount'}
            </p>
            <p className="text-2xl font-bold text-text-primary">
              {metrics.financialSummary.netAmount.toFixed(2)} RON
            </p>
            <p className="text-xs text-text-muted mt-2">
              {t('income') || 'Income'}: {metrics.financialSummary.totalIncome.toFixed(2)} RON
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Activity Over Time */}
        <Card variant="elevated">
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              {t('userActivity') || 'User Activity'}
            </h3>
          </CardHeader>
          <CardBody>
            <ChartContainer
              type="line"
              data={metrics.userActivity.activityOverTime}
              dataKey="value"
              height={250}
            />
          </CardBody>
        </Card>

        {/* Document Creation Over Time */}
        <Card variant="elevated">
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              {t('documentCreation') || 'Document Creation'}
            </h3>
          </CardHeader>
          <CardBody>
            <ChartContainer
              type="bar"
              data={metrics.documentCreation.documentsOverTime}
              dataKey="value"
              height={250}
            />
          </CardBody>
        </Card>

        {/* Documents by Type */}
        <Card variant="elevated">
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              {t('documentsByType') || 'Documents by Type'}
            </h3>
          </CardHeader>
          <CardBody>
            <ChartContainer
              type="pie"
              data={documentsByTypeData}
              dataKey="value"
              height={250}
            />
          </CardBody>
        </Card>

        {/* Events by Type */}
        <Card variant="elevated">
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              {t('eventsByType') || 'Events by Type'}
            </h3>
          </CardHeader>
          <CardBody>
            <ChartContainer
              type="pie"
              data={eventsByTypeData}
              dataKey="value"
              height={250}
            />
          </CardBody>
        </Card>

        {/* Financial Summary */}
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              {t('financialSummary') || 'Financial Summary'}
            </h3>
          </CardHeader>
          <CardBody>
            <div className="w-full">
              <h4 className="text-sm font-medium text-text-primary mb-4">
                {t('incomeVsExpenses') || 'Income vs Expenses'}
              </h4>
              <ChartContainer
                type="line"
                data={financialComparisonData}
                dataKey="income"
                height={300}
              />
            </div>
          </CardBody>
        </Card>

        {/* Parishioner Growth */}
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              {t('parishionerGrowth') || 'Parishioner Growth'}
            </h3>
          </CardHeader>
          <CardBody>
            <ChartContainer
              type="line"
              data={metrics.parishionerGrowth.growthOverTime}
              dataKey="value"
              height={250}
            />
          </CardBody>
        </Card>
      </div>

      {/* Report Builder Modal */}
      {showReportBuilder && (
        <Modal
          isOpen={showReportBuilder}
          onClose={() => setShowReportBuilder(false)}
          title={t('createReport') || 'Create Report'}
        >
          <div className="p-4">
            <p className="text-text-secondary">
              {t('reportBuilderComingSoon') || 'Report builder coming soon. For now, you can view the analytics dashboard above.'}
            </p>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowReportBuilder(false)} variant="secondary">
                {t('close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

