'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { SimpleModal } from '@/components/ui/SimpleModal';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ANALYTICS_PERMISSIONS } from '@/lib/permissions/analytics';
import { AnalyticsSummaryCards } from '@/components/analytics/AnalyticsSummaryCards';
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter';
import { AnalyticsChartsGrid } from '@/components/analytics/AnalyticsChartsGrid';
import { AnalyticsLoadingState } from '@/components/analytics/AnalyticsLoadingState';
import { AnalyticsErrorState } from '@/components/analytics/AnalyticsErrorState';
import { getDefaultDateRange } from '@/components/analytics/utils';

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
  const { loading: permissionLoading } = useRequirePermission(ANALYTICS_PERMISSIONS.VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle('Analytics');
  
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const defaultDateRange = useMemo(() => getDefaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaultDateRange.startDate);
  const [endDate, setEndDate] = useState(defaultDateRange.endDate);
  const [showReportBuilder, setShowReportBuilder] = useState(false);

  const breadcrumbs = useMemo(
    () => [
      { label: t('dashboard'), href: `/${locale}/dashboard` },
      { label: t('analytics') || 'Analytics', href: `/${locale}/dashboard/analytics` },
    ],
    [locale, t]
  );

  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (permissionLoading) {
    return (
      <AnalyticsLoadingState
        breadcrumbs={breadcrumbs}
        title={t('analytics') || 'Analytics'}
        t={t}
      />
    );
  }

  if (loading && !metrics) {
    return (
      <AnalyticsLoadingState
        breadcrumbs={breadcrumbs}
        title={t('analytics') || 'Analytics'}
        t={t}
      />
    );
  }

  if (error && !metrics) {
    return (
      <AnalyticsErrorState
        breadcrumbs={breadcrumbs}
        title={t('analytics') || 'Analytics'}
        error={error}
        onRetry={fetchMetrics}
        t={t}
      />
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('analytics') || 'Analytics'}
        action={
          <Button onClick={() => setShowReportBuilder(true)} variant="primary">
            {t('createReport') || 'Create Report'}
          </Button>
        }
        className="mb-6"
      />

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApply={fetchMetrics}
        t={t}
      />

      <AnalyticsSummaryCards metrics={metrics} t={t} />

      <AnalyticsChartsGrid metrics={metrics} t={t} />

      <SimpleModal
        isOpen={showReportBuilder}
        onClose={() => setShowReportBuilder(false)}
        title={t('createReport') || 'Create Report'}
        actions={
          <Button onClick={() => setShowReportBuilder(false)} variant="secondary">
            {t('close')}
          </Button>
        }
      >
        <p className="text-text-secondary">
          {t('reportBuilderComingSoon') ||
            'Report builder coming soon. For now, you can view the analytics dashboard above.'}
        </p>
      </SimpleModal>
    </PageContainer>
  );
}

