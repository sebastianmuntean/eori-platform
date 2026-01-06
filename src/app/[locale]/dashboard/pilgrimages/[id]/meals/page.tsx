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

// Temporary hook until we create usePilgrimageMeals
function usePilgrimageMeals(pilgrimageId: string) {
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/meals`);
      const result = await response.json();
      if (result.success) {
        setMeals(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pilgrimageId) {
      fetchMeals();
    }
  }, [pilgrimageId]);

  return { meals, loading, error, fetchMeals };
}

export default function PilgrimageMealsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');

  // Check permission to view pilgrimages
  const { loading: permissionLoading } = useRequirePermission(PILGRIMAGES_PERMISSIONS.VIEW);

  const { pilgrimage, fetchPilgrimage } = usePilgrimage();
  const { meals, loading, error } = usePilgrimageMeals(id);
  usePageTitle(pilgrimage?.title ? `${tPilgrimages('meals') || 'Meals'} - ${pilgrimage.title}` : (tPilgrimages('meals') || 'Meals'));

  useEffect(() => {
    if (permissionLoading) return;
    if (id) {
      fetchPilgrimage(id);
    }
  }, [permissionLoading, id, fetchPilgrimage]);

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: tPilgrimages('pilgrimages'), href: `/${locale}/dashboard/pilgrimages` },
    { label: pilgrimage?.title || tPilgrimages('pilgrimage'), href: `/${locale}/dashboard/pilgrimages/${id}` },
    { label: tPilgrimages('meals') },
  ];

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  };

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return time;
  };

  const getMealTypeLabel = (type: string) => {
    return tPilgrimages(`mealTypes.${type}` as any) || type;
  };

  const columns = [
    {
      key: 'mealDate',
      label: tPilgrimages('mealDate'),
      sortable: true,
      render: (value: string | null) => formatDate(value),
    },
    {
      key: 'mealType',
      label: tPilgrimages('mealType'),
      sortable: false,
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          {getMealTypeLabel(value)}
        </Badge>
      ),
    },
    {
      key: 'mealTime',
      label: tPilgrimages('mealTime'),
      sortable: false,
      render: (value: string | null) => formatTime(value),
    },
    {
      key: 'location',
      label: tPilgrimages('location'),
      sortable: false,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'providerName',
      label: tPilgrimages('mealProviderName'),
      sortable: false,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'pricePerPerson',
      label: tPilgrimages('pricePerPerson'),
      sortable: false,
      render: (value: string | null, row: any) => 
        value ? `${value} ${pilgrimage?.currency || 'RON'}` : '-',
    },
  ];

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={tPilgrimages('meals') || 'Meals'}
        action={
          <Button onClick={() => {/* TODO: Add meal modal */}}>
            {tPilgrimages('addMeal')}
          </Button>
        }
        className="mb-6"
      />

      {/* Meals Table */}
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
              data={meals}
              columns={columns}
              emptyMessage={tPilgrimages('noMeals') || 'No meals available'}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
