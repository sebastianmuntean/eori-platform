'use client';

import { useState, useEffect } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';
import { Position, usePositions } from '@/hooks/usePositions';
import { useParishes } from '@/hooks/useParishes';
import { useDepartments } from '@/hooks/useDepartments';

interface PositionsTableProps {
  onEdit?: (position: Position) => void;
  onDelete?: (position: Position) => void;
  onView?: (position: Position) => void;
}

export function PositionsTable({ onEdit, onDelete, onView }: PositionsTableProps) {
  const t = useTranslations('common');
  const { positions, loading, error, pagination, fetchPositions } = usePositions();
  const { parishes, fetchParishes } = useParishes();
  const { departments, fetchDepartments } = useDepartments();

  const [search, setSearch] = useState('');
  const [parishId, setParishId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load parishes and departments when component mounts
  useEffect(() => {
    fetchParishes({ pageSize: 1000 });
  }, [fetchParishes]);

  // Load departments when parish changes
  useEffect(() => {
    if (parishId) {
      fetchDepartments({ parishId, pageSize: 1000 });
    } else {
      fetchDepartments({ pageSize: 1000 });
    }
  }, [parishId, fetchDepartments]);

  // Fetch positions when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPositions({
        page,
        pageSize,
        search: search || undefined,
        parishId: parishId || undefined,
        departmentId: departmentId || undefined,
        isActive: isActive !== null ? isActive : undefined,
        sortBy,
        sortOrder,
      });
    }, search ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [page, pageSize, search, parishId, departmentId, isActive, sortBy, sortOrder, fetchPositions]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setParishId('');
    setDepartmentId('');
    setIsActive(null);
    setPage(1);
  };

  const columns = [
    {
      key: 'code' as keyof Position,
      label: t('code') || 'Code',
      sortable: true,
      render: (value: string) => <span className="font-mono text-sm">{value}</span>,
    },
    {
      key: 'title' as keyof Position,
      label: t('title') || 'Title',
      sortable: true,
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'parishId' as keyof Position,
      label: t('parish') || 'Parish',
      sortable: false,
      render: (_: any, row: Position) => {
        const parish = parishes.find((p) => p.id === row.parishId);
        return <span>{parish?.name || '-'}</span>;
      },
    },
    {
      key: 'departmentId' as keyof Position,
      label: t('department') || 'Department',
      sortable: false,
      render: (_: any, row: Position) => {
        if (!row.departmentId) return <span className="text-text-muted">-</span>;
        const department = departments.find((d) => d.id === row.departmentId);
        return <span>{department?.name || '-'}</span>;
      },
    },
    {
      key: 'minSalary' as keyof Position,
      label: t('salaryRange') || 'Salary Range',
      sortable: false,
      render: (_: any, row: Position) => {
        if (!row.minSalary && !row.maxSalary) return <span className="text-text-muted">-</span>;
        const min = row.minSalary ? parseFloat(row.minSalary).toFixed(2) : '-';
        const max = row.maxSalary ? parseFloat(row.maxSalary).toFixed(2) : '-';
        return <span>{min} - {max} RON</span>;
      },
    },
    {
      key: 'isActive' as keyof Position,
      label: t('status') || 'Status',
      sortable: true,
      render: (value: boolean) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value ? t('active') : t('inactive')}
        </span>
      ),
    },
    {
      key: 'actions' as keyof Position,
      label: t('actions') || 'Actions',
      sortable: false,
      render: (_: any, row: Position) => (
        <div className="flex items-center gap-2">
          {onView && (
            <Button variant="ghost" size="sm" onClick={() => onView(row)}>
              {t('view')}
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
              {t('edit')}
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(row)}>
              {t('delete')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const sortConfig = {
    key: sortBy as keyof Position,
    direction: sortOrder as 'asc' | 'desc',
  };

  const parishOptions = parishes
    .filter((p) => p.isActive)
    .map((p) => ({ value: p.id, label: p.name }));

  const departmentOptions = departments
    .filter((d) => !parishId || d.parishId === parishId)
    .filter((d) => d.isActive)
    .map((d) => ({ value: d.id, label: d.name }));

  const activeStatusOptions = [
    { value: 'true', label: t('active') || 'Active' },
    { value: 'false', label: t('inactive') || 'Inactive' },
    { value: '', label: t('all') || 'All' },
  ];

  const hasActiveFilters = search || parishId || departmentId || isActive !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('positions') || 'Positions'}</h2>
        </div>
      </CardHeader>
      <CardBody>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('searchPositions') || 'Search positions...'}
            />
            <Select
              label={t('parish')}
              value={parishId}
              onChange={(e) => {
                setParishId(e.target.value);
                setDepartmentId('');
              }}
              options={parishOptions}
              placeholder={t('allParishes') || 'All parishes'}
            />
            <Select
              label={t('department')}
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              options={departmentOptions}
              placeholder={t('allDepartments') || 'All departments'}
              disabled={!parishId}
            />
            <Select
              label={t('isActive')}
              value={isActive === null ? '' : isActive.toString()}
              onChange={(e) => setIsActive(e.target.value === '' ? null : e.target.value === 'true')}
              options={activeStatusOptions}
            />
          </div>
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                {t('clearFilters') || 'Clear Filters'}
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        {loading && <div className="text-center py-8">{t('loading') || 'Loading...'}</div>}
        {error && <div className="text-center py-8 text-danger">{error}</div>}
        {!loading && !error && (
          <>
            <Table
              data={positions}
              columns={columns}
              sortConfig={sortConfig}
              onSort={(key) => handleSort(key as string)}
              emptyMessage={t('noPositions') || 'No positions found'}
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  {t('showing') || 'Showing'} {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('of') || 'of'}{' '}
                  {pagination.total} {t('positions') || 'positions'}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    {t('previous') || 'Previous'}
                  </Button>
                  <span className="text-sm text-text-secondary">
                    {t('page') || 'Page'} {page} {t('of') || 'of'} {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= pagination.totalPages}
                  >
                    {t('next') || 'Next'}
                  </Button>
                  <Select
                    value={pageSize.toString()}
                    onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                    options={[
                      { value: '10', label: '10' },
                      { value: '25', label: '25' },
                      { value: '50', label: '50' },
                      { value: '100', label: '100' },
                    ]}
                    className="w-20"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

