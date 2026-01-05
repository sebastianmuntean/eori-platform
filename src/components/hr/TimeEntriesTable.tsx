'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';
import { TimeEntry, useTimeEntries } from '@/hooks/useTimeEntries';
import { useEmployees } from '@/hooks/useEmployees';
import { useTableFilters } from '@/hooks/useTableFilters';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useTableSort } from '@/hooks/useTableSort';
import {
  TIME_ENTRY_STATUS_COLORS,
  formatDate,
  formatHours,
  getStatusBadgeClasses,
  getEmployeeDisplayName,
} from '@/lib/utils/hr';

interface TimeEntriesTableProps {
  onEdit?: (entry: TimeEntry) => void;
  onDelete?: (entry: TimeEntry) => void;
  onApprove?: (entry: TimeEntry) => void;
}

interface TimeEntryFilters extends Record<string, string> {
  employeeId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export function TimeEntriesTable({ onEdit, onDelete, onApprove }: TimeEntriesTableProps) {
  const t = useTranslations('common');
  const { timeEntries, loading, error, pagination, fetchTimeEntries } = useTimeEntries();
  const { employees, fetchEmployees } = useEmployees();

  const { filters, setFilter, clearFilters, hasActiveFilters } = useTableFilters<TimeEntryFilters>({
    initialFilters: {
      employeeId: '',
      status: '',
      dateFrom: '',
      dateTo: '',
    },
  });

  const { page, pageSize, setPage, setPageSize, pageSizeOptions } = useTablePagination({
    initialPage: 1,
    initialPageSize: 10,
  });

  const { sortBy, sortOrder, sortConfig, handleSort } = useTableSort<TimeEntry>({
    initialSortBy: 'entryDate',
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

  // Fetch time entries when filters change
  useEffect(() => {
    fetchTimeEntries({
      page,
      pageSize,
      employeeId: filters.employeeId || undefined,
      status: filters.status || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      sortBy: sortBy as string,
      sortOrder,
    });
  }, [page, pageSize, filters, sortBy, sortOrder, fetchTimeEntries]);

  // Memoized employee lookup map for performance
  const employeeMap = useMemo(() => {
    return new Map(employees.map((e) => [e.id, e]));
  }, [employees]);

  // Memoized column definitions
  const columns = useMemo(
    () => [
      {
        key: 'entryDate' as keyof TimeEntry,
        label: t('date') || 'Date',
        sortable: true,
        render: (value: string) => <span>{formatDate(value)}</span>,
      },
      {
        key: 'employeeId' as keyof TimeEntry,
        label: t('employee') || 'Employee',
        sortable: false,
        render: (_: unknown, row: TimeEntry) => {
          const employee = employeeMap.get(row.employeeId);
          return <span>{getEmployeeDisplayName(employee)}</span>;
        },
      },
      {
        key: 'checkInTime' as keyof TimeEntry,
        label: t('checkInTime') || 'Check In',
        sortable: false,
        render: (value: string | null) => (
          <span className={!value ? 'text-text-muted' : ''}>{value || '-'}</span>
        ),
      },
      {
        key: 'checkOutTime' as keyof TimeEntry,
        label: t('checkOutTime') || 'Check Out',
        sortable: false,
        render: (value: string | null) => (
          <span className={!value ? 'text-text-muted' : ''}>{value || '-'}</span>
        ),
      },
      {
        key: 'workedHours' as keyof TimeEntry,
        label: t('workedHours') || 'Worked Hours',
        sortable: true,
        render: (value: string | null) => <span>{formatHours(value)}</span>,
      },
      {
        key: 'overtimeHours' as keyof TimeEntry,
        label: t('overtimeHours') || 'Overtime',
        sortable: true,
        render: (value: string) => {
          const hours = parseFloat(value);
          if (hours === 0) return <span className="text-text-muted">-</span>;
          return <span className="text-orange-600">{formatHours(hours)}</span>;
        },
      },
      {
        key: 'status' as keyof TimeEntry,
        label: t('status') || 'Status',
        sortable: true,
        render: (value: string) => (
          <span className={getStatusBadgeClasses(value, TIME_ENTRY_STATUS_COLORS)}>
            {t(value) || value.replace('_', ' ')}
          </span>
        ),
      },
      {
        key: 'actions' as keyof TimeEntry,
        label: t('actions') || 'Actions',
        sortable: false,
        render: (_: unknown, row: TimeEntry) => (
          <div className="flex items-center gap-2">
            {onEdit && !row.approvedBy && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
                {t('edit')}
              </Button>
            )}
            {onApprove && !row.approvedBy && (
              <Button variant="ghost" size="sm" onClick={() => onApprove(row)}>
                {t('approve')}
              </Button>
            )}
            {onDelete && !row.approvedBy && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(row)}>
                {t('delete')}
              </Button>
            )}
            {row.approvedBy && (
              <span className="text-xs text-text-muted">{t('approved') || 'Approved'}</span>
            )}
          </div>
        ),
      },
    ],
    [t, employeeMap, onEdit, onApprove, onDelete]
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
      { value: 'present', label: t('present') || 'Present' },
      { value: 'absent', label: t('absent') || 'Absent' },
      { value: 'late', label: t('late') || 'Late' },
      { value: 'half_day', label: t('halfDay') || 'Half Day' },
      { value: 'holiday', label: t('holiday') || 'Holiday' },
      { value: 'sick_leave', label: t('sickLeave') || 'Sick Leave' },
      { value: 'vacation', label: t('vacation') || 'Vacation' },
    ],
    [t]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('timeEntries') || 'Time Entries'}</h2>
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
              label={t('dateFrom') || 'Date From'}
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilter('dateFrom', e.target.value)}
            />
            <Input
              label={t('dateTo') || 'Date To'}
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilter('dateTo', e.target.value)}
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
              data={timeEntries}
              columns={columns}
              sortConfig={sortConfig}
              onSort={(key) => handleSort(key as keyof TimeEntry)}
              emptyMessage={t('noTimeEntries') || 'No time entries found'}
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  {t('showing') || 'Showing'} {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('of') || 'of'}{' '}
                  {pagination.total} {t('timeEntries') || 'time entries'}
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

