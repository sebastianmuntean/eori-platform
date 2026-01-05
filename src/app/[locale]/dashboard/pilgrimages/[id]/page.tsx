'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePilgrimage } from '@/hooks/usePilgrimage';
import { usePilgrimageStatistics } from '@/hooks/usePilgrimageStatistics';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PILGRIMAGES_PERMISSIONS } from '@/lib/permissions/pilgrimages';

export default function PilgrimageDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');

  // Check permission to view pilgrimages
  const { loading: permissionLoading } = useRequirePermission(PILGRIMAGES_PERMISSIONS.VIEW);

  // All hooks must be called before any conditional returns
  const { pilgrimage, loading, error, fetchPilgrimage } = usePilgrimage();
  usePageTitle(pilgrimage?.title || tPilgrimages('pilgrimages'));
  const { statistics, fetchStatistics } = usePilgrimageStatistics();
  const [activeTab, setActiveTab] = useState('overview');

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

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  };

  const getStatusLabel = (status: string) => {
    return tPilgrimages(`statuses.${status}` as any) || status;
  };

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: tPilgrimages('pilgrimages'), href: `/${locale}/dashboard/pilgrimages` },
    { label: pilgrimage.title },
  ];

  return (
    <div>
      <Breadcrumbs items={breadcrumbs} className="mb-6" />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{pilgrimage.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={pilgrimage.status === 'open' ? 'primary' : 'secondary'} size="sm">
              {getStatusLabel(pilgrimage.status)}
            </Badge>
          </div>
        </div>
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
      </div>

      <div className="mb-6">
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
{tPilgrimages('pilgrimageDetails')}
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'participants'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tPilgrimages('participants')}
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'schedule'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tPilgrimages('schedule')}
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'documents'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tPilgrimages('documents')}
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tPilgrimages('payments')}
          </button>
          <button
            onClick={() => setActiveTab('transport')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'transport'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tPilgrimages('transport')}
          </button>
          <button
            onClick={() => setActiveTab('accommodation')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'accommodation'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tPilgrimages('accommodation')}
          </button>
          <button
            onClick={() => setActiveTab('meals')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'meals'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tPilgrimages('meals')}
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'statistics'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tPilgrimages('statistics')}
          </button>
        </div>
      </div>

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
                    <p className="text-text-primary">{formatDate(pilgrimage.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary">{tPilgrimages('endDate')}</label>
                    <p className="text-text-primary">{formatDate(pilgrimage.endDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary">{tPilgrimages('registrationDeadline')}</label>
                    <p className="text-text-primary">{formatDate(pilgrimage.registrationDeadline)}</p>
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
    </div>
  );
}

