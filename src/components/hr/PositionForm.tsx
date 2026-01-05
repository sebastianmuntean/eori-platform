'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useTranslations } from 'next-intl';
import { Position } from '@/hooks/usePositions';
import { useParishes } from '@/hooks/useParishes';
import { useDepartments } from '@/hooks/useDepartments';

interface PositionFormProps {
  position?: Position | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Position>) => Promise<void>;
  isLoading?: boolean;
}

export function PositionForm({
  position,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: PositionFormProps) {
  const t = useTranslations('common');
  const { parishes, fetchParishes } = useParishes();
  const { departments, fetchDepartments } = useDepartments();

  const [formData, setFormData] = useState<Partial<Position>>({
    parishId: '',
    departmentId: null,
    code: '',
    title: '',
    description: null,
    minSalary: null,
    maxSalary: null,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filteredDepartments, setFilteredDepartments] = useState<Array<{ value: string; label: string }>>([]);

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

  // Update filtered departments
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

  // Initialize form data when position changes
  useEffect(() => {
    if (position) {
      setFormData({
        parishId: position.parishId,
        departmentId: position.departmentId,
        code: position.code,
        title: position.title,
        description: position.description,
        minSalary: position.minSalary,
        maxSalary: position.maxSalary,
        isActive: position.isActive,
      });
    } else {
      setFormData({
        parishId: '',
        departmentId: null,
        code: '',
        title: '',
        description: null,
        minSalary: null,
        maxSalary: null,
        isActive: true,
      });
    }
    setErrors({});
  }, [position, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.parishId) {
      newErrors.parishId = t('parishRequired') || 'Parish is required';
    }
    if (!formData.code) {
      newErrors.code = t('codeRequired') || 'Code is required';
    }
    if (!formData.title) {
      newErrors.title = t('titleRequired') || 'Title is required';
    }
    if (formData.minSalary && formData.maxSalary && parseFloat(formData.minSalary) > parseFloat(formData.maxSalary)) {
      newErrors.maxSalary = t('maxSalaryMustBeGreaterThanMin') || 'Max salary must be greater than min salary';
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

  const handleChange = (field: keyof Position, value: any) => {
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
    // Reset department when parish changes
    if (field === 'parishId') {
      setFormData((prev) => ({
        ...prev,
        parishId: value,
        departmentId: null,
      }));
    }
  };

  const parishOptions = parishes
    .filter((p) => p.isActive)
    .map((p) => ({ value: p.id, label: p.name }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={position ? t('editPosition') || 'Edit Position' : t('addPosition') || 'Add Position'}
      size="lg"
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

          {/* Code */}
          <Input
            label={t('code')}
            value={formData.code || ''}
            onChange={(e) => handleChange('code', e.target.value)}
            error={errors.code}
            required
          />

          {/* Title */}
          <Input
            label={t('title')}
            value={formData.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            error={errors.title}
            required
          />

          {/* Min Salary */}
          <Input
            label={t('minSalary')}
            type="number"
            step="0.01"
            min="0"
            value={formData.minSalary || ''}
            onChange={(e) => handleChange('minSalary', e.target.value)}
            error={errors.minSalary}
          />

          {/* Max Salary */}
          <Input
            label={t('maxSalary')}
            type="number"
            step="0.01"
            min="0"
            value={formData.maxSalary || ''}
            onChange={(e) => handleChange('maxSalary', e.target.value)}
            error={errors.maxSalary}
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

        {/* Description */}
        <div>
          <Textarea
            label={t('description')}
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            error={errors.description}
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
            {position ? t('saveChanges') : t('create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

