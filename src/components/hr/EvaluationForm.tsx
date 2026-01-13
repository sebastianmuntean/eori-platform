'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useTranslations } from 'next-intl';
import { Evaluation } from '@/hooks/useEvaluations';
import { useEmployees } from '@/hooks/useEmployees';
import { useUser } from '@/hooks/useUser';

interface EvaluationFormProps {
  evaluation?: Evaluation | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Evaluation>) => Promise<void>;
  isLoading?: boolean;
}

export function EvaluationForm({
  evaluation,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: EvaluationFormProps) {
  const t = useTranslations('common');
  const { employees, fetchEmployees } = useEmployees();
  const { user } = useUser();

  const [formData, setFormData] = useState<Partial<Evaluation>>({
    employeeId: '',
    evaluatorId: '',
    evaluationPeriodStart: '',
    evaluationPeriodEnd: '',
    evaluationDate: '',
    overallScore: null,
    overallComment: null,
    strengths: null,
    improvementAreas: null,
    status: 'draft',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load employees when form opens
  useEffect(() => {
    if (isOpen) {
      fetchEmployees({ pageSize: 1000 });
    }
  }, [isOpen, fetchEmployees]);

  // Set evaluatorId to current user when form opens (for new evaluations)
  useEffect(() => {
    if (isOpen && !evaluation && user?.id) {
      setFormData((prev) => ({ ...prev, evaluatorId: user.id }));
    }
  }, [isOpen, evaluation, user]);

  // Initialize form data when evaluation changes
  useEffect(() => {
    if (evaluation) {
      setFormData({
        employeeId: evaluation.employeeId,
        evaluatorId: evaluation.evaluatorId,
        evaluationPeriodStart: evaluation.evaluationPeriodStart,
        evaluationPeriodEnd: evaluation.evaluationPeriodEnd,
        evaluationDate: evaluation.evaluationDate,
        overallScore: evaluation.overallScore,
        overallComment: evaluation.overallComment,
        strengths: evaluation.strengths,
        improvementAreas: evaluation.improvementAreas,
        status: evaluation.status,
      });
    } else {
      setFormData({
        employeeId: '',
        evaluatorId: user?.id || '',
        evaluationPeriodStart: '',
        evaluationPeriodEnd: '',
        evaluationDate: '',
        overallScore: null,
        overallComment: null,
        strengths: null,
        improvementAreas: null,
        status: 'draft',
      });
    }
    setErrors({});
  }, [evaluation, isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.employeeId) {
      newErrors.employeeId = t('employeeRequired') || 'Employee is required';
    }
    if (!formData.evaluatorId) {
      newErrors.evaluatorId = t('evaluatorRequired') || 'Evaluator is required';
    }
    if (!formData.evaluationPeriodStart) {
      newErrors.evaluationPeriodStart = t('evaluationPeriodStartRequired') || 'Evaluation period start is required';
    }
    if (!formData.evaluationPeriodEnd) {
      newErrors.evaluationPeriodEnd = t('evaluationPeriodEndRequired') || 'Evaluation period end is required';
    }
    if (!formData.evaluationDate) {
      newErrors.evaluationDate = t('evaluationDateRequired') || 'Evaluation date is required';
    }
    if (formData.evaluationPeriodStart && formData.evaluationPeriodEnd && formData.evaluationPeriodEnd < formData.evaluationPeriodStart) {
      newErrors.evaluationPeriodEnd = t('evaluationPeriodEndMustBeAfterStart') || 'Evaluation period end must be after start';
    }
    if (formData.overallScore && (parseFloat(formData.overallScore) < 0 || parseFloat(formData.overallScore) > 100)) {
      newErrors.overallScore = t('overallScoreInvalid') || 'Overall score must be between 0 and 100';
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

  const handleChange = (field: keyof Evaluation, value: any) => {
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
    { value: 'draft', label: t('draft') || 'Draft' },
    { value: 'completed', label: t('completed') || 'Completed' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={evaluation ? t('editEvaluation') || 'Edit Evaluation' : t('addEvaluation') || 'Add Evaluation'}
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
            disabled={!!evaluation}
          />

          {/* Evaluator */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {t('evaluator') || 'Evaluator'}
            </label>
            <Input
              value={user?.name || user?.email || '-'}
              disabled
              className="bg-bg-secondary"
            />
            {errors.evaluatorId && (
              <p className="mt-1 text-sm text-danger">{errors.evaluatorId}</p>
            )}
          </div>

          {/* Evaluation Period Start */}
          <Input
            label={t('evaluationPeriodStart') || 'Evaluation Period Start'}
            type="date"
            value={formData.evaluationPeriodStart || ''}
            onChange={(e) => handleChange('evaluationPeriodStart', e.target.value)}
            error={errors.evaluationPeriodStart}
            required
          />

          {/* Evaluation Period End */}
          <Input
            label={t('evaluationPeriodEnd') || 'Evaluation Period End'}
            type="date"
            value={formData.evaluationPeriodEnd || ''}
            onChange={(e) => handleChange('evaluationPeriodEnd', e.target.value)}
            error={errors.evaluationPeriodEnd}
            required
          />

          {/* Evaluation Date */}
          <Input
            label={t('evaluationDate') || 'Evaluation Date'}
            type="date"
            value={formData.evaluationDate || ''}
            onChange={(e) => handleChange('evaluationDate', e.target.value)}
            error={errors.evaluationDate}
            required
          />

          {/* Overall Score */}
          <Input
            label={t('overallScore') || 'Overall Score'}
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.overallScore || ''}
            onChange={(e) => handleChange('overallScore', e.target.value)}
            error={errors.overallScore}
            placeholder="0.00 - 100.00"
          />

          {/* Status */}
          <Select
            label={t('status')}
            value={formData.status || 'draft'}
            onChange={(e) => handleChange('status', e.target.value)}
            options={statusOptions}
            error={errors.status}
          />
        </div>

        {/* Overall Comment */}
        <div>
          <Textarea
            label={t('overallComment') || 'Overall Comment'}
            value={formData.overallComment || ''}
            onChange={(e) => handleChange('overallComment', e.target.value)}
            error={errors.overallComment}
            rows={4}
            placeholder={t('overallCommentPlaceholder') || 'Enter overall evaluation comment...'}
          />
        </div>

        {/* Strengths */}
        <div>
          <Textarea
            label={t('strengths') || 'Strengths'}
            value={formData.strengths || ''}
            onChange={(e) => handleChange('strengths', e.target.value)}
            error={errors.strengths}
            rows={3}
            placeholder={t('strengthsPlaceholder') || 'Enter employee strengths...'}
          />
        </div>

        {/* Improvement Areas */}
        <div>
          <Textarea
            label={t('improvementAreas') || 'Improvement Areas'}
            value={formData.improvementAreas || ''}
            onChange={(e) => handleChange('improvementAreas', e.target.value)}
            error={errors.improvementAreas}
            rows={3}
            placeholder={t('improvementAreasPlaceholder') || 'Enter areas for improvement...'}
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
            {evaluation ? t('saveChanges') : t('create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

