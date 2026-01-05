'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useTranslations } from 'next-intl';
import { LeaveRequest } from '@/hooks/useLeaveRequests';
import { useEmployees } from '@/hooks/useEmployees';
import { useLeaveTypes } from '@/hooks/useLeaveTypes';

interface LeaveRequestFormProps {
  leaveRequest?: LeaveRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<LeaveRequest>) => Promise<void>;
  isLoading?: boolean;
}

export function LeaveRequestForm({
  leaveRequest,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: LeaveRequestFormProps) {
  const t = useTranslations('common');
  const { employees, fetchEmployees } = useEmployees();
  const { leaveTypes, fetchLeaveTypes } = useLeaveTypes();

  const [formData, setFormData] = useState<Partial<LeaveRequest>>({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedDays, setCalculatedDays] = useState<number>(0);

  // Load employees and leave types when form opens
  useEffect(() => {
    if (isOpen) {
      fetchEmployees({ pageSize: 1000 });
      fetchLeaveTypes({ pageSize: 1000 });
    }
  }, [isOpen, fetchEmployees, fetchLeaveTypes]);

  // Calculate total days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setCalculatedDays(diffDays);
      } else {
        setCalculatedDays(0);
      }
    } else {
      setCalculatedDays(0);
    }
  }, [formData.startDate, formData.endDate]);

  // Initialize form data when leaveRequest changes
  useEffect(() => {
    if (leaveRequest) {
      setFormData({
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        reason: leaveRequest.reason,
      });
      setCalculatedDays(leaveRequest.totalDays);
    } else {
      setFormData({
        employeeId: '',
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: null,
      });
      setCalculatedDays(0);
    }
    setErrors({});
  }, [leaveRequest, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.employeeId) {
      newErrors.employeeId = t('employeeRequired') || 'Employee is required';
    }
    if (!formData.leaveTypeId) {
      newErrors.leaveTypeId = t('leaveTypeRequired') || 'Leave type is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = t('startDateRequired') || 'Start date is required';
    }
    if (!formData.endDate) {
      newErrors.endDate = t('endDateRequired') || 'End date is required';
    }
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      newErrors.endDate = t('endDateMustBeAfterStartDate') || 'End date must be after start date';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleChange = (field: keyof LeaveRequest, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const employeeOptions = employees
    .filter((e) => e.isActive)
    .map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName} (${e.employeeNumber})` }));

  const leaveTypeOptions = leaveTypes
    .filter((lt) => lt.isActive)
    .map((lt) => ({ value: lt.id, label: lt.name }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={leaveRequest ? t('editLeaveRequest') || 'Edit Leave Request' : t('addLeaveRequest') || 'Add Leave Request'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Employee */}
          <Select
            label={t('employee')}
            value={formData.employeeId || ''}
            onChange={(e) => handleChange('employeeId', e.target.value)}
            options={employeeOptions}
            placeholder={t('selectEmployee') || 'Select employee'}
            error={errors.employeeId}
            required
          />

          {/* Leave Type */}
          <Select
            label={t('leaveType')}
            value={formData.leaveTypeId || ''}
            onChange={(e) => handleChange('leaveTypeId', e.target.value)}
            options={leaveTypeOptions}
            placeholder={t('selectLeaveType') || 'Select leave type'}
            error={errors.leaveTypeId}
            required
          />

          {/* Start Date */}
          <Input
            label={t('startDate')}
            type="date"
            value={formData.startDate || ''}
            onChange={(e) => handleChange('startDate', e.target.value)}
            error={errors.startDate}
            required
          />

          {/* End Date */}
          <Input
            label={t('endDate')}
            type="date"
            value={formData.endDate || ''}
            onChange={(e) => handleChange('endDate', e.target.value)}
            error={errors.endDate}
            required
          />

          {/* Calculated Total Days */}
          {calculatedDays > 0 && (
            <div className="md:col-span-2">
              <div className="p-3 bg-bg-secondary rounded-md">
                <span className="text-sm font-medium text-text-primary">
                  {t('totalDays') || 'Total Days'}: <span className="font-bold">{calculatedDays}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <Textarea
            label={t('reason')}
            value={formData.reason || ''}
            onChange={(e) => handleChange('reason', e.target.value)}
            error={errors.reason}
            rows={4}
            placeholder={t('leaveRequestReasonPlaceholder') || 'Enter reason for leave request...'}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {leaveRequest ? t('saveChanges') : t('create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

