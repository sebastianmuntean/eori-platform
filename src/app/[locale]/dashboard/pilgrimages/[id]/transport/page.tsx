'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { usePilgrimage } from '@/hooks/usePilgrimage';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PILGRIMAGES_PERMISSIONS } from '@/lib/permissions/pilgrimages';

// Temporary hook until we create usePilgrimageTransport
function usePilgrimageTransport(pilgrimageId: string) {
  const [transport, setTransport] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/transport`);
      const result = await response.json();
      if (result.success) {
        setTransport(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transport');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pilgrimageId) {
      fetchTransport();
    }
  }, [pilgrimageId]);

  return { transport, loading, error, fetchTransport };
}

export default function PilgrimageTransportPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');

  // Check permission to view pilgrimages
  const { loading: permissionLoading } = useRequirePermission(PILGRIMAGES_PERMISSIONS.VIEW);

  const { pilgrimage, fetchPilgrimage } = usePilgrimage();
  const { transport, loading, error } = usePilgrimageTransport(id);
  usePageTitle(pilgrimage?.title ? `${tPilgrimages('transport') || 'Transport'} - ${pilgrimage.title}` : (tPilgrimages('transport') || 'Transport'));

  // Don't render content while checking permissions
  if (permissionLoading) {
    return null;
  }

  useEffect(() => {
    if (id) {
      fetchPilgrimage(id);
    }
  }, [id, fetchPilgrimage]);

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: tPilgrimages('pilgrimages'), href: `/${locale}/dashboard/pilgrimages` },
    { label: pilgrimage?.title || tPilgrimages('pilgrimage'), href: `/${locale}/dashboard/pilgrimages/${id}` },
    { label: tPilgrimages('transport') },
  ];

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  };

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return time;
  };

  const getTransportTypeLabel = (type: string) => {
    return tPilgrimages(`transportTypes.${type}` as any) || type;
  };

  const columns = [
    {
      key: 'transportType',
      label: tPilgrimages('transportType'),
      sortable: false,
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          {getTransportTypeLabel(value)}
        </Badge>
      ),
    },
    {
      key: 'departureLocation',
      label: tPilgrimages('departureLocation'),
      sortable: false,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'departureDate',
      label: tPilgrimages('departureDate'),
      sortable: false,
      render: (value: string | null) => formatDate(value),
    },
    {
      key: 'arrivalLocation',
      label: tPilgrimages('arrivalLocation'),
      sortable: false,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'arrivalDate',
      label: tPilgrimages('arrivalDate'),
      sortable: false,
      render: (value: string | null) => formatDate(value),
    },
    {
      key: 'providerName',
      label: tPilgrimages('providerName'),
      sortable: false,
      render: (value: string | null) => value || '-',
    },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={tPilgrimages('transport') || 'Transport'}
        action={
          <Button onClick={() => {/* TODO: Add transport modal */}}>
            {tPilgrimages('addTransport')}
          </Button>
        }
        className="mb-6"
      />

      {/* Transport Table */}
      <Card variant="outlined">
        <CardBody>
          {error && (
            <div className="mb-4 p-4 bg-danger/10 text-danger rounded-md">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-center py-8 text-text-secondary">{t('loading') || 'Loading...'}</div>
          ) : (
            <Table
              data={transport}
              columns={columns}
              emptyMessage={tPilgrimages('noTransport') || 'No transport available'}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
