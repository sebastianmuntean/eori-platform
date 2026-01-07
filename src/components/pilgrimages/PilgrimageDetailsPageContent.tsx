'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePilgrimage } from '@/hooks/usePilgrimage';
import { usePilgrimageStatistics } from '@/hooks/usePilgrimageStatistics';
import { useTranslations } from 'next-intl';
import { formatDate } from '@/utils/date';
import { PilgrimageTabNavigation } from '@/components/pilgrimages/PilgrimageTabNavigation';
import { PilgrimageStatus } from '@/hooks/usePilgrimages';

interface PilgrimageDetailsPageContentProps {
  locale: string;
  id: string;
}

/**
 * Pilgrimage details page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function PilgrimageDetailsPageContent({ locale, id }: PilgrimageDetailsPageContentProps) {
  const router = useRouter();
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');

  const { pilgrimage, loading, error, fetchPilgrimage } = usePilgrimage();
  const { statistics, fetchStatistics } = usePilgrimageStatistics();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchPilgrimage(id);
      fetchStatistics(id);
    }
  }, [id, fetchPilgrimage, fetchStatistics]);

  if (loading && !pilgrimage) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">{t('loading')}</div>
      </div>
    );
  }

  if (error || !pilgrimage) {
    return (
      <div className="p-4 bg-danger/10 text-danger rounded-md">
        {error || tPilgrimages('errors.pilgrimageNotFound')}
      </div>
    );
  }

  const formatDateLocalized = useCallback(
    (date: string | null) => formatDate(date, locale),
    [locale]
  );

  const getStatusLabel = useCallback(
    (status: PilgrimageStatus) => {
      const statusMap: Record<PilgrimageStatus, string> = {
        draft: tPilgrimages('statuses.draft'),
        open: tPilgrimages('statuses.open'),
        closed: tPilgrimages('statuses.closed'),
        in_progress: tPilgrimages('statuses.in_progress'),
        completed: tPilgrimages('statuses.completed'),
        cancelled: tPilgrimages('statuses.cancelled'),
      };
      return statusMap[status] || status;
    },
    [tPilgrimages]
  );

  const breadcrumbs = useMemo(
    () => [
      { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
      { label: tPilgrimages('pilgrimages'), href: `/${locale}/dashboard/pilgrimages` },
      { label: pilgrimage.title },
    ],
    [t, tPilgrimages, locale, pilgrimage.title]
  );

  const tabs = useMemo(
    () => [
      { id: 'overview', label: tPilgrimages('pilgrimageDetails') },
      { id: 'participants', label: tPilgrimages('participants') },
      { id: 'schedule', label: tPilgrimages('schedule') },
      { id: 'documents', label: tPilgrimages('documents') },
      { id: 'payments', label: tPilgrimages('payments') },
      { id: 'transport', label: tPilgrimages('transport') },
      { id: 'accommodation', label: tPilgrimages('accommodation') },
      { id: 'meals', label: tPilgrimages('meals') },
      { id: 'statistics', label: tPilgrimages('statistics') },
    ],
    [tPilgrimages]
  );

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={pilgrimage.title}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/dashboard/pilgrimages/${id}/edit`)}
            >
              {t('edit')}
            </Button>
            <Button onClick={() => router.push(`/${locale}/dashboard/pilgrimages`)}>
              {t('back')}
            </Button>
          </div>
        }
        className="mb-6"
      />
      
      <div className="flex items-center gap-2 mb-6">
        <Badge variant={pilgrimage.status === 'open' ? 'primary' : 'secondary'} size="sm">
          {getStatusLabel(pilgrimage.status)}
        </Badge>
      </div>

      <PilgrimageTabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">{tPilgrimages('pilgrimageDetails')}</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary">{tPilgrimages('destination')}</label>
                  <p className="text-text-primary">{pilgrimage.destination || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">{tPilgrimages('startDate')}</label>
                  <p className="text-text-primary">{formatDateLocalized(pilgrimage.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">{tPilgrimages('endDate')}</label>
                  <p className="text-text-primary">{formatDateLocalized(pilgrimage.endDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">{tPilgrimages('registrationDeadline')}</label>
                  <p className="text-text-primary">{formatDateLocalized(pilgrimage.registrationDeadline)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">{tPilgrimages('maxParticipants')}</label>
                  <p className="text-text-primary">{pilgrimage.maxParticipants || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">{tPilgrimages('pricePerPerson')}</label>
                  <p className="text-text-primary">
                    {pilgrimage.pricePerPerson ? `${pilgrimage.pricePerPerson} ${pilgrimage.currency}` : '-'}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">{tPilgrimages('organizerName')}</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary">{tPilgrimages('organizerName')}</label>
                  <p className="text-text-primary">{pilgrimage.organizerName || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">{tPilgrimages('organizerContact')}</label>
                  <p className="text-text-primary">{pilgrimage.organizerContact || '-'}</p>
                </div>
                {pilgrimage.description && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary">{tPilgrimages('description')}</label>
                    <p className="text-text-primary whitespace-pre-wrap">{pilgrimage.description}</p>
                  </div>
                )}
                {pilgrimage.notes && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary">{tPilgrimages('notes')}</label>
                    <p className="text-text-primary whitespace-pre-wrap">{pilgrimage.notes}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'participants' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{tPilgrimages('participants')}</h2>
              <Button onClick={() => router.push(`/${locale}/dashboard/pilgrimages/${id}/participants`)}>
                {tPilgrimages('participants')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-text-secondary">{tPilgrimages('noParticipants')}</p>
          </CardBody>
        </Card>
      )}

      {activeTab === 'schedule' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{tPilgrimages('schedule')}</h2>
              <Button onClick={() => router.push(`/${locale}/dashboard/pilgrimages/${id}/schedule`)}>
                {t('manage')} {tPilgrimages('schedule')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-text-secondary">{tPilgrimages('noSchedule')}</p>
          </CardBody>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{tPilgrimages('documents')}</h2>
              <Button onClick={() => router.push(`/${locale}/dashboard/pilgrimages/${id}/documents`)}>
                {t('manage')} {tPilgrimages('documents')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-text-secondary">{tPilgrimages('noDocuments')}</p>
          </CardBody>
        </Card>
      )}

      {activeTab === 'payments' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{tPilgrimages('payments')}</h2>
              <Button onClick={() => router.push(`/${locale}/dashboard/pilgrimages/${id}/payments`)}>
                {t('manage')} {tPilgrimages('payments')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary">{tPilgrimages('revenue.total')}</label>
                  <p className="text-2xl font-bold text-text-primary">
                    {statistics.revenue?.total || 0} {pilgrimage.currency}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">{tPilgrimages('revenue.paid')}</label>
                  <p className="text-2xl font-bold text-text-primary">
                    {statistics.revenue?.paid || 0} {pilgrimage.currency}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">{tPilgrimages('revenue.outstanding')}</label>
                  <p className="text-2xl font-bold text-text-primary">
                    {statistics.revenue?.outstanding || 0} {pilgrimage.currency}
                  </p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'transport' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{tPilgrimages('transport')}</h2>
              <Button onClick={() => router.push(`/${locale}/dashboard/pilgrimages/${id}/transport`)}>
                {t('manage')} {tPilgrimages('transport')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-text-secondary">{tPilgrimages('noTransport')}</p>
          </CardBody>
        </Card>
      )}

      {activeTab === 'accommodation' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{tPilgrimages('accommodation')}</h2>
              <Button onClick={() => router.push(`/${locale}/dashboard/pilgrimages/${id}/accommodation`)}>
                {t('manage')} {tPilgrimages('accommodation')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-text-secondary">{tPilgrimages('noAccommodation')}</p>
          </CardBody>
        </Card>
      )}

      {activeTab === 'meals' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{tPilgrimages('meals')}</h2>
              <Button onClick={() => router.push(`/${locale}/dashboard/pilgrimages/${id}/meals`)}>
                {t('manage')} {tPilgrimages('meals')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-text-secondary">{tPilgrimages('noMeals')}</p>
          </CardBody>
        </Card>
      )}

      {activeTab === 'statistics' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">{tPilgrimages('statistics')}</h2>
          </CardHeader>
          <CardBody>
            {statistics && (
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
                      <span className="font-bold">{statistics.payments?.totalAmount || 0} {pilgrimage.currency}</span>
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
            )}
          </CardBody>
        </Card>
      )}
    </PageContainer>
  );
}

