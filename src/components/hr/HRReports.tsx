'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { useTranslations } from 'next-intl';
import { useHRReports, LeaveBalanceReportData } from '@/hooks/useHRReports';
import { useParishes } from '@/hooks/useParishes';
import { useEmployees } from '@/hooks/useEmployees';
import { formatCurrency, formatDate } from '@/lib/utils/hr';

interface HRReportsProps {
  parishId?: string;
}

export function HRReports({ parishId: initialParishId }: HRReportsProps) {
  const t = useTranslations('common');
  const {
    employeeReport,
    salaryReport,
    attendanceReport,
    leaveBalanceReport,
    loading,
    error,
    fetchEmployeeReport,
    fetchSalaryReport,
    fetchAttendanceReport,
    fetchLeaveBalanceReport,
    exportReport,
  } = useHRReports();

  const { parishes, fetchParishes } = useParishes();
  const { employees, fetchEmployees } = useEmployees();

  const [activeReport, setActiveReport] = useState<'employees' | 'salaries' | 'attendance' | 'leave-balance' | null>(null);
  const [parishId, setParishId] = useState(initialParishId || '');
  const [filters, setFilters] = useState({
    employmentStatus: '',
    periodFrom: '',
    periodTo: '',
    salaryStatus: '',
    dateFrom: '',
    dateTo: '',
    employeeId: '',
    year: new Date().getFullYear().toString(),
  });

  // Load parishes and employees on mount
  useEffect(() => {
    fetchParishes({ pageSize: 1000 });
    fetchEmployees({ pageSize: 1000 });
  }, [fetchParishes, fetchEmployees]);

  const parishOptions = useMemo(
    () => [
      { value: '', label: t('allParishes') || 'All Parishes' },
      ...parishes.map((p) => ({ value: p.id, label: p.name })),
    ],
    [parishes, t]
  );

  const employeeOptions = useMemo(
    () => [
      { value: '', label: t('allEmployees') || 'All Employees' },
      ...employees
        .filter((e) => e.isActive)
        .map((e) => ({
          value: e.id,
          label: `${e.firstName} ${e.lastName}`.trim() || e.employeeNumber,
        })),
    ],
    [employees, t]
  );

  const employmentStatusOptions = useMemo(
    () => [
      { value: '', label: t('allStatuses') || 'All Statuses' },
      { value: 'active', label: t('active') || 'Active' },
      { value: 'on_leave', label: t('onLeave') || 'On Leave' },
      { value: 'terminated', label: t('terminated') || 'Terminated' },
      { value: 'retired', label: t('retired') || 'Retired' },
    ],
    [t]
  );

  const salaryStatusOptions = useMemo(
    () => [
      { value: '', label: t('allStatuses') || 'All Statuses' },
      { value: 'draft', label: t('draft') || 'Draft' },
      { value: 'calculated', label: t('calculated') || 'Calculated' },
      { value: 'approved', label: t('approved') || 'Approved' },
      { value: 'paid', label: t('paid') || 'Paid' },
      { value: 'cancelled', label: t('cancelled') || 'Cancelled' },
    ],
    [t]
  );

  const handleFetchReport = async (reportType: 'employees' | 'salaries' | 'attendance' | 'leave-balance') => {
    setActiveReport(reportType);
    const params: Record<string, string> = {};

    if (parishId) {
      params.parishId = parishId;
    }

    switch (reportType) {
      case 'employees':
        if (filters.employmentStatus) params.employmentStatus = filters.employmentStatus;
        await fetchEmployeeReport(params);
        break;
      case 'salaries':
        if (filters.periodFrom) params.periodFrom = filters.periodFrom;
        if (filters.periodTo) params.periodTo = filters.periodTo;
        if (filters.salaryStatus) params.status = filters.salaryStatus;
        await fetchSalaryReport(params);
        break;
      case 'attendance':
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;
        await fetchAttendanceReport(params);
        break;
      case 'leave-balance':
        if (filters.employeeId) params.employeeId = filters.employeeId;
        params.year = filters.year;
        await fetchLeaveBalanceReport(params);
        break;
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!activeReport) return;

    const params: Record<string, string> = {};
    if (parishId) params.parishId = parishId;

    switch (activeReport) {
      case 'employees':
        if (filters.employmentStatus) params.employmentStatus = filters.employmentStatus;
        break;
      case 'salaries':
        if (filters.periodFrom) params.periodFrom = filters.periodFrom;
        if (filters.periodTo) params.periodTo = filters.periodTo;
        if (filters.salaryStatus) params.status = filters.salaryStatus;
        break;
      case 'attendance':
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;
        break;
      case 'leave-balance':
        if (filters.employeeId) params.employeeId = filters.employeeId;
        params.year = filters.year;
        break;
    }

    try {
      await exportReport(activeReport, format, params);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const employeeReportColumns = useMemo(
    () => [
      {
        key: 'status' as const,
        label: t('status') || 'Status',
        render: (value: string) => (
          <span className="px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">{value}</span>
        ),
      },
      {
        key: 'count' as const,
        label: t('count') || 'Count',
        render: (value: number) => <span className="font-semibold">{value}</span>,
      },
    ],
    [t]
  );

  const leaveBalanceColumns = useMemo(
    () => [
      {
        key: 'leaveTypeName' as keyof LeaveBalanceReportData,
        label: t('leaveType') || 'Leave Type',
      },
      {
        key: 'maxDaysPerYear' as keyof LeaveBalanceReportData,
        label: t('maxDaysPerYear') || 'Max Days/Year',
        render: (value: number | null) => value ?? 'N/A',
      },
      {
        key: 'usedDays' as keyof LeaveBalanceReportData,
        label: t('usedDays') || 'Used Days',
      },
      {
        key: 'pendingDays' as keyof LeaveBalanceReportData,
        label: t('pendingDays') || 'Pending Days',
      },
      {
        key: 'remainingDays' as keyof LeaveBalanceReportData,
        label: t('remainingDays') || 'Remaining Days',
        render: (value: number | null) => (
          <span className={value !== null && value < 0 ? 'text-danger' : ''}>
            {value !== null ? value : 'N/A'}
          </span>
        ),
      },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      {/* Report Selection */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">{t('selectReport') || 'Select Report'}</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant={activeReport === 'employees' ? 'primary' : 'outline'}
              onClick={() => handleFetchReport('employees')}
              disabled={loading}
            >
              {t('employees')} {t('report') || 'Report'}
            </Button>
            <Button
              variant={activeReport === 'salaries' ? 'primary' : 'outline'}
              onClick={() => handleFetchReport('salaries')}
              disabled={loading}
            >
              {t('salaries')} {t('report') || 'Report'}
            </Button>
            <Button
              variant={activeReport === 'attendance' ? 'primary' : 'outline'}
              onClick={() => handleFetchReport('attendance')}
              disabled={loading}
            >
              {t('attendance') || 'Attendance'} {t('report') || 'Report'}
            </Button>
            <Button
              variant={activeReport === 'leave-balance' ? 'primary' : 'outline'}
              onClick={() => handleFetchReport('leave-balance')}
              disabled={loading}
            >
              {t('leaveBalance') || 'Leave Balance'} {t('report') || 'Report'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Filters */}
      {activeReport && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">{t('filters') || 'Filters'}</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label={t('parish')}
                value={parishId}
                onChange={(e) => setParishId(e.target.value)}
                options={parishOptions}
                placeholder={t('allParishes') || 'All Parishes'}
              />

              {activeReport === 'employees' && (
                <Select
                  label={t('employmentStatus')}
                  value={filters.employmentStatus}
                  onChange={(e) => setFilters({ ...filters, employmentStatus: e.target.value })}
                  options={employmentStatusOptions}
                  placeholder={t('allStatuses') || 'All Statuses'}
                />
              )}

              {activeReport === 'salaries' && (
                <>
                  <Input
                    label={t('periodFrom') || 'Period From'}
                    type="date"
                    value={filters.periodFrom}
                    onChange={(e) => setFilters({ ...filters, periodFrom: e.target.value })}
                  />
                  <Input
                    label={t('periodTo') || 'Period To'}
                    type="date"
                    value={filters.periodTo}
                    onChange={(e) => setFilters({ ...filters, periodTo: e.target.value })}
                  />
                  <Select
                    label={t('status')}
                    value={filters.salaryStatus}
                    onChange={(e) => setFilters({ ...filters, salaryStatus: e.target.value })}
                    options={salaryStatusOptions}
                    placeholder={t('allStatuses') || 'All Statuses'}
                  />
                </>
              )}

              {activeReport === 'attendance' && (
                <>
                  <Input
                    label={t('dateFrom') || 'Date From'}
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                  <Input
                    label={t('dateTo') || 'Date To'}
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </>
              )}

              {activeReport === 'leave-balance' && (
                <>
                  <Select
                    label={t('employee')}
                    value={filters.employeeId}
                    onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                    options={employeeOptions}
                    placeholder={t('allEmployees') || 'All Employees'}
                  />
                  <Input
                    label={t('year')}
                    type="number"
                    value={filters.year}
                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  />
                </>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={() => handleFetchReport(activeReport)} disabled={loading}>
                {t('generateReport') || 'Generate Report'}
              </Button>
              {activeReport && (
                <>
                  <Button variant="success" onClick={() => handleExport('excel')} disabled={loading}>
                    {t('exportExcel') || 'Export Excel'}
                  </Button>
                  <Button variant="info" onClick={() => handleExport('pdf')} disabled={loading}>
                    {t('exportPDF') || 'Export PDF'}
                  </Button>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card>
          <CardBody>
            <div className="text-danger">{error}</div>
          </CardBody>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardBody>
            <div className="text-center py-8">{t('loading') || 'Loading...'}</div>
          </CardBody>
        </Card>
      )}

      {/* Employee Report */}
      {activeReport === 'employees' && employeeReport && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">{t('employees')} {t('report') || 'Report'}</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('totalEmployees') || 'Total Employees'}</div>
                <div className="text-2xl font-bold">{employeeReport.total}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('activeContracts') || 'Active Contracts'}</div>
                <div className="text-2xl font-bold">{employeeReport.activeContracts}</div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">{t('statusBreakdown') || 'Status Breakdown'}</h3>
              <Table
                data={Object.entries(employeeReport.statusCounts).map(([status, count]) => ({
                  status,
                  count,
                }))}
                columns={employeeReportColumns}
              />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Salary Report */}
      {activeReport === 'salaries' && salaryReport && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">{t('salaries')} {t('report') || 'Report'}</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('totalGross') || 'Total Gross'}</div>
                <div className="text-2xl font-bold">{formatCurrency(salaryReport.totalGross)}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('totalNet') || 'Total Net'}</div>
                <div className="text-2xl font-bold">{formatCurrency(salaryReport.totalNet)}</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('totalBenefits') || 'Total Benefits'}</div>
                <div className="text-2xl font-bold">{formatCurrency(salaryReport.totalBenefits)}</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('totalDeductions') || 'Total Deductions'}</div>
                <div className="text-2xl font-bold">{formatCurrency(salaryReport.totalDeductions)}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('count') || 'Count'}</div>
                <div className="text-2xl font-bold">{salaryReport.count}</div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Attendance Report */}
      {activeReport === 'attendance' && attendanceReport && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">{t('attendance') || 'Attendance'} {t('report') || 'Report'}</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('totalWorkedHours') || 'Total Worked Hours'}</div>
                <div className="text-2xl font-bold">{attendanceReport.totalWorkedHours.toFixed(2)}</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('totalOvertimeHours') || 'Total Overtime Hours'}</div>
                <div className="text-2xl font-bold">{attendanceReport.totalOvertimeHours.toFixed(2)}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('presentDays') || 'Present Days'}</div>
                <div className="text-2xl font-bold">{attendanceReport.presentDays}</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('absentDays') || 'Absent Days'}</div>
                <div className="text-2xl font-bold">{attendanceReport.absentDays}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">{t('totalDays') || 'Total Days'}</div>
                <div className="text-2xl font-bold">{attendanceReport.totalDays}</div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Leave Balance Report */}
      {activeReport === 'leave-balance' && leaveBalanceReport && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">{t('leaveBalance') || 'Leave Balance'} {t('report') || 'Report'}</h2>
          </CardHeader>
          <CardBody>
            <Table
              data={leaveBalanceReport}
              columns={leaveBalanceColumns}
              emptyMessage={t('noDataAvailable') || 'No data available'}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}






