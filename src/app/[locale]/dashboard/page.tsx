'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';
import { PageContainer } from '@/components/ui/PageContainer';

export default function DashboardPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle(t('dashboard'));

  // Check permission to access dashboard
  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.USERS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }
  
  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
  ];

  // Generic widget data - can be replaced with real data later
  const widgets: Array<{
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
  }> = [
    {
      title: t('totalEntities'),
      value: '0',
      change: '+0%',
      trend: 'up',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: t('activeUsers'),
      value: '0',
      change: '+0%',
      trend: 'up' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      title: t('reports'),
      value: '0',
      change: '0%',
      trend: 'neutral' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: t('activities'),
      value: '0',
      change: '+0%',
      trend: 'up' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('dashboard')}
      />

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {widgets.map((widget, index) => (
          <Card key={index} variant="elevated">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1">{widget.title}</p>
                  <p className="text-2xl font-bold text-text-primary">{widget.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Badge
                      variant={
                        widget.trend === 'up'
                          ? 'success'
                          : widget.trend === 'down'
                          ? 'danger'
                          : 'secondary'
                      }
                      size="sm"
                    >
                      {widget.change}
                    </Badge>
                    <span className="text-xs text-text-muted">{t('vsLastMonth')}</span>
                  </div>
                </div>
                <div className={`text-${widget.trend === 'up' ? 'success' : widget.trend === 'down' ? 'danger' : 'secondary'}`}>
                  {widget.icon}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Analytics Quick Link */}
      <Card variant="elevated" className="mb-8">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                {t('analytics') || 'Analytics & Reports'}
              </h2>
              <p className="text-sm text-text-secondary">
                {t('analyticsDescription') || 'View comprehensive analytics, create custom reports, and track key metrics.'}
              </p>
            </div>
            <Link href={`/${locale}/dashboard/analytics`}>
              <Button variant="primary">
                {t('viewAnalytics') || 'View Analytics'}
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      {/* Recent Activity and Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-text-primary">{t('recentActivities')}</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-md hover:bg-bg-secondary transition-colors">
                <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{t('systemInitialized')}</p>
                  <p className="text-xs text-text-muted mt-1">{t('systemInitializedDesc')}</p>
                  <p className="text-xs text-text-muted mt-1">{t('now')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-md hover:bg-bg-secondary transition-colors">
                <div className="w-10 h-10 bg-success bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{t('activeSession')}</p>
                  <p className="text-xs text-text-muted mt-1">{t('activeSessionDesc')}</p>
                  <p className="text-xs text-text-muted mt-1">{t('now')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-md hover:bg-bg-secondary transition-colors">
                <div className="w-10 h-10 bg-info bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{t('dashboardAccessed')}</p>
                  <p className="text-xs text-text-muted mt-1">{t('dashboardAccessedDesc')}</p>
                  <p className="text-xs text-text-muted mt-1">{t('now')}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-text-primary">{t('quickStats')}</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-md flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-text-primary">{t('totalRecords')}</span>
                </div>
                <span className="text-lg font-semibold text-text-primary">0</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-success bg-opacity-10 rounded-md flex items-center justify-center">
                    <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-text-primary">{t('activeStatus')}</span>
                </div>
                <Badge variant="success" size="sm">{t('activated')}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-info bg-opacity-10 rounded-md flex items-center justify-center">
                    <svg className="w-4 h-4 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-text-primary">{t('lastUpdate')}</span>
                </div>
                <span className="text-sm text-text-secondary">{t('now')}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-warning bg-opacity-10 rounded-md flex items-center justify-center">
                    <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-text-primary">{t('users')}</span>
                </div>
                <span className="text-lg font-semibold text-text-primary">0</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  );
}

