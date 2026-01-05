'use client';

import { useState, useCallback } from 'react';

export interface EmployeeReportData {
  total: number;
  activeContracts: number;
  statusCounts: Record<string, number>;
}

export interface SalaryReportData {
  totalGross: number;
  totalNet: number;
  totalBenefits: number;
  totalDeductions: number;
  count: number;
}

export interface AttendanceReportData {
  totalWorkedHours: number;
  totalOvertimeHours: number;
  presentDays: number;
  absentDays: number;
  totalDays: number;
}

export interface LeaveBalanceReportData {
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  maxDaysPerYear: number | null;
  usedDays: number;
  pendingDays: number;
  remainingDays: number | null;
}

interface UseHRReportsReturn {
  employeeReport: EmployeeReportData | null;
  salaryReport: SalaryReportData | null;
  attendanceReport: AttendanceReportData | null;
  leaveBalanceReport: LeaveBalanceReportData[] | null;
  loading: boolean;
  error: string | null;
  fetchEmployeeReport: (params?: { parishId?: string; employmentStatus?: string }) => Promise<void>;
  fetchSalaryReport: (params?: { parishId?: string; periodFrom?: string; periodTo?: string; status?: string }) => Promise<void>;
  fetchAttendanceReport: (params?: { parishId?: string; dateFrom?: string; dateTo?: string }) => Promise<void>;
  fetchLeaveBalanceReport: (params?: { employeeId?: string; parishId?: string; year?: string }) => Promise<void>;
  exportReport: (reportType: string, format: 'excel' | 'pdf', params?: Record<string, string>) => Promise<void>;
}

export function useHRReports(): UseHRReportsReturn {
  const [employeeReport, setEmployeeReport] = useState<EmployeeReportData | null>(null);
  const [salaryReport, setSalaryReport] = useState<SalaryReportData | null>(null);
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReportData | null>(null);
  const [leaveBalanceReport, setLeaveBalanceReport] = useState<LeaveBalanceReportData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployeeReport = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.employmentStatus) queryParams.append('employmentStatus', params.employmentStatus);

      const response = await fetch(`/api/hr/reports/employees?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch employee report');
      }

      setEmployeeReport(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employee report';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSalaryReport = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.periodFrom) queryParams.append('periodFrom', params.periodFrom);
      if (params.periodTo) queryParams.append('periodTo', params.periodTo);
      if (params.status) queryParams.append('status', params.status);

      const response = await fetch(`/api/hr/reports/salaries?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch salary report');
      }

      setSalaryReport(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch salary report';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAttendanceReport = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);

      const response = await fetch(`/api/hr/reports/attendance?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch attendance report');
      }

      setAttendanceReport(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch attendance report';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaveBalanceReport = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.employeeId) queryParams.append('employeeId', params.employeeId);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.year) queryParams.append('year', params.year);

      const response = await fetch(`/api/hr/reports/leave-balance?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch leave balance report');
      }

      setLeaveBalanceReport(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leave balance report';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportReport = useCallback(async (reportType: string, format: 'excel' | 'pdf', params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      queryParams.append('format', format);

      const response = await fetch(`/api/hr/reports/${reportType}/export?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export report';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
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
  };
}


