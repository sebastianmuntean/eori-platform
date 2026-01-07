'use client';

import { useState, useEffect, useCallback } from 'react';
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

const PAGE_SIZE = 10;

interface ParishionerSearchPageContentProps {
  locale: string;
}

/**
 * Parishioner Search page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function ParishionerSearchPageContent({ locale }: ParishionerSearchPageContentProps) {
  const t = useTranslations('common');

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
    fetchParishes({ all: true });
    fetchTypes({ all: true });
  }, [fetchParishes, fetchTypes]);

  // Build search parameters with proper type conversions
  const buildSearchParams = useCallback((page: number) => {
    return {
      page,
      pageSize: PAGE_SIZE,
      ...searchParams,
      isParishioner: searchParams.isParishioner ? searchParams.isParishioner === 'true' : undefined,
      isActive: searchParams.isActive ? searchParams.isActive === 'true' : undefined,
    };
  }, [searchParams]);

  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    search(buildSearchParams(1));
  }, [search, buildSearchParams]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    search(buildSearchParams(page));
  }, [search, buildSearchParams]);

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
                  onPageChange={handlePageChange}
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

