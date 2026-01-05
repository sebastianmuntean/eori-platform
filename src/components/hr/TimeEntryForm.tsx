'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useTranslations } from 'next-intl';
import { TimeEntry } from '@/hooks/useTimeEntries';
import { useEmployees } from '@/hooks/useEmployees';

interface TimeEntryFormProps {
  timeEntry?: TimeEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<TimeEntry>) => Promise<void>;
  isLoading?: boolean;
}

export function TimeEntryForm({
  timeEntry,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: TimeEntryFormProps) {
  const t = useTranslations('common');
  const { employees, fetchEmployees } = useEmployees();

  const [formData, setFormData] = useState<Partial<TimeEntry>>({
    employeeId: '',
    entryDate: '',
    checkInTime: null,
    checkOutTime: null,
    breakDurationMinutes: 0,
    workedHours: null,
    overtimeHours: '0',
    status: 'present',
    notes: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load employees when form opens
  useEffect(() => {
    if (isOpen) {
      fetchEmployees({ pageSize: 1000 });
    }
  }, [isOpen, fetchEmployees]);

  // Initialize form data when timeEntry changes
  useEffect(() => {
    if (timeEntry) {
      setFormData({
        employeeId: timeEntry.employeeId,
        entryDate: timeEntry.entryDate,
        checkInTime: timeEntry.checkInTime,
        checkOutTime: timeEntry.checkOutTime,
        breakDurationMinutes: timeEntry.breakDurationMinutes,
        workedHours: timeEntry.workedHours,
        overtimeHours: timeEntry.overtimeHours,
        status: timeEntry.status,
        notes: timeEntry.notes,
      });
    } else {
      setFormData({
        employeeId: '',
        entryDate: '',
        checkInTime: null,
        checkOutTime: null,
        breakDurationMinutes: 0,
        workedHours: null,
        overtimeHours: '0',
        status: 'present',
        notes: null,
      });
    }
    setErrors({});
  }, [timeEntry, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.employeeId) {
      newErrors.employeeId = t('employeeRequired') || 'Employee is required';
    }
    if (!formData.entryDate) {
      newErrors.entryDate = t('entryDateRequired') || 'Entry date is required';
    }
    if ((formData.breakDurationMinutes ?? 0) < 0) {
      newErrors.breakDurationMinutes = t('breakDurationInvalid') || 'Break duration must be >= 0';
    }
    if (formData.checkInTime && formData.checkOutTime && formData.checkInTime >= formData.checkOutTime) {
      newErrors.checkOutTime = t('checkOutTimeMustBeAfterCheckIn') || 'Check-out time must be after check-in time';
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

  const handleChange = (field: keyof TimeEntry, value: any) => {
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

  const statusOptions = [
    { value: 'present', label: t('present') || 'Present' },
    { value: 'absent', label: t('absent') || 'Absent' },
    { value: 'late', label: t('late') || 'Late' },
    { value: 'half_day', label: t('halfDay') || 'Half Day' },
    { value: 'holiday', label: t('holiday') || 'Holiday' },
    { value: 'sick_leave', label: t('sickLeave') || 'Sick Leave' },
    { value: 'vacation', label: t('vacation') || 'Vacation' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={timeEntry ? t('editTimeEntry') || 'Edit Time Entry' : t('addTimeEntry') || 'Add Time Entry'}
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

          {/* Entry Date */}
          <Input
            label={t('entryDate')}
            type="date"
            value={formData.entryDate || ''}
            onChange={(e) => handleChange('entryDate', e.target.value)}
            error={errors.entryDate}
            required
          />

          {/* Status */}
          <Select
            label={t('status')}
            value={formData.status || 'present'}
            onChange={(e) => handleChange('status', e.target.value as any)}
            options={statusOptions}
            error={errors.status}
          />

          {/* Check-in Time */}
          <Input
            label={t('checkInTime')}
            type="time"
            value={formData.checkInTime || ''}
            onChange={(e) => handleChange('checkInTime', e.target.value)}
            error={errors.checkInTime}
          />

          {/* Check-out Time */}
          <Input
            label={t('checkOutTime')}
            type="time"
            value={formData.checkOutTime || ''}
            onChange={(e) => handleChange('checkOutTime', e.target.value)}
            error={errors.checkOutTime}
          />

          {/* Break Duration (minutes) */}
          <Input
            label={t('breakDurationMinutes')}
            type="number"
            min="0"
            value={formData.breakDurationMinutes?.toString() || '0'}
            onChange={(e) => handleChange('breakDurationMinutes', parseInt(e.target.value) || 0)}
            error={errors.breakDurationMinutes}
          />

          {/* Worked Hours */}
          <Input
            label={t('workedHours')}
            type="number"
            step="0.01"
            min="0"
            value={formData.workedHours || ''}
            onChange={(e) => handleChange('workedHours', e.target.value)}
            error={errors.workedHours}
          />

          {/* Overtime Hours */}
          <Input
            label={t('overtimeHours')}
            type="number"
            step="0.01"
            min="0"
            value={formData.overtimeHours || '0'}
            onChange={(e) => handleChange('overtimeHours', e.target.value)}
            error={errors.overtimeHours}
          />
        </div>

        {/* Notes */}
        <div>
          <Textarea
            label={t('notes')}
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            error={errors.notes}
            rows={3}
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
            {timeEntry ? t('saveChanges') : t('create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

