'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useTranslations } from 'next-intl';
import { Salary } from '@/hooks/useSalaries';
import { useEmployees } from '@/hooks/useEmployees';
import { useEmploymentContracts } from '@/hooks/useEmploymentContracts';

interface SalaryFormProps {
  salary?: Salary | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Salary>) => Promise<void>;
  isLoading?: boolean;
}

export function SalaryForm({
  salary,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: SalaryFormProps) {
  const t = useTranslations('common');
  const { employees, fetchEmployees } = useEmployees();
  const { contracts, fetchContracts } = useEmploymentContracts();

  const [formData, setFormData] = useState<Partial<Salary>>({
    employeeId: '',
    contractId: '',
    salaryPeriod: '',
    baseSalary: '',
    grossSalary: '',
    netSalary: '',
    totalBenefits: '0',
    totalDeductions: '0',
    workingDays: 0,
    workedDays: 0,
    status: 'draft',
    notes: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filteredContracts, setFilteredContracts] = useState<Array<{ value: string; label: string }>>([]);

  // Load employees and contracts when form opens
  useEffect(() => {
    if (isOpen) {
      fetchEmployees({ pageSize: 1000 });
    }
  }, [isOpen, fetchEmployees]);

  // Load contracts when employee changes
  useEffect(() => {
    if (formData.employeeId) {
      fetchContracts({ employeeId: formData.employeeId, pageSize: 1000 });
    }
  }, [formData.employeeId, fetchContracts]);

  // Update filtered contracts
  useEffect(() => {
    if (formData.employeeId) {
      const filtered = contracts
        .filter((c) => c.employeeId === formData.employeeId && c.status === 'active')
        .map((c) => ({ value: c.id, label: `${c.contractNumber} (${c.contractType})` }));
      setFilteredContracts(filtered);
    } else {
      setFilteredContracts([]);
    }
  }, [contracts, formData.employeeId]);

  // Initialize form data when salary changes
  useEffect(() => {
    if (salary) {
      setFormData({
        employeeId: salary.employeeId,
        contractId: salary.contractId,
        salaryPeriod: salary.salaryPeriod,
        baseSalary: salary.baseSalary,
        grossSalary: salary.grossSalary,
        netSalary: salary.netSalary,
        totalBenefits: salary.totalBenefits,
        totalDeductions: salary.totalDeductions,
        workingDays: salary.workingDays,
        workedDays: salary.workedDays,
        status: salary.status,
        notes: salary.notes,
      });
    } else {
      setFormData({
        employeeId: '',
        contractId: '',
        salaryPeriod: '',
        baseSalary: '',
        grossSalary: '',
        netSalary: '',
        totalBenefits: '0',
        totalDeductions: '0',
        workingDays: 0,
        workedDays: 0,
        status: 'draft',
        notes: null,
      });
    }
    setErrors({});
  }, [salary, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.employeeId) {
      newErrors.employeeId = t('employeeRequired') || 'Employee is required';
    }
    if (!formData.contractId) {
      newErrors.contractId = t('contractRequired') || 'Contract is required';
    }
    if (!formData.salaryPeriod) {
      newErrors.salaryPeriod = t('salaryPeriodRequired') || 'Salary period is required';
    }
    if (!formData.baseSalary) {
      newErrors.baseSalary = t('baseSalaryRequired') || 'Base salary is required';
    }
    if (!formData.grossSalary) {
      newErrors.grossSalary = t('grossSalaryRequired') || 'Gross salary is required';
    }
    if (!formData.netSalary) {
      newErrors.netSalary = t('netSalaryRequired') || 'Net salary is required';
    }
    if (formData.workingDays < 0) {
      newErrors.workingDays = t('workingDaysInvalid') || 'Working days must be >= 0';
    }
    if (formData.workedDays < 0 || formData.workedDays > formData.workingDays) {
      newErrors.workedDays = t('workedDaysInvalid') || 'Worked days must be >= 0 and <= working days';
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

  const handleChange = (field: keyof Salary, value: any) => {
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
    // Reset contract when employee changes
    if (field === 'employeeId') {
      setFormData((prev) => ({
        ...prev,
        employeeId: value,
        contractId: '',
      }));
    }
  };

  const employeeOptions = employees
    .filter((e) => e.isActive)
    .map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName} (${e.employeeNumber})` }));

  const statusOptions = [
    { value: 'draft', label: t('draft') || 'Draft' },
    { value: 'calculated', label: t('calculated') || 'Calculated' },
    { value: 'approved', label: t('approved') || 'Approved' },
    { value: 'paid', label: t('paid') || 'Paid' },
    { value: 'cancelled', label: t('cancelled') || 'Cancelled' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={salary ? t('editSalary') || 'Edit Salary' : t('addSalary') || 'Add Salary'}
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

          {/* Contract */}
          <Select
            label={t('contract')}
            value={formData.contractId || ''}
            onChange={(e) => handleChange('contractId', e.target.value)}
            options={filteredContracts}
            placeholder={t('selectContract') || 'Select contract'}
            error={errors.contractId}
            required
            disabled={!formData.employeeId}
          />

          {/* Salary Period */}
          <Input
            label={t('salaryPeriod')}
            type="date"
            value={formData.salaryPeriod || ''}
            onChange={(e) => handleChange('salaryPeriod', e.target.value)}
            error={errors.salaryPeriod}
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

          {/* Gross Salary */}
          <Input
            label={t('grossSalary')}
            type="number"
            step="0.01"
            min="0"
            value={formData.grossSalary || ''}
            onChange={(e) => handleChange('grossSalary', e.target.value)}
            error={errors.grossSalary}
            required
          />

          {/* Net Salary */}
          <Input
            label={t('netSalary')}
            type="number"
            step="0.01"
            min="0"
            value={formData.netSalary || ''}
            onChange={(e) => handleChange('netSalary', e.target.value)}
            error={errors.netSalary}
            required
          />

          {/* Total Benefits */}
          <Input
            label={t('totalBenefits')}
            type="number"
            step="0.01"
            min="0"
            value={formData.totalBenefits || '0'}
            onChange={(e) => handleChange('totalBenefits', e.target.value)}
            error={errors.totalBenefits}
          />

          {/* Total Deductions */}
          <Input
            label={t('totalDeductions')}
            type="number"
            step="0.01"
            min="0"
            value={formData.totalDeductions || '0'}
            onChange={(e) => handleChange('totalDeductions', e.target.value)}
            error={errors.totalDeductions}
          />

          {/* Working Days */}
          <Input
            label={t('workingDays')}
            type="number"
            min="0"
            value={formData.workingDays?.toString() || '0'}
            onChange={(e) => handleChange('workingDays', parseInt(e.target.value) || 0)}
            error={errors.workingDays}
            required
          />

          {/* Worked Days */}
          <Input
            label={t('workedDays')}
            type="number"
            min="0"
            max={formData.workingDays}
            value={formData.workedDays?.toString() || '0'}
            onChange={(e) => handleChange('workedDays', parseInt(e.target.value) || 0)}
            error={errors.workedDays}
            required
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
            {salary ? t('saveChanges') : t('create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

