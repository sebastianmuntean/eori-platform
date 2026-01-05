'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';
import { EmploymentContract, useEmploymentContracts } from '@/hooks/useEmploymentContracts';
import { useEmployees } from '@/hooks/useEmployees';
import {
  CONTRACT_STATUS_COLORS,
  formatDate,
  formatCurrency,
  formatContractType,
  getStatusBadgeClasses,
  getEmployeeDisplayName,
} from '@/lib/utils/hr';

interface ContractsTableProps {
  onEdit?: (contract: EmploymentContract) => void;
  onDelete?: (contract: EmploymentContract) => void;
  onView?: (contract: EmploymentContract) => void;
  onRenew?: (contract: EmploymentContract) => void;
  onTerminate?: (contract: EmploymentContract) => void;
}

interface FilterState {
  search: string;
  employeeId: string;
  status: string;
}

const DEBOUNCE_DELAY = 300;
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
];

export function ContractsTable({ onEdit, onDelete, onView, onRenew, onTerminate }: ContractsTableProps) {
  const t = useTranslations('common');
  const { contracts, loading, error, pagination, fetchContracts } = useEmploymentContracts();
  const { employees, fetchEmployees } = useEmployees();

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    employeeId: '',
    status: '',
  });
  const [sortBy, setSortBy] = useState('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Load employees when component mounts (fetch all for dropdown)
  useEffect(() => {
    fetchEmployees({ pageSize: 1000 }); // Fetch a large batch for dropdown
  }, [fetchEmployees]);

  // Fetch contracts when filters change (with debounce for search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchContracts({
        page,
        pageSize,
        search: filters.search || undefined,
        employeeId: filters.employeeId || undefined,
        status: filters.status || undefined,
        sortBy,
        sortOrder,
      });
    }, filters.search ? DEBOUNCE_DELAY : 0);

    return () => clearTimeout(timeoutId);
  }, [page, pageSize, filters, sortBy, sortOrder, fetchContracts]);

  // Memoized handlers
  const handleSort = useCallback((key: string) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(1);
  }, [sortBy]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', employeeId: '', status: '' });
    setPage(1);
  }, []);

  // Memoized employee lookup map for performance
  const employeeMap = useMemo(() => {
    return new Map(employees.map((e) => [e.id, e]));
  }, [employees]);

  // Memoized column definitions
  const columns = useMemo(
    () => [
      {
        key: 'contractNumber' as keyof EmploymentContract,
        label: t('contractNumber') || 'Contract Number',
        sortable: true,
        render: (value: string) => (
          <span className="font-mono text-sm">{value}</span>
        ),
      },
      {
        key: 'employeeId' as keyof EmploymentContract,
        label: t('employee') || 'Employee',
        sortable: false,
        render: (_: unknown, row: EmploymentContract) => {
          const employee = employeeMap.get(row.employeeId);
          return <span>{getEmployeeDisplayName(employee)}</span>;
        },
      },
      {
        key: 'contractType' as keyof EmploymentContract,
        label: t('contractType') || 'Type',
        sortable: true,
        render: (value: string) => (
          <span className="capitalize">{formatContractType(value)}</span>
        ),
      },
      {
        key: 'startDate' as keyof EmploymentContract,
        label: t('startDate') || 'Start Date',
        sortable: true,
        render: (value: string) => <span>{formatDate(value)}</span>,
      },
      {
        key: 'endDate' as keyof EmploymentContract,
        label: t('endDate') || 'End Date',
        sortable: true,
        render: (value: string | null) => (
          <span className={!value ? 'text-text-muted' : ''}>
            {formatDate(value)}
          </span>
        ),
      },
      {
        key: 'baseSalary' as keyof EmploymentContract,
        label: t('baseSalary') || 'Base Salary',
        sortable: true,
        render: (value: string, row: EmploymentContract) => (
          <span>{formatCurrency(value, row.currency)}</span>
        ),
      },
      {
        key: 'status' as keyof EmploymentContract,
        label: t('status') || 'Status',
        sortable: true,
        render: (value: string) => (
          <span className={getStatusBadgeClasses(value, CONTRACT_STATUS_COLORS)}>
            {t(value) || value}
          </span>
        ),
      },
      {
        key: 'actions' as keyof EmploymentContract,
        label: t('actions') || 'Actions',
        sortable: false,
        render: (_: unknown, row: EmploymentContract) => (
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
            {onRenew && row.status === 'active' && (
              <Button variant="ghost" size="sm" onClick={() => onRenew(row)}>
                {t('renew')}
              </Button>
            )}
            {onTerminate && (row.status === 'active' || row.status === 'draft') && (
              <Button variant="ghost" size="sm" onClick={() => onTerminate(row)}>
                {t('terminate')}
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
    [t, employeeMap, onView, onEdit, onRenew, onTerminate, onDelete]
  );

  // Memoized sort configuration
  const sortConfig = useMemo(
    () => ({
      key: sortBy as keyof EmploymentContract,
      direction: sortOrder as 'asc' | 'desc',
    }),
    [sortBy, sortOrder]
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
      { value: 'active', label: t('active') || 'Active' },
      { value: 'expired', label: t('expired') || 'Expired' },
      { value: 'terminated', label: t('terminated') || 'Terminated' },
      { value: 'suspended', label: t('suspended') || 'Suspended' },
    ],
    [t]
  );

  // Check if any filters are active
  const hasActiveFilters = useMemo(
    () => Boolean(filters.search || filters.employeeId || filters.status),
    [filters]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('employmentContracts') || 'Employment Contracts'}</h2>
        </div>
      </CardHeader>
      <CardBody>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SearchInput
              value={filters.search}
              onChange={(value) => handleFilterChange('search', value)}
              placeholder={t('searchContracts') || 'Search contracts...'}
            />
            <Select
              label={t('employee')}
              value={filters.employeeId}
              onChange={(e) => handleFilterChange('employeeId', e.target.value)}
              options={employeeOptions}
              placeholder={t('allEmployees') || 'All employees'}
            />
            <Select
              label={t('status')}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
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
              data={contracts}
              columns={columns}
              sortConfig={sortConfig}
              onSort={(key) => handleSort(key as string)}
              emptyMessage={t('noContracts') || 'No contracts found'}
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  {t('showing') || 'Showing'} {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('of') || 'of'}{' '}
                  {pagination.total} {t('contracts') || 'contracts'}
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
                    options={PAGE_SIZE_OPTIONS}
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

