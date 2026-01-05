'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { useNameDays } from '@/hooks/useNameDays';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PARISHIONERS_PERMISSIONS } from '@/lib/permissions/parishioners';

export default function NameDaysPage() {
  const { loading: permissionLoading } = useRequirePermission(PARISHIONERS_PERMISSIONS.NAME_DAYS_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('nameDays'));

  // All hooks must be called before any conditional returns
  const { nameDays, loading, error, fetchNameDays } = useNameDays();
  const { parishes, fetchParishes } = useParishes();

  const [parishFilter, setParishFilter] = useState('');
  const [daysAhead, setDaysAhead] = useState(30);

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
  }, [permissionLoading, fetchParishes]);

  useEffect(() => {
    if (permissionLoading) return;
    const today = new Date();
    const dateTo = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    fetchNameDays({
      dateFrom: today.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
      parishId: parishFilter || undefined,
      daysAhead,
    });
  }, [permissionLoading, parishFilter, daysAhead, fetchNameDays]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale);
  };

  const columns = [
    {
      key: 'upcomingNameDay',
      label: t('nameDay') || 'Name Day',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'firstName',
      label: t('name') || 'Name',
      sortable: false,
      render: (_: any, row: any) => `${row.firstName || ''} ${row.lastName || ''}`.trim() || row.code,
    },
    {
      key: 'daysUntil',
      label: t('daysUntil') || 'Days Until',
      sortable: false,
    },
    {
      key: 'phone',
      label: t('phone'),
      sortable: false,
    },
  ];

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('parishioners') || 'Parishioners', href: `/${locale}/dashboard/parishioners` },
    { label: t('nameDays') || 'Name Days' },
  ];

  return (
    <div>
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbs} className="mb-2" />
        <h1 className="text-3xl font-bold text-text-primary">{t('nameDays') || 'Upcoming Name Days'}</h1>
      </div>

      <Card variant="outlined" className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              className="px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={parishFilter}
              onChange={(e) => setParishFilter(e.target.value)}
            >
              <option value="">{t('allParishes') || 'All Parishes'}</option>
              {parishes.map((parish) => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              label={t('daysAhead') || 'Days Ahead'}
              value={daysAhead.toString()}
              onChange={(e) => setDaysAhead(parseInt(e.target.value) || 30)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div>{t('loading') || 'Loading...'}</div>
          ) : (
            <Table data={nameDays} columns={columns} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}


