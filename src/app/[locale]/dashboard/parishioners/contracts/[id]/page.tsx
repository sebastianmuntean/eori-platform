'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useParishionerContracts } from '@/hooks/useParishionerContracts';
import { useParishes } from '@/hooks/useParishes';
import { useClients } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PARISHIONERS_PERMISSIONS } from '@/lib/permissions/parishioners';

export default function ParishionerContractDetailPage() {
  const { loading: permissionLoading } = useRequirePermission(PARISHIONERS_PERMISSIONS.CONTRACTS_VIEW);
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('common');

  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const { contracts, fetchContracts } = useParishionerContracts();
  const { parishes, fetchParishes } = useParishes();
  const { clients, fetchClients } = useClients();

  const contractId = params.id as string;
  const contract = contracts.find((c) => c.id === contractId);

  useEffect(() => {
    fetchParishes({ all: true });
    fetchClients({ all: true });
    fetchContracts({ page: 1, pageSize: 1000 });
  }, [fetchParishes, fetchClients, fetchContracts]);

  if (!contract) {
    return (
      <div>
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
              { label: t('parishioners') || 'Parishioners', href: `/${locale}/dashboard/parishioners` },
              { label: t('contracts') || 'Contracts', href: `/${locale}/dashboard/parishioners/contracts` },
              { label: t('contract') || 'Contract' },
            ]}
            className="mb-2"
          />
        </div>
        <Card>
          <CardBody>
            <div>{t('loading') || 'Loading...'}</div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const getParishionerName = (parishionerId: string) => {
    const client = clients.find((c) => c.id === parishionerId);
    if (!client) return parishionerId;
    return client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.code;
  };

  const getParishName = (parishId: string) => {
    const parish = parishes.find((p) => p.id === parishId);
    return parish ? parish.name : parishId;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs
            items={[
              { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
              { label: t('parishioners') || 'Parishioners', href: `/${locale}/dashboard/parishioners` },
              { label: t('contracts') || 'Contracts', href: `/${locale}/dashboard/parishioners/contracts` },
              { label: contract.contractNumber },
            ]}
            className="mb-2"
          />
          <h1 className="text-3xl font-bold text-text-primary">{contract.title || contract.contractNumber}</h1>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          {t('back') || 'Back'}
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary">{t('contractNumber') || 'Contract Number'}</label>
              <div className="mt-1">{contract.contractNumber}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">{t('status')}</label>
              <div className="mt-1">
                <Badge variant={contract.status === 'active' ? 'success' : 'secondary'} size="sm">
                  {t(contract.status) || contract.status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">{t('parishioner') || 'Parishioner'}</label>
              <div className="mt-1">{getParishionerName(contract.parishionerId)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">{t('parish')}</label>
              <div className="mt-1">{getParishName(contract.parishId)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">{t('contractType') || 'Contract Type'}</label>
              <div className="mt-1">{t(contract.contractType) || contract.contractType}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">{t('startDate') || 'Start Date'}</label>
              <div className="mt-1">{formatDate(contract.startDate)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">{t('endDate') || 'End Date'}</label>
              <div className="mt-1">{formatDate(contract.endDate)}</div>
            </div>
            {contract.amount && (
              <div>
                <label className="text-sm font-medium text-text-secondary">{t('amount')}</label>
                <div className="mt-1">{contract.amount} {contract.currency}</div>
              </div>
            )}
            {contract.description && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-text-secondary">{t('description')}</label>
                <div className="mt-1">{contract.description}</div>
              </div>
            )}
            {contract.terms && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-text-secondary">{t('terms')}</label>
                <div className="mt-1 whitespace-pre-wrap">{contract.terms}</div>
              </div>
            )}
            {contract.notes && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-text-secondary">{t('notes')}</label>
                <div className="mt-1 whitespace-pre-wrap">{contract.notes}</div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}


