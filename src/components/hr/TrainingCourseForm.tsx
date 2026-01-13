'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useTranslations } from 'next-intl';
import { TrainingCourse } from '@/hooks/useTrainingCourses';

interface TrainingCourseFormProps {
  course?: TrainingCourse | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<TrainingCourse>) => Promise<void>;
  isLoading?: boolean;
}

export function TrainingCourseForm({
  course,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: TrainingCourseFormProps) {
  const t = useTranslations('common');

  const [formData, setFormData] = useState<Partial<TrainingCourse>>({
    code: '',
    name: '',
    description: null,
    provider: null,
    durationHours: null,
    cost: null,
    isCertified: false,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when course changes
  useEffect(() => {
    if (course) {
      setFormData({
        code: course.code,
        name: course.name,
        description: course.description,
        provider: course.provider,
        durationHours: course.durationHours,
        cost: course.cost,
        isCertified: course.isCertified,
        isActive: course.isActive,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        description: null,
        provider: null,
        durationHours: null,
        cost: null,
        isCertified: false,
        isActive: true,
      });
    }
    setErrors({});
  }, [course, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.code || formData.code.trim() === '') {
      newErrors.code = t('courseCodeRequired') || 'Course code is required';
    }
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = t('courseNameRequired') || 'Course name is required';
    }
    if (formData.durationHours && formData.durationHours < 0) {
      newErrors.durationHours = t('durationHoursInvalid') || 'Duration hours must be a positive number';
    }
    if (formData.cost && parseFloat(formData.cost) < 0) {
      newErrors.cost = t('costInvalid') || 'Cost must be a positive number';
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

  const handleChange = (field: keyof TrainingCourse, value: any) => {
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

  const booleanOptions = [
    { value: 'true', label: t('yes') || 'Yes' },
    { value: 'false', label: t('no') || 'No' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={course ? t('editTrainingCourse') || 'Edit Training Course' : t('addTrainingCourse') || 'Add Training Course'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Course Code */}
          <Input
            label={t('courseCode') || 'Course Code'}
            type="text"
            value={formData.code || ''}
            onChange={(e) => handleChange('code', e.target.value)}
            error={errors.code}
            required
            placeholder="e.g., TR-001"
          />

          {/* Course Name */}
          <Input
            label={t('courseName') || 'Course Name'}
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            required
            placeholder="e.g., Leadership Training"
          />

          {/* Provider */}
          <Input
            label={t('provider') || 'Provider'}
            type="text"
            value={formData.provider || ''}
            onChange={(e) => handleChange('provider', e.target.value)}
            error={errors.provider}
            placeholder="e.g., Training Company Inc."
          />

          {/* Duration Hours */}
          <Input
            label={t('durationHours') || 'Duration (Hours)'}
            type="number"
            min="0"
            step="0.5"
            value={formData.durationHours?.toString() || ''}
            onChange={(e) => handleChange('durationHours', e.target.value ? parseFloat(e.target.value) : null)}
            error={errors.durationHours}
            placeholder="e.g., 40"
          />

          {/* Cost */}
          <Input
            label={t('cost') || 'Cost'}
            type="number"
            min="0"
            step="0.01"
            value={formData.cost || ''}
            onChange={(e) => handleChange('cost', e.target.value || null)}
            error={errors.cost}
            placeholder="0.00"
          />

          {/* Is Certified */}
          <Select
            label={t('isCertified') || 'Is Certified'}
            value={formData.isCertified ? 'true' : 'false'}
            onChange={(e) => handleChange('isCertified', e.target.value === 'true')}
            options={booleanOptions}
            error={errors.isCertified}
          />

          {/* Is Active */}
          <Select
            label={t('status') || 'Status'}
            value={formData.isActive ? 'true' : 'false'}
            onChange={(e) => handleChange('isActive', e.target.value === 'true')}
            options={booleanOptions}
            error={errors.isActive}
          />
        </div>

        {/* Description */}
        <div>
          <Textarea
            label={t('courseDescription') || 'Course Description'}
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            error={errors.description}
            rows={4}
            placeholder={t('courseDescriptionPlaceholder') || 'Enter course description...'}
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
            {course ? t('saveChanges') : t('create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

