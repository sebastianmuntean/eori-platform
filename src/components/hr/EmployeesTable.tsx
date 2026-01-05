'use client';

import { useState, useEffect } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';
import { Employee, useEmployees } from '@/hooks/useEmployees';
import { useParishes } from '@/hooks/useParishes';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';

interface EmployeesTableProps {
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  onView?: (employee: Employee) => void;
}

export function EmployeesTable({ onEdit, onDelete, onView }: EmployeesTableProps) {
  const t = useTranslations('common');
  const { employees, loading, error, pagination, fetchEmployees } = useEmployees();
  const { parishes, fetchParishes } = useParishes();
  const { departments, fetchDepartments } = useDepartments();
  const { positions, fetchPositions } = usePositions();

  const [search, setSearch] = useState('');
  const [parishId, setParishId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState('lastName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load initial data
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

  // Load positions when parish or department changes
  useEffect(() => {
    if (parishId) {
      fetchPositions({ parishId, departmentId: departmentId || undefined, pageSize: 1000 });
    } else {
      fetchPositions({ pageSize: 1000 });
    }
  }, [parishId, departmentId, fetchPositions]);

  // Fetch employees when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEmployees({
        page,
        pageSize,
        search: search || undefined,
        parishId: parishId || undefined,
        departmentId: departmentId || undefined,
        positionId: positionId || undefined,
        employmentStatus: employmentStatus || undefined,
        isActive: isActive !== null ? isActive : undefined,
        sortBy,
        sortOrder,
      });
    }, search ? 300 : 0); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [
    page,
    pageSize,
    search,
    parishId,
    departmentId,
    positionId,
    employmentStatus,
    isActive,
    sortBy,
    sortOrder,
    fetchEmployees,
  ]);

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
    setPositionId('');
    setEmploymentStatus('');
    setIsActive(null);
    setPage(1);
  };

  const columns = [
    {
      key: 'employeeNumber' as keyof Employee,
      label: t('employeeNumber') || 'Employee Number',
      sortable: true,
      render: (value: string) => <span className="font-mono text-sm">{value}</span>,
    },
    {
      key: 'firstName' as keyof Employee,
      label: t('name') || 'Name',
      sortable: true,
      render: (_: any, row: Employee) => (
        <div>
          <div className="font-medium">{`${row.firstName} ${row.lastName}`}</div>
          {row.email && (
            <div className="text-sm text-text-muted">{row.email}</div>
          )}
        </div>
      ),
    },
    {
      key: 'parishId' as keyof Employee,
      label: t('parish') || 'Parish',
      sortable: false,
      render: (_: any, row: Employee) => {
        const parish = parishes.find((p) => p.id === row.parishId);
        return <span>{parish?.name || '-'}</span>;
      },
    },
    {
      key: 'departmentId' as keyof Employee,
      label: t('department') || 'Department',
      sortable: false,
      render: (_: any, row: Employee) => {
        if (!row.departmentId) return <span className="text-text-muted">-</span>;
        const department = departments.find((d) => d.id === row.departmentId);
        return <span>{department?.name || '-'}</span>;
      },
    },
    {
      key: 'positionId' as keyof Employee,
      label: t('position') || 'Position',
      sortable: false,
      render: (_: any, row: Employee) => {
        if (!row.positionId) return <span className="text-text-muted">-</span>;
        const position = positions.find((p) => p.id === row.positionId);
        return <span>{position?.title || '-'}</span>;
      },
    },
    {
      key: 'employmentStatus' as keyof Employee,
      label: t('status') || 'Status',
      sortable: true,
      render: (value: string) => {
        const statusColors: Record<string, string> = {
          active: 'bg-green-100 text-green-800',
          on_leave: 'bg-yellow-100 text-yellow-800',
          terminated: 'bg-red-100 text-red-800',
          retired: 'bg-gray-100 text-gray-800',
        };
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              statusColors[value] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {t(value) || value}
          </span>
        );
      },
    },
    {
      key: 'hireDate' as keyof Employee,
      label: t('hireDate') || 'Hire Date',
      sortable: true,
      render: (value: string) => {
        if (!value) return <span className="text-text-muted">-</span>;
        return <span>{new Date(value).toLocaleDateString()}</span>;
      },
    },
    {
      key: 'actions' as keyof Employee,
      label: t('actions') || 'Actions',
      sortable: false,
      render: (_: any, row: Employee) => (
        <div className="flex items-center gap-2">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(row)}
            >
              {t('view')}
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(row)}
            >
              {t('edit')}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(row)}
            >
              {t('delete')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const sortConfig = {
    key: sortBy as keyof Employee,
    direction: sortOrder as 'asc' | 'desc',
  };

  const parishOptions = parishes
    .filter((p) => p.isActive)
    .map((p) => ({ value: p.id, label: p.name }));

  const departmentOptions = departments
    .filter((d) => !parishId || d.parishId === parishId)
    .filter((d) => d.isActive)
    .map((d) => ({ value: d.id, label: d.name }));

  const positionOptions = positions
    .filter((p) => !parishId || p.parishId === parishId)
    .filter((p) => !departmentId || p.departmentId === departmentId)
    .filter((p) => p.isActive)
    .map((p) => ({ value: p.id, label: p.title }));

  const employmentStatusOptions = [
    { value: 'active', label: t('active') || 'Active' },
    { value: 'on_leave', label: t('onLeave') || 'On Leave' },
    { value: 'terminated', label: t('terminated') || 'Terminated' },
    { value: 'retired', label: t('retired') || 'Retired' },
  ];

  const activeStatusOptions = [
    { value: 'true', label: t('active') || 'Active' },
    { value: 'false', label: t('inactive') || 'Inactive' },
    { value: '', label: t('all') || 'All' },
  ];

  const hasActiveFilters =
    search ||
    parishId ||
    departmentId ||
    positionId ||
    employmentStatus ||
    isActive !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('employees') || 'Employees'}</h2>
        </div>
      </CardHeader>
      <CardBody>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('searchEmployees') || 'Search employees...'}
            />
            <Select
              label={t('parish')}
              value={parishId}
              onChange={(e) => {
                setParishId(e.target.value);
                setDepartmentId('');
                setPositionId('');
              }}
              options={parishOptions}
              placeholder={t('allParishes') || 'All parishes'}
            />
            <Select
              label={t('department')}
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setPositionId('');
              }}
              options={departmentOptions}
              placeholder={t('allDepartments') || 'All departments'}
              disabled={!parishId}
            />
            <Select
              label={t('position')}
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              options={positionOptions}
              placeholder={t('allPositions') || 'All positions'}
              disabled={!parishId}
            />
            <Select
              label={t('employmentStatus')}
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value)}
              options={employmentStatusOptions}
              placeholder={t('allStatuses') || 'All statuses'}
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
              data={employees}
              columns={columns}
              sortConfig={sortConfig}
              onSort={(key) => handleSort(key as string)}
              emptyMessage={t('noEmployees') || 'No employees found'}
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  {t('showing') || 'Showing'} {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('of') || 'of'}{' '}
                  {pagination.total} {t('employees') || 'employees'}
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


