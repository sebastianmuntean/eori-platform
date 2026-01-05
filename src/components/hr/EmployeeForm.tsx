'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useTranslations } from 'next-intl';
import { Employee } from '@/hooks/useEmployees';
import { useParishes } from '@/hooks/useParishes';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';

interface EmployeeFormProps {
  employee?: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Employee>) => Promise<void>;
  isLoading?: boolean;
}

export function EmployeeForm({
  employee,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: EmployeeFormProps) {
  const t = useTranslations('common');
  const { parishes, fetchParishes } = useParishes();
  const { departments, fetchDepartments } = useDepartments();
  const { positions, fetchPositions } = usePositions();

  const [formData, setFormData] = useState<Partial<Employee>>({
    parishId: '',
    employeeNumber: '',
    firstName: '',
    lastName: '',
    cnp: null,
    birthDate: null,
    gender: null,
    phone: null,
    email: null,
    address: null,
    city: null,
    county: null,
    postalCode: null,
    departmentId: null,
    positionId: null,
    hireDate: '',
    employmentStatus: 'active',
    bankName: null,
    iban: null,
    notes: null,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filteredDepartments, setFilteredDepartments] = useState<Array<{ value: string; label: string }>>([]);
  const [filteredPositions, setFilteredPositions] = useState<Array<{ value: string; label: string }>>([]);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      fetchParishes({ pageSize: 1000 });
    }
  }, [isOpen, fetchParishes]);

  // Load departments when parish changes
  useEffect(() => {
    if (formData.parishId) {
      fetchDepartments({ parishId: formData.parishId, pageSize: 1000 });
    }
  }, [formData.parishId, fetchDepartments]);

  // Load positions when parish or department changes
  useEffect(() => {
    if (formData.parishId) {
      fetchPositions({ parishId: formData.parishId, departmentId: formData.departmentId || undefined, pageSize: 1000 });
    }
  }, [formData.parishId, formData.departmentId, fetchPositions]);

  // Update filtered lists
  useEffect(() => {
    if (formData.parishId) {
      const depts = departments
        .filter((d) => d.parishId === formData.parishId && d.isActive)
        .map((d) => ({ value: d.id, label: d.name }));
      setFilteredDepartments(depts);
    } else {
      setFilteredDepartments([]);
    }
  }, [departments, formData.parishId]);

  useEffect(() => {
    if (formData.parishId) {
      const pos = positions
        .filter((p) => {
          if (p.parishId !== formData.parishId || !p.isActive) return false;
          if (formData.departmentId && p.departmentId) {
            return p.departmentId === formData.departmentId;
          }
          return true;
        })
        .map((p) => ({ value: p.id, label: p.title }));
      setFilteredPositions(pos);
    } else {
      setFilteredPositions([]);
    }
  }, [positions, formData.parishId, formData.departmentId]);

  // Initialize form data when employee changes
  useEffect(() => {
    if (employee) {
      setFormData({
        parishId: employee.parishId,
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        cnp: employee.cnp,
        birthDate: employee.birthDate,
        gender: employee.gender,
        phone: employee.phone,
        email: employee.email,
        address: employee.address,
        city: employee.city,
        county: employee.county,
        postalCode: employee.postalCode,
        departmentId: employee.departmentId,
        positionId: employee.positionId,
        hireDate: employee.hireDate,
        employmentStatus: employee.employmentStatus,
        bankName: employee.bankName,
        iban: employee.iban,
        notes: employee.notes,
        isActive: employee.isActive,
      });
    } else {
      setFormData({
        parishId: '',
        employeeNumber: '',
        firstName: '',
        lastName: '',
        cnp: null,
        birthDate: null,
        gender: null,
        phone: null,
        email: null,
        address: null,
        city: null,
        county: null,
        postalCode: null,
        departmentId: null,
        positionId: null,
        hireDate: '',
        employmentStatus: 'active',
        bankName: null,
        iban: null,
        notes: null,
        isActive: true,
      });
    }
    setErrors({});
  }, [employee, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.parishId) {
      newErrors.parishId = t('parishRequired') || 'Parish is required';
    }
    if (!formData.employeeNumber) {
      newErrors.employeeNumber = t('employeeNumberRequired') || 'Employee number is required';
    }
    if (!formData.firstName) {
      newErrors.firstName = t('firstNameRequired') || 'First name is required';
    }
    if (!formData.lastName) {
      newErrors.lastName = t('lastNameRequired') || 'Last name is required';
    }
    if (!formData.hireDate) {
      newErrors.hireDate = t('hireDateRequired') || 'Hire date is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('invalidEmail') || 'Invalid email address';
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

  const handleChange = (field: keyof Employee, value: any) => {
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
    // Reset dependent fields when parish changes
    if (field === 'parishId') {
      setFormData((prev) => ({
        ...prev,
        parishId: value,
        departmentId: null,
        positionId: null,
      }));
    }
    // Reset position when department changes
    if (field === 'departmentId') {
      setFormData((prev) => ({
        ...prev,
        departmentId: value,
        positionId: null,
      }));
    }
  };

  const parishOptions = parishes
    .filter((p) => p.isActive)
    .map((p) => ({ value: p.id, label: p.name }));

  const genderOptions = [
    { value: 'male', label: t('male') || 'Male' },
    { value: 'female', label: t('female') || 'Female' },
    { value: 'other', label: t('other') || 'Other' },
  ];

  const employmentStatusOptions = [
    { value: 'active', label: t('active') || 'Active' },
    { value: 'on_leave', label: t('onLeave') || 'On Leave' },
    { value: 'terminated', label: t('terminated') || 'Terminated' },
    { value: 'retired', label: t('retired') || 'Retired' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employee ? t('editEmployee') || 'Edit Employee' : t('addEmployee') || 'Add Employee'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Parish */}
          <Select
            label={t('parish')}
            value={formData.parishId || ''}
            onChange={(e) => handleChange('parishId', e.target.value)}
            options={parishOptions}
            placeholder={t('selectParish') || 'Select parish'}
            error={errors.parishId}
            required
          />

          {/* Employee Number */}
          <Input
            label={t('employeeNumber')}
            value={formData.employeeNumber || ''}
            onChange={(e) => handleChange('employeeNumber', e.target.value)}
            error={errors.employeeNumber}
            required
          />

          {/* First Name */}
          <Input
            label={t('firstName')}
            value={formData.firstName || ''}
            onChange={(e) => handleChange('firstName', e.target.value)}
            error={errors.firstName}
            required
          />

          {/* Last Name */}
          <Input
            label={t('lastName')}
            value={formData.lastName || ''}
            onChange={(e) => handleChange('lastName', e.target.value)}
            error={errors.lastName}
            required
          />

          {/* CNP */}
          <Input
            label={t('cnp') || 'CNP'}
            value={formData.cnp || ''}
            onChange={(e) => handleChange('cnp', e.target.value)}
            error={errors.cnp}
            maxLength={13}
          />

          {/* Birth Date */}
          <Input
            label={t('birthDate')}
            type="date"
            value={formData.birthDate || ''}
            onChange={(e) => handleChange('birthDate', e.target.value)}
            error={errors.birthDate}
          />

          {/* Gender */}
          <Select
            label={t('gender')}
            value={formData.gender || ''}
            onChange={(e) => handleChange('gender', e.target.value as 'male' | 'female' | 'other' | null)}
            options={genderOptions}
            placeholder={t('selectGender') || 'Select gender'}
            error={errors.gender}
          />

          {/* Phone */}
          <Input
            label={t('phone')}
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            error={errors.phone}
          />

          {/* Email */}
          <Input
            label={t('email')}
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
          />

          {/* Address */}
          <Input
            label={t('address')}
            value={formData.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            error={errors.address}
          />

          {/* City */}
          <Input
            label={t('city')}
            value={formData.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            error={errors.city}
          />

          {/* County */}
          <Input
            label={t('county')}
            value={formData.county || ''}
            onChange={(e) => handleChange('county', e.target.value)}
            error={errors.county}
          />

          {/* Postal Code */}
          <Input
            label={t('postalCode')}
            value={formData.postalCode || ''}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            error={errors.postalCode}
          />

          {/* Department */}
          <Select
            label={t('department')}
            value={formData.departmentId || ''}
            onChange={(e) => handleChange('departmentId', e.target.value)}
            options={filteredDepartments}
            placeholder={t('selectDepartment') || 'Select department'}
            error={errors.departmentId}
            disabled={!formData.parishId}
          />

          {/* Position */}
          <Select
            label={t('position')}
            value={formData.positionId || ''}
            onChange={(e) => handleChange('positionId', e.target.value)}
            options={filteredPositions}
            placeholder={t('selectPosition') || 'Select position'}
            error={errors.positionId}
            disabled={!formData.parishId}
          />

          {/* Hire Date */}
          <Input
            label={t('hireDate')}
            type="date"
            value={formData.hireDate || ''}
            onChange={(e) => handleChange('hireDate', e.target.value)}
            error={errors.hireDate}
            required
          />

          {/* Employment Status */}
          <Select
            label={t('employmentStatus')}
            value={formData.employmentStatus || 'active'}
            onChange={(e) => handleChange('employmentStatus', e.target.value as any)}
            options={employmentStatusOptions}
            error={errors.employmentStatus}
          />

          {/* Bank Name */}
          <Input
            label={t('bankName')}
            value={formData.bankName || ''}
            onChange={(e) => handleChange('bankName', e.target.value)}
            error={errors.bankName}
          />

          {/* IBAN */}
          <Input
            label={t('iban') || 'IBAN'}
            value={formData.iban || ''}
            onChange={(e) => handleChange('iban', e.target.value)}
            error={errors.iban}
          />

          {/* Is Active */}
          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive ?? true}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-text-primary">
              {t('isActive') || 'Is Active'}
            </label>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Textarea
            label={t('notes')}
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            error={errors.notes}
            rows={4}
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
            {employee ? t('saveChanges') : t('create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}


