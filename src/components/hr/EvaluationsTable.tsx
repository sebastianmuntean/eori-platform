'use client';

import { useState, useEffect, useMemo } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';
import { Evaluation, useEvaluations } from '@/hooks/useEvaluations';
import { useEmployees } from '@/hooks/useEmployees';
import { useTableFilters } from '@/hooks/useTableFilters';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useTableSort } from '@/hooks/useTableSort';
import {
  EVALUATION_STATUS_COLORS,
  formatDate,
  getStatusBadgeClasses,
  getEmployeeDisplayName,
} from '@/lib/utils/hr';

interface EvaluationsTableProps {
  onEdit?: (evaluation: Evaluation) => void;
  onDelete?: (evaluation: Evaluation) => void;
  onView?: (evaluation: Evaluation) => void;
  onAcknowledge?: (evaluation: Evaluation) => void;
}

interface EvaluationFilters extends Record<string, string> {
  employeeId: string;
  evaluatorId: string;
  status: string;
}

export function EvaluationsTable({ onEdit, onDelete, onView, onAcknowledge }: EvaluationsTableProps) {
  const t = useTranslations('common');
  const { evaluations, loading, error, pagination, fetchEvaluations } = useEvaluations();
  const { employees, fetchEmployees } = useEmployees();

  const { filters, setFilter, clearFilters, hasActiveFilters } = useTableFilters<EvaluationFilters>({
    initialFilters: {
      employeeId: '',
      evaluatorId: '',
      status: '',
    },
  });

  const { page, pageSize, setPage, setPageSize, pageSizeOptions } = useTablePagination({
    initialPage: 1,
    initialPageSize: 10,
  });

  const { sortBy, sortOrder, sortConfig, handleSort } = useTableSort<Evaluation>({
    initialSortBy: 'evaluationDate',
    initialSortOrder: 'desc',
  });

  // Load employees when component mounts
  useEffect(() => {
    fetchEmployees({ pageSize: 1000 });
  }, [fetchEmployees]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, setPage]);

  // Fetch evaluations when filters change
  useEffect(() => {
    fetchEvaluations({
      page,
      pageSize,
      employeeId: filters.employeeId || undefined,
      evaluatorId: filters.evaluatorId || undefined,
      status: filters.status || undefined,
      sortBy: sortBy as string,
      sortOrder,
    });
  }, [page, pageSize, filters, sortBy, sortOrder, fetchEvaluations]);

  // Memoized lookup maps for performance
  const employeeMap = useMemo(() => {
    return new Map(employees.map((e) => [e.id, e]));
  }, [employees]);

  // Memoized column definitions
  const columns = useMemo(
    () => [
      {
        key: 'evaluationDate' as keyof Evaluation,
        label: t('evaluationDate') || 'Evaluation Date',
        sortable: true,
        render: (value: string) => <span>{formatDate(value)}</span>,
      },
      {
        key: 'employeeId' as keyof Evaluation,
        label: t('employee') || 'Employee',
        sortable: false,
        render: (_: unknown, row: Evaluation) => {
          const employee = employeeMap.get(row.employeeId);
          return <span>{getEmployeeDisplayName(employee)}</span>;
        },
      },
      {
        key: 'evaluationPeriodStart' as keyof Evaluation,
        label: t('evaluationPeriod') || 'Period',
        sortable: false,
        render: (_: unknown, row: Evaluation) => (
          <div>
            <div className="text-sm">{formatDate(row.evaluationPeriodStart)}</div>
            <div className="text-xs text-text-muted">
              {t('to') || 'to'} {formatDate(row.evaluationPeriodEnd)}
            </div>
          </div>
        ),
      },
      {
        key: 'overallScore' as keyof Evaluation,
        label: t('overallScore') || 'Score',
        sortable: true,
        render: (value: string | null) => {
          if (!value) return <span className="text-text-muted">-</span>;
          return <span className="font-semibold">{value}</span>;
        },
      },
      {
        key: 'status' as keyof Evaluation,
        label: t('status') || 'Status',
        sortable: true,
        render: (value: string) => (
          <span className={getStatusBadgeClasses(value, EVALUATION_STATUS_COLORS)}>
            {t(value) || value}
          </span>
        ),
      },
      {
        key: 'actions' as keyof Evaluation,
        label: t('actions') || 'Actions',
        sortable: false,
        render: (_: unknown, row: Evaluation) => (
          <div className="flex items-center gap-2">
            {onView && (
              <Button variant="ghost" size="sm" onClick={() => onView(row)}>
                {t('view')}
              </Button>
            )}
            {onEdit && row.status === 'draft' && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
                {t('edit')}
              </Button>
            )}
            {onAcknowledge && row.status === 'completed' && !row.acknowledgedAt && (
              <Button variant="ghost" size="sm" onClick={() => onAcknowledge(row)}>
                {t('acknowledge')}
              </Button>
            )}
            {onDelete && row.status === 'draft' && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(row)}>
                {t('delete')}
              </Button>
            )}
          </div>
        ),
      },
    ],
    [t, employeeMap, onView, onEdit, onAcknowledge, onDelete]
  );

  // Memoized filter options
  const employeeOptions = useMemo(
    () =>
      employees
        .filter((e) => e.isActive)
        .map((e) => ({
          value: e.id,
          label: getEmployeeDisplayName(e),
        })),
    [employees]
  );

  const statusOptions = useMemo(
    () => [
      { value: 'draft', label: t('draft') || 'Draft' },
      { value: 'completed', label: t('completed') || 'Completed' },
      { value: 'acknowledged', label: t('acknowledged') || 'Acknowledged' },
    ],
    [t]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('evaluations') || 'Evaluations'}</h2>
        </div>
      </CardHeader>
      <CardBody>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label={t('employee')}
              value={filters.employeeId}
              onChange={(e) => setFilter('employeeId', e.target.value)}
              options={employeeOptions}
              placeholder={t('allEmployees') || 'All employees'}
            />
            <Select
              label={t('status')}
              value={filters.status}
              onChange={(e) => setFilter('status', e.target.value)}
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
              data={evaluations}
              columns={columns}
              sortConfig={sortConfig}
              onSort={(key) => handleSort(key as keyof Evaluation)}
              emptyMessage={t('noEvaluations') || 'No evaluations found'}
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  {t('showing') || 'Showing'} {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('of') || 'of'}{' '}
                  {pagination.total} {t('evaluations') || 'evaluations'}
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

