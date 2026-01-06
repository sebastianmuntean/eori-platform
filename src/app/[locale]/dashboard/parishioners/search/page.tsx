'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { TablePagination } from '@/components/ui/TablePagination';
import { useParishionerSearch } from '@/hooks/useParishionerSearch';
import { Client } from '@/hooks/useClients';
import { useParishes } from '@/hooks/useParishes';
import { useParishionerTypes } from '@/hooks/useParishionerTypes';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PARISHIONERS_PERMISSIONS } from '@/lib/permissions/parishioners';

const PAGE_SIZE = 10;

export default function ParishionerSearchPage() {
  const { loading: permissionLoading } = useRequirePermission(PARISHIONERS_PERMISSIONS.SEARCH);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle(t('search'));

  // All hooks must be called before any conditional returns
  const { results, loading, error, pagination, search } = useParishionerSearch();
  const { parishes, fetchParishes } = useParishes();
  const { types, fetchTypes } = useParishionerTypes();

  const [searchParams, setSearchParams] = useState({
    search: '',
    firstName: '',
    lastName: '',
    cnp: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    parishId: '',
    parishionerTypeId: '',
    isParishioner: '',
    isActive: 'true',
    birthDateFrom: '',
    birthDateTo: '',
    nameDayFrom: '',
    nameDayTo: '',
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
    fetchTypes({ all: true });
  }, [permissionLoading, fetchParishes, fetchTypes]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const handleSearch = () => {
    setCurrentPage(1);
    search({
      page: 1,
      pageSize: PAGE_SIZE,
      ...searchParams,
      isParishioner: searchParams.isParishioner ? searchParams.isParishioner === 'true' : undefined,
      isActive: searchParams.isActive ? searchParams.isActive === 'true' : undefined,
    });
  };

  const columns = [
    { key: 'code' as keyof Client, label: t('code'), sortable: true },
    {
      key: 'name' as keyof Client,
      label: t('name'),
      sortable: false,
      render: (_: any, row: any) => row.companyName || `${row.firstName || ''} ${row.lastName || ''}`.trim() || row.code,
    },
    { key: 'cnp' as keyof Client, label: 'CNP', sortable: false },
    { key: 'phone' as keyof Client, label: t('phone'), sortable: false },
    { key: 'email' as keyof Client, label: t('email'), sortable: false },
    { key: 'city' as keyof Client, label: t('city'), sortable: false },
  ];

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('parishioners') || 'Parishioners', href: `/${locale}/dashboard/parishioners` },
          { label: t('search') || 'Search' },
        ]}
        title={t('complexSearch') || 'Complex Search'}
      />

      <Card variant="outlined">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label={t('search') || 'General Search'}
              value={searchParams.search}
              onChange={(e) => setSearchParams({ ...searchParams, search: e.target.value })}
            />
            <Input
              label={t('firstName') || 'First Name'}
              value={searchParams.firstName}
              onChange={(e) => setSearchParams({ ...searchParams, firstName: e.target.value })}
            />
            <Input
              label={t('lastName') || 'Last Name'}
              value={searchParams.lastName}
              onChange={(e) => setSearchParams({ ...searchParams, lastName: e.target.value })}
            />
            <Input
              label="CNP"
              value={searchParams.cnp}
              onChange={(e) => setSearchParams({ ...searchParams, cnp: e.target.value })}
            />
            <Input
              label={t('phone')}
              value={searchParams.phone}
              onChange={(e) => setSearchParams({ ...searchParams, phone: e.target.value })}
            />
            <Input
              label={t('email')}
              value={searchParams.email}
              onChange={(e) => setSearchParams({ ...searchParams, email: e.target.value })}
            />
            <Input
              label={t('address')}
              value={searchParams.address}
              onChange={(e) => setSearchParams({ ...searchParams, address: e.target.value })}
            />
            <Input
              label={t('city')}
              value={searchParams.city}
              onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
            />
            <select
              className="px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={searchParams.parishId}
              onChange={(e) => setSearchParams({ ...searchParams, parishId: e.target.value })}
            >
              <option value="">{t('allParishes') || 'All Parishes'}</option>
              {parishes.map((parish) => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={searchParams.parishionerTypeId}
              onChange={(e) => setSearchParams({ ...searchParams, parishionerTypeId: e.target.value })}
            >
              <option value="">{t('allTypes') || 'All Types'}</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <Input
              type="date"
              label={t('birthDateFrom') || 'Birth Date From'}
              value={searchParams.birthDateFrom}
              onChange={(e) => setSearchParams({ ...searchParams, birthDateFrom: e.target.value })}
            />
            <Input
              type="date"
              label={t('birthDateTo') || 'Birth Date To'}
              value={searchParams.birthDateTo}
              onChange={(e) => setSearchParams({ ...searchParams, birthDateTo: e.target.value })}
            />
          </div>
          <div className="mt-4">
            <Button onClick={handleSearch}>{t('search')}</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div>{t('loading') || 'Loading...'}</div>
          ) : (
            <>
              <Table
                data={results}
                columns={columns}
              />
              {pagination && pagination.totalPages > 1 && (
                <TablePagination
                  pagination={pagination}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  loading={loading}
                  t={t}
                />
              )}
            </>
          )}
        </CardBody>
      </Card>
    </PageContainer>
  );
}

