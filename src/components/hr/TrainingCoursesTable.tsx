'use client';

import { useState, useEffect, useMemo } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';
import { TrainingCourse, useTrainingCourses } from '@/hooks/useTrainingCourses';
import { useTableFilters } from '@/hooks/useTableFilters';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useTableSort } from '@/hooks/useTableSort';
import { formatDate, formatCurrency } from '@/lib/utils/hr';

interface TrainingCoursesTableProps {
  onEdit?: (course: TrainingCourse) => void;
  onDelete?: (course: TrainingCourse) => void;
  onView?: (course: TrainingCourse) => void;
}

interface TrainingCourseFilters extends Record<string, string> {
  search: string;
  isActive: string;
}

export function TrainingCoursesTable({ onEdit, onDelete, onView }: TrainingCoursesTableProps) {
  const t = useTranslations('common');
  const { trainingCourses, loading, error, pagination, fetchTrainingCourses } = useTrainingCourses();

  const { filters, setFilter, clearFilters, hasActiveFilters } = useTableFilters<TrainingCourseFilters>({
    initialFilters: {
      search: '',
      isActive: '',
    },
  });

  const { page, pageSize, setPage, setPageSize, pageSizeOptions } = useTablePagination({
    initialPage: 1,
    initialPageSize: 10,
  });

  const { sortBy, sortOrder, sortConfig, handleSort } = useTableSort<TrainingCourse>({
    initialSortBy: 'name',
    initialSortOrder: 'asc',
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, setPage]);

  // Fetch training courses when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTrainingCourses({
        page,
        pageSize,
        search: filters.search || undefined,
        isActive: filters.isActive ? filters.isActive === 'true' : undefined,
        sortBy: sortBy as string,
        sortOrder,
      });
    }, filters.search ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [page, pageSize, filters, sortBy, sortOrder, fetchTrainingCourses]);

  // Memoized column definitions
  const columns = useMemo(
    () => [
      {
        key: 'code' as keyof TrainingCourse,
        label: t('courseCode') || 'Code',
        sortable: true,
        render: (value: string) => <span className="font-mono text-sm">{value}</span>,
      },
      {
        key: 'name' as keyof TrainingCourse,
        label: t('courseName') || 'Name',
        sortable: true,
        render: (value: string) => <span className="font-medium">{value}</span>,
      },
      {
        key: 'provider' as keyof TrainingCourse,
        label: t('provider') || 'Provider',
        sortable: true,
        render: (value: string | null) => {
          if (!value) return <span className="text-text-muted">-</span>;
          return <span>{value}</span>;
        },
      },
      {
        key: 'durationHours' as keyof TrainingCourse,
        label: t('durationHours') || 'Duration (Hours)',
        sortable: true,
        render: (value: number | null) => {
          if (!value) return <span className="text-text-muted">-</span>;
          return <span>{value} {t('hours') || 'hours'}</span>;
        },
      },
      {
        key: 'cost' as keyof TrainingCourse,
        label: t('cost') || 'Cost',
        sortable: true,
        render: (value: string | null) => {
          if (!value) return <span className="text-text-muted">-</span>;
          return <span>{formatCurrency(value)}</span>;
        },
      },
      {
        key: 'isCertified' as keyof TrainingCourse,
        label: t('isCertified') || 'Certified',
        sortable: true,
        render: (value: boolean) => (
          <span className={value ? 'text-green-600' : 'text-text-muted'}>
            {value ? t('yes') || 'Yes' : t('no') || 'No'}
          </span>
        ),
      },
      {
        key: 'isActive' as keyof TrainingCourse,
        label: t('status') || 'Status',
        sortable: true,
        render: (value: boolean) => (
          <span className={value ? 'text-green-600 font-medium' : 'text-text-muted'}>
            {value ? t('active') || 'Active' : t('inactive') || 'Inactive'}
          </span>
        ),
      },
      {
        key: 'actions' as keyof TrainingCourse,
        label: t('actions') || 'Actions',
        sortable: false,
        render: (_: unknown, row: TrainingCourse) => (
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
    ],
    [t, onView, onEdit, onDelete]
  );

  const statusOptions = useMemo(
    () => [
      { value: '', label: t('allStatuses') || 'All statuses' },
      { value: 'true', label: t('active') || 'Active' },
      { value: 'false', label: t('inactive') || 'Inactive' },
    ],
    [t]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('trainingCourses') || 'Training Courses'}</h2>
        </div>
      </CardHeader>
      <CardBody>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('search')}
              type="text"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder={t('searchByNameOrCode') || 'Search by name or code...'}
            />
            <Select
              label={t('status')}
              value={filters.isActive}
              onChange={(e) => setFilter('isActive', e.target.value)}
              options={statusOptions}
              placeholder={t('allStatuses') || 'All statuses'}
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
              data={trainingCourses}
              columns={columns}
              sortConfig={sortConfig}
              onSort={(key) => handleSort(key as keyof TrainingCourse)}
              emptyMessage={t('noTrainingCourses') || 'No training courses found'}
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  {t('showing') || 'Showing'} {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('of') || 'of'}{' '}
                  {pagination.total} {t('trainingCourses') || 'training courses'}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
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
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.totalPages}
                  >
                    {t('next') || 'Next'}
                  </Button>
                  <Select
                    value={pageSize.toString()}
                    onChange={(e) => setPageSize(parseInt(e.target.value))}
                    options={pageSizeOptions}
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

