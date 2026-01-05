'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useTranslations } from 'next-intl';
import { EmploymentContract } from '@/hooks/useEmploymentContracts';
import { useEmployees } from '@/hooks/useEmployees';

interface ContractFormProps {
  contract?: EmploymentContract | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<EmploymentContract>) => Promise<void>;
  isLoading?: boolean;
}

export function ContractForm({
  contract,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: ContractFormProps) {
  const t = useTranslations('common');
  const { employees, fetchEmployees } = useEmployees();

  const [formData, setFormData] = useState<Partial<EmploymentContract>>({
    employeeId: '',
    contractNumber: '',
    contractType: 'indeterminate',
    startDate: '',
    endDate: null,
    probationEndDate: null,
    baseSalary: '',
    currency: 'RON',
    workingHoursPerWeek: 40,
    workLocation: null,
    jobDescription: null,
    status: 'draft',
    notes: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load employees when form opens
  useEffect(() => {
    if (isOpen) {
      fetchEmployees({ pageSize: 1000 });
    }
  }, [isOpen, fetchEmployees]);

  // Initialize form data when contract changes
  useEffect(() => {
    if (contract) {
      setFormData({
        employeeId: contract.employeeId,
        contractNumber: contract.contractNumber,
        contractType: contract.contractType,
        startDate: contract.startDate,
        endDate: contract.endDate,
        probationEndDate: contract.probationEndDate,
        baseSalary: contract.baseSalary,
        currency: contract.currency,
        workingHoursPerWeek: contract.workingHoursPerWeek,
        workLocation: contract.workLocation,
        jobDescription: contract.jobDescription,
        status: contract.status,
        notes: contract.notes,
      });
    } else {
      setFormData({
        employeeId: '',
        contractNumber: '',
        contractType: 'indeterminate',
        startDate: '',
        endDate: null,
        probationEndDate: null,
        baseSalary: '',
        currency: 'RON',
        workingHoursPerWeek: 40,
        workLocation: null,
        jobDescription: null,
        status: 'draft',
        notes: null,
      });
    }
    setErrors({});
  }, [contract, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.employeeId) {
      newErrors.employeeId = t('employeeRequired') || 'Employee is required';
    }
    if (!formData.contractNumber) {
      newErrors.contractNumber = t('contractNumberRequired') || 'Contract number is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = t('startDateRequired') || 'Start date is required';
    }
    if (!formData.baseSalary) {
      newErrors.baseSalary = t('baseSalaryRequired') || 'Base salary is required';
    }
    if (formData.workingHoursPerWeek === undefined || formData.workingHoursPerWeek < 1 || formData.workingHoursPerWeek > 168) {
      newErrors.workingHoursPerWeek = t('invalidWorkingHours') || 'Working hours must be between 1 and 168';
    }
    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      newErrors.endDate = t('endDateMustBeAfterStartDate') || 'End date must be after start date';
    }
    if (formData.probationEndDate && formData.startDate && formData.probationEndDate < formData.startDate) {
      newErrors.probationEndDate = t('probationEndDateMustBeAfterStartDate') || 'Probation end date must be after start date';
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

  const handleChange = (field: keyof EmploymentContract, value: any) => {
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

  const contractTypeOptions = [
    { value: 'indeterminate', label: t('indeterminate') || 'Indeterminate' },
    { value: 'determinate', label: t('determinate') || 'Determinate' },
    { value: 'part_time', label: t('partTime') || 'Part Time' },
    { value: 'internship', label: t('internship') || 'Internship' },
    { value: 'consultant', label: t('consultant') || 'Consultant' },
  ];

  const statusOptions = [
    { value: 'draft', label: t('draft') || 'Draft' },
    { value: 'active', label: t('active') || 'Active' },
    { value: 'expired', label: t('expired') || 'Expired' },
    { value: 'terminated', label: t('terminated') || 'Terminated' },
    { value: 'suspended', label: t('suspended') || 'Suspended' },
  ];

  const currencyOptions = [
    { value: 'RON', label: 'RON' },
    { value: 'EUR', label: 'EUR' },
    { value: 'USD', label: 'USD' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contract ? t('editContract') || 'Edit Contract' : t('addContract') || 'Add Contract'}
      size="xl"
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

          {/* Contract Number */}
          <Input
            label={t('contractNumber')}
            value={formData.contractNumber || ''}
            onChange={(e) => handleChange('contractNumber', e.target.value)}
            error={errors.contractNumber}
            required
          />

          {/* Contract Type */}
          <Select
            label={t('contractType')}
            value={formData.contractType || 'indeterminate'}
            onChange={(e) => handleChange('contractType', e.target.value as any)}
            options={contractTypeOptions}
            error={errors.contractType}
            required
          />

          {/* Status */}
          <Select
            label={t('status')}
            value={formData.status || 'draft'}
            onChange={(e) => handleChange('status', e.target.value as any)}
            options={statusOptions}
            error={errors.status}
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
          />

          {/* Probation End Date */}
          <Input
            label={t('probationEndDate')}
            type="date"
            value={formData.probationEndDate || ''}
            onChange={(e) => handleChange('probationEndDate', e.target.value)}
            error={errors.probationEndDate}
          />

          {/* Base Salary */}
          <Input
            label={t('baseSalary')}
            type="number"
            step="0.01"
            min="0"
            value={formData.baseSalary || ''}
            onChange={(e) => handleChange('baseSalary', e.target.value)}
            error={errors.baseSalary}
            required
          />

          {/* Currency */}
          <Select
            label={t('currency')}
            value={formData.currency || 'RON'}
            onChange={(e) => handleChange('currency', e.target.value)}
            options={currencyOptions}
            error={errors.currency}
          />

          {/* Working Hours Per Week */}
          <Input
            label={t('workingHoursPerWeek')}
            type="number"
            min="1"
            max="168"
            value={formData.workingHoursPerWeek?.toString() || '40'}
            onChange={(e) => handleChange('workingHoursPerWeek', parseInt(e.target.value) || 40)}
            error={errors.workingHoursPerWeek}
            required
          />

          {/* Work Location */}
          <Input
            label={t('workLocation')}
            value={formData.workLocation || ''}
            onChange={(e) => handleChange('workLocation', e.target.value)}
            error={errors.workLocation}
          />
        </div>

        {/* Job Description */}
        <div>
          <Textarea
            label={t('jobDescription')}
            value={formData.jobDescription || ''}
            onChange={(e) => handleChange('jobDescription', e.target.value)}
            error={errors.jobDescription}
            rows={4}
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
            {contract ? t('saveChanges') : t('create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}


