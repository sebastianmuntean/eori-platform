'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';
import { Salary, useSalaries } from '@/hooks/useSalaries';
import { useEmployees } from '@/hooks/useEmployees';
import { useTableFilters } from '@/hooks/useTableFilters';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useTableSort } from '@/hooks/useTableSort';
import {
  SALARY_STATUS_COLORS,
  formatDate,
  formatCurrency,
  formatSalaryPeriod,
  formatWorkedDays,
  getStatusBadgeClasses,
  getEmployeeDisplayName,
} from '@/lib/utils/hr';

interface SalariesTableProps {
  onEdit?: (salary: Salary) => void;
  onDelete?: (salary: Salary) => void;
  onView?: (salary: Salary) => void;
  onApprove?: (salary: Salary) => void;
  onPay?: (salary: Salary) => void;
}

interface SalaryFilters extends Record<string, string> {
  employeeId: string;
  status: string;
  periodFrom: string;
  periodTo: string;
}

export function SalariesTable({ onEdit, onDelete, onView, onApprove, onPay }: SalariesTableProps) {
  const t = useTranslations('common');
  const { salaries, loading, error, pagination, fetchSalaries } = useSalaries();
  const { employees, fetchEmployees } = useEmployees();

  const { filters, setFilter, clearFilters, hasActiveFilters } = useTableFilters<SalaryFilters>({
    initialFilters: {
      employeeId: '',
      status: '',
      periodFrom: '',
      periodTo: '',
    },
  });

  const { page, pageSize, setPage, setPageSize, pageSizeOptions } = useTablePagination({
    initialPage: 1,
    initialPageSize: 10,
  });

  const { sortBy, sortOrder, sortConfig, handleSort } = useTableSort<Salary>({
    initialSortBy: 'salaryPeriod',
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

  // Fetch salaries when filters change
  useEffect(() => {
    fetchSalaries({
      page,
      pageSize,
      employeeId: filters.employeeId || undefined,
      status: filters.status || undefined,
      periodFrom: filters.periodFrom || undefined,
      periodTo: filters.periodTo || undefined,
      sortBy: sortBy as string,
      sortOrder,
    });
  }, [page, pageSize, filters, sortBy, sortOrder, fetchSalaries]);

  // Memoized employee lookup map for performance
  const employeeMap = useMemo(() => {
    return new Map(employees.map((e) => [e.id, e]));
  }, [employees]);

  // Memoized column definitions
  const columns = useMemo(
    () => [
      {
        key: 'salaryPeriod' as keyof Salary,
        label: t('salaryPeriod') || 'Period',
        sortable: true,
        render: (value: string) => <span>{formatSalaryPeriod(value)}</span>,
      },
      {
        key: 'employeeId' as keyof Salary,
        label: t('employee') || 'Employee',
        sortable: false,
        render: (_: unknown, row: Salary) => {
          const employee = employeeMap.get(row.employeeId);
          return <span>{getEmployeeDisplayName(employee)}</span>;
        },
      },
      {
        key: 'baseSalary' as keyof Salary,
        label: t('baseSalary') || 'Base Salary',
        sortable: true,
        render: (value: string) => <span className="font-medium">{formatCurrency(value)}</span>,
      },
      {
        key: 'grossSalary' as keyof Salary,
        label: t('grossSalary') || 'Gross Salary',
        sortable: true,
        render: (value: string) => <span>{formatCurrency(value)}</span>,
      },
      {
        key: 'netSalary' as keyof Salary,
        label: t('netSalary') || 'Net Salary',
        sortable: true,
        render: (value: string) => <span className="font-semibold text-primary">{formatCurrency(value)}</span>,
      },
      {
        key: 'workedDays' as keyof Salary,
        label: t('workedDays') || 'Worked Days',
        sortable: true,
        render: (value: number, row: Salary) => <span>{formatWorkedDays(value, row.workingDays)}</span>,
      },
      {
        key: 'status' as keyof Salary,
        label: t('status') || 'Status',
        sortable: true,
        render: (value: string) => (
          <span className={getStatusBadgeClasses(value, SALARY_STATUS_COLORS)}>
            {t(value) || value}
          </span>
        ),
      },
      {
        key: 'actions' as keyof Salary,
        label: t('actions') || 'Actions',
        sortable: false,
        render: (_: unknown, row: Salary) => (
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
            {onApprove && row.status === 'calculated' && (
              <Button variant="ghost" size="sm" onClick={() => onApprove(row)}>
                {t('approve')}
              </Button>
            )}
            {onPay && row.status === 'approved' && (
              <Button variant="ghost" size="sm" onClick={() => onPay(row)}>
                {t('pay')}
              </Button>
            )}
            {onDelete && (row.status === 'draft' || row.status === 'cancelled') && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(row)}>
                {t('delete')}
              </Button>
            )}
          </div>
        ),
      },
    ],
    [t, employeeMap, onView, onEdit, onApprove, onPay, onDelete]
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
      { value: 'calculated', label: t('calculated') || 'Calculated' },
      { value: 'approved', label: t('approved') || 'Approved' },
      { value: 'paid', label: t('paid') || 'Paid' },
      { value: 'cancelled', label: t('cancelled') || 'Cancelled' },
    ],
    [t]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('salaries') || 'Salaries'}</h2>
        </div>
      </CardHeader>
      <CardBody>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <Input
              label={t('periodFrom') || 'Period From'}
              type="date"
              value={filters.periodFrom}
              onChange={(e) => setFilter('periodFrom', e.target.value)}
            />
            <Input
              label={t('periodTo') || 'Period To'}
              type="date"
              value={filters.periodTo}
              onChange={(e) => setFilter('periodTo', e.target.value)}
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
              data={salaries}
              columns={columns}
              sortConfig={sortConfig}
              onSort={(key) => handleSort(key as keyof Salary)}
              emptyMessage={t('noSalaries') || 'No salaries found'}
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  {t('showing') || 'Showing'} {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('of') || 'of'}{' '}
                  {pagination.total} {t('salaries') || 'salaries'}
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

