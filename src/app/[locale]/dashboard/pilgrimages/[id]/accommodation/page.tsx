'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { usePilgrimage } from '@/hooks/usePilgrimage';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PILGRIMAGES_PERMISSIONS } from '@/lib/permissions/pilgrimages';

// Temporary hook until we create usePilgrimageAccommodation
function usePilgrimageAccommodation(pilgrimageId: string) {
  const [accommodation, setAccommodation] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccommodation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/accommodation`);
      const result = await response.json();
      if (result.success) {
        setAccommodation(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accommodation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pilgrimageId) {
      fetchAccommodation();
    }
  }, [pilgrimageId]);

  return { accommodation, loading, error, fetchAccommodation };
}

export default function PilgrimageAccommodationPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');

  // Check permission to view pilgrimages
  const { loading: permissionLoading } = useRequirePermission(PILGRIMAGES_PERMISSIONS.VIEW);

  const { pilgrimage, fetchPilgrimage } = usePilgrimage();
  const { accommodation, loading, error } = usePilgrimageAccommodation(id);
  usePageTitle(pilgrimage?.title ? `${tPilgrimages('accommodation') || 'Accommodation'} - ${pilgrimage.title}` : (tPilgrimages('accommodation') || 'Accommodation'));

  useEffect(() => {
    if (permissionLoading) return;
    if (id) {
      fetchPilgrimage(id);
    }
  }, [permissionLoading, id, fetchPilgrimage]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: tPilgrimages('pilgrimages'), href: `/${locale}/dashboard/pilgrimages` },
    { label: pilgrimage?.title || tPilgrimages('pilgrimage'), href: `/${locale}/dashboard/pilgrimages/${id}` },
    { label: tPilgrimages('accommodation') },
  ];

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  };

  const getAccommodationTypeLabel = (type: string | null) => {
    if (!type) return '-';
    return tPilgrimages(`accommodationTypes.${type}` as any) || type;
  };

  const getRoomTypeLabel = (type: string | null) => {
    if (!type) return '-';
    return tPilgrimages(`roomTypes.${type}` as any) || type;
  };

  const columns = [
    {
      key: 'accommodationName',
      label: tPilgrimages('accommodationName'),
      sortable: false,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'accommodationType',
      label: tPilgrimages('accommodationType'),
      sortable: false,
      render: (value: string | null) => (
        <Badge variant="secondary" size="sm">
          {getAccommodationTypeLabel(value)}
        </Badge>
      ),
    },
    {
      key: 'city',
      label: tPilgrimages('city'),
      sortable: false,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'checkInDate',
      label: tPilgrimages('checkInDate'),
      sortable: false,
      render: (value: string | null) => formatDate(value),
    },
    {
      key: 'checkOutDate',
      label: tPilgrimages('checkOutDate'),
      sortable: false,
      render: (value: string | null) => formatDate(value),
    },
    {
      key: 'roomType',
      label: tPilgrimages('roomType'),
      sortable: false,
      render: (value: string | null) => getRoomTypeLabel(value),
    },
    {
      key: 'totalRooms',
      label: tPilgrimages('totalRooms'),
      sortable: false,
      render: (value: number | null) => value || '-',
    },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={tPilgrimages('accommodation') || 'Accommodation'}
        action={
          <Button onClick={() => {/* TODO: Add accommodation modal */}}>
            {tPilgrimages('addAccommodation')}
          </Button>
        }
        className="mb-6"
      />

      {/* Accommodation Table */}
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
              data={accommodation}
              columns={columns}
              emptyMessage={tPilgrimages('noAccommodation') || 'No accommodation available'}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
