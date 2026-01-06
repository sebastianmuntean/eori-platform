'use client';

import { useState, useCallback } from 'react';

export interface UseFormSubmissionOptions<TFormData, TEntity> {
  validateForm: (formData: TFormData, ...args: any[]) => Record<string, string>;
  onSubmit: (formData: TFormData, entityId?: string) => Promise<TEntity | null>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  validationArgs?: any[];
}

export interface UseFormSubmissionReturn<TFormData> {
  formErrors: Record<string, string>;
  isSubmitting: boolean;
  handleSubmit: (formData: TFormData, entityId?: string) => Promise<boolean>;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
}

/**
 * Reusable hook for form submission logic
 * Handles validation, submission state, and error management
 */
export function useFormSubmission<TFormData, TEntity extends { id: string }>({
  validateForm,
  onSubmit,
  onSuccess,
  onError,
  validationArgs = [],
}: UseFormSubmissionOptions<TFormData, TEntity>): UseFormSubmissionReturn<TFormData> {
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = useCallback((field: string) => {
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFormErrors({});
  }, []);

  const handleSubmit = useCallback(
    async (formData: TFormData, entityId?: string): Promise<boolean> => {
      clearAllErrors();
      
      // Validate form
      const errors = validateForm(formData, ...validationArgs);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return false;
      }

      setIsSubmitting(true);
      try {
        const result = await onSubmit(formData, entityId);
        if (result) {
          onSuccess?.();
          return true;
        } else {
          onError?.('Submission failed');
          return false;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        onError?.(errorMessage);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateForm, onSubmit, onSuccess, onError, validationArgs, clearAllErrors]
  );

  return {
    formErrors,
    isSubmitting,
    handleSubmit,
    clearError,
    clearAllErrors,
  };
}







