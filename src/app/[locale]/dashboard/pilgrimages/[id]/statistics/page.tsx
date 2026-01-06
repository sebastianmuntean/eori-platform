'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { usePilgrimage } from '@/hooks/usePilgrimage';
import { usePilgrimageStatistics } from '@/hooks/usePilgrimageStatistics';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PILGRIMAGES_PERMISSIONS } from '@/lib/permissions/pilgrimages';

export default function PilgrimageStatisticsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');

  // Check permission to view pilgrimages
  const { loading: permissionLoading } = useRequirePermission(PILGRIMAGES_PERMISSIONS.VIEW);

  // All hooks must be called before any conditional returns
  const { pilgrimage, fetchPilgrimage } = usePilgrimage();
  const { statistics, fetchStatistics } = usePilgrimageStatistics();
  usePageTitle(pilgrimage?.title ? `${tPilgrimages('statistics') || t('statistics')} - ${pilgrimage.title}` : (tPilgrimages('statistics') || t('statistics')));

  useEffect(() => {
    if (permissionLoading) return;
    if (id) {
      fetchPilgrimage(id);
      fetchStatistics(id);
    }
  }, [permissionLoading, id, fetchPilgrimage, fetchStatistics]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: tPilgrimages('pilgrimages'), href: `/${locale}/dashboard/pilgrimages` },
    { label: pilgrimage?.title || tPilgrimages('pilgrimage'), href: `/${locale}/dashboard/pilgrimages/${id}` },
    { label: tPilgrimages('statistics') },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={tPilgrimages('statistics') || 'Statistics'}
        className="mb-6"
      />
      <Card>
        <CardBody>
          {statistics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{tPilgrimages('participants')}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{tPilgrimages('participantStatuses.registered')}</span>
                    <span className="font-bold">{statistics.participants?.registered || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tPilgrimages('participantStatuses.confirmed')}</span>
                    <span className="font-bold">{statistics.participants?.confirmed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tPilgrimages('participantStatuses.paid')}</span>
                    <span className="font-bold">{statistics.participants?.paid || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tPilgrimages('participantStatuses.cancelled')}</span>
                    <span className="font-bold">{statistics.participants?.cancelled || 0}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">{tPilgrimages('payments')}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t('total')}</span>
                    <span className="font-bold">
                      {statistics.payments?.totalAmount || 0} {pilgrimage?.currency || 'RON'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tPilgrimages('paymentStatuses.completed')}</span>
                    <span className="font-bold">{statistics.payments?.completedPayments || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tPilgrimages('paymentStatuses.pending')}</span>
                    <span className="font-bold">{statistics.payments?.pendingPayments || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-text-secondary">{t('loading')}</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}


