'use client';

import { useState, useEffect, useMemo } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';
import { LeaveRequest, useLeaveRequests } from '@/hooks/useLeaveRequests';
import { useEmployees } from '@/hooks/useEmployees';
import { useLeaveTypes } from '@/hooks/useLeaveTypes';
import { useTableFilters } from '@/hooks/useTableFilters';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useTableSort } from '@/hooks/useTableSort';
import {
  LEAVE_REQUEST_STATUS_COLORS,
  formatDate,
  getStatusBadgeClasses,
  getEmployeeDisplayName,
} from '@/lib/utils/hr';

interface LeaveRequestsTableProps {
  onEdit?: (request: LeaveRequest) => void;
  onDelete?: (request: LeaveRequest) => void;
  onView?: (request: LeaveRequest) => void;
  onApprove?: (request: LeaveRequest) => void;
  onReject?: (request: LeaveRequest) => void;
}

interface LeaveRequestFilters extends Record<string, string> {
  employeeId: string;
  leaveTypeId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export function LeaveRequestsTable({ onEdit, onDelete, onView, onApprove, onReject }: LeaveRequestsTableProps) {
  const t = useTranslations('common');
  const { leaveRequests, loading, error, pagination, fetchLeaveRequests } = useLeaveRequests();
  const { employees, fetchEmployees } = useEmployees();
  const { leaveTypes, fetchLeaveTypes } = useLeaveTypes();

  const { filters, setFilter, clearFilters, hasActiveFilters } = useTableFilters<LeaveRequestFilters>({
    initialFilters: {
      employeeId: '',
      leaveTypeId: '',
      status: '',
      dateFrom: '',
      dateTo: '',
    },
  });

  const { page, pageSize, setPage, setPageSize, pageSizeOptions } = useTablePagination({
    initialPage: 1,
    initialPageSize: 10,
  });

  const { sortBy, sortOrder, sortConfig, handleSort } = useTableSort<LeaveRequest>({
    initialSortBy: 'startDate',
    initialSortOrder: 'desc',
  });

  // Load employees and leave types when component mounts
  useEffect(() => {
    fetchEmployees({ pageSize: 1000 });
    fetchLeaveTypes({ pageSize: 1000 });
  }, [fetchEmployees, fetchLeaveTypes]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, setPage]);

  // Fetch leave requests when filters change
  useEffect(() => {
    fetchLeaveRequests({
      page,
      pageSize,
      employeeId: filters.employeeId || undefined,
      leaveTypeId: filters.leaveTypeId || undefined,
      status: filters.status || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      sortBy: sortBy as string,
      sortOrder,
    });
  }, [page, pageSize, filters, sortBy, sortOrder, fetchLeaveRequests]);

  // Memoized lookup maps for performance
  const employeeMap = useMemo(() => {
    return new Map(employees.map((e) => [e.id, e]));
  }, [employees]);

  const leaveTypeMap = useMemo(() => {
    return new Map(leaveTypes.map((lt) => [lt.id, lt]));
  }, [leaveTypes]);

  // Memoized column definitions
  const columns = useMemo(
    () => [
      {
        key: 'startDate' as keyof LeaveRequest,
        label: t('startDate') || 'Start Date',
        sortable: true,
        render: (value: string, row: LeaveRequest) => (
          <div>
            <div>{formatDate(value)}</div>
            <div className="text-xs text-text-muted">
              {t('to') || 'to'} {formatDate(row.endDate)}
            </div>
          </div>
        ),
      },
      {
        key: 'employeeId' as keyof LeaveRequest,
        label: t('employee') || 'Employee',
        sortable: false,
        render: (_: unknown, row: LeaveRequest) => {
          const employee = employeeMap.get(row.employeeId);
          return <span>{getEmployeeDisplayName(employee)}</span>;
        },
      },
      {
        key: 'leaveTypeId' as keyof LeaveRequest,
        label: t('leaveType') || 'Leave Type',
        sortable: false,
        render: (_: unknown, row: LeaveRequest) => {
          const leaveType = leaveTypeMap.get(row.leaveTypeId);
          return <span>{leaveType?.name || '-'}</span>;
        },
      },
      {
        key: 'totalDays' as keyof LeaveRequest,
        label: t('totalDays') || 'Days',
        sortable: true,
        render: (value: number) => <span className="font-medium">{value} {t('days') || 'days'}</span>,
      },
      {
        key: 'status' as keyof LeaveRequest,
        label: t('status') || 'Status',
        sortable: true,
        render: (value: string) => (
          <span className={getStatusBadgeClasses(value, LEAVE_REQUEST_STATUS_COLORS)}>
            {t(value) || value}
          </span>
        ),
      },
      {
        key: 'reason' as keyof LeaveRequest,
        label: t('reason') || 'Reason',
        sortable: false,
        render: (value: string | null) => {
          if (!value) return <span className="text-text-muted">-</span>;
          return <span className="text-sm truncate max-w-xs">{value}</span>;
        },
      },
      {
        key: 'actions' as keyof LeaveRequest,
        label: t('actions') || 'Actions',
        sortable: false,
        render: (_: unknown, row: LeaveRequest) => (
          <div className="flex items-center gap-2">
            {onView && (
              <Button variant="ghost" size="sm" onClick={() => onView(row)}>
                {t('view')}
              </Button>
            )}
            {onEdit && row.status === 'pending' && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
                {t('edit')}
              </Button>
            )}
            {onApprove && row.status === 'pending' && (
              <Button variant="ghost" size="sm" onClick={() => onApprove(row)}>
                {t('approve')}
              </Button>
            )}
            {onReject && row.status === 'pending' && (
              <Button variant="ghost" size="sm" onClick={() => onReject(row)}>
                {t('reject')}
              </Button>
            )}
            {onDelete && (row.status === 'pending' || row.status === 'cancelled') && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(row)}>
                {t('delete')}
              </Button>
            )}
          </div>
        ),
      },
    ],
    [t, employeeMap, leaveTypeMap, onView, onEdit, onApprove, onReject, onDelete]
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

  const leaveTypeOptions = useMemo(
    () =>
      leaveTypes
        .filter((lt) => lt.isActive)
        .map((lt) => ({ value: lt.id, label: lt.name })),
    [leaveTypes]
  );

  const statusOptions = useMemo(
    () => [
      { value: 'pending', label: t('pending') || 'Pending' },
      { value: 'approved', label: t('approved') || 'Approved' },
      { value: 'rejected', label: t('rejected') || 'Rejected' },
      { value: 'cancelled', label: t('cancelled') || 'Cancelled' },
    ],
    [t]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('leaveRequests') || 'Leave Requests'}</h2>
        </div>
      </CardHeader>
      <CardBody>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select
              label={t('employee')}
              value={filters.employeeId}
              onChange={(e) => setFilter('employeeId', e.target.value)}
              options={employeeOptions}
              placeholder={t('allEmployees') || 'All employees'}
            />
            <Select
              label={t('leaveType')}
              value={filters.leaveTypeId}
              onChange={(e) => setFilter('leaveTypeId', e.target.value)}
              options={leaveTypeOptions}
              placeholder={t('allLeaveTypes') || 'All leave types'}
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
              data={leaveRequests}
              columns={columns}
              sortConfig={sortConfig}
              onSort={(key) => handleSort(key as keyof LeaveRequest)}
              emptyMessage={t('noLeaveRequests') || 'No leave requests found'}
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  {t('showing') || 'Showing'} {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('of') || 'of'}{' '}
                  {pagination.total} {t('leaveRequests') || 'leave requests'}
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

