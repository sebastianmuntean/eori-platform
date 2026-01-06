import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { useTranslations } from 'next-intl';

interface UseCatechesisCRUDOptions<T> {
  createFn?: (data: Partial<T>) => Promise<T | null>;
  updateFn?: (id: string, data: Partial<T>) => Promise<T | null>;
  deleteFn?: (id: string) => Promise<boolean>;
  refreshFn: () => void;
  successMessages: {
    created?: string;
    updated?: string;
    deleted?: string;
  };
  errorMessages: {
    fillRequired?: string;
    occurred?: string;
  };
}

/**
 * Hook for common CRUD operations in catechesis pages
 */
export function useCatechesisCRUD<T>({
  createFn,
  updateFn,
  deleteFn,
  refreshFn,
  successMessages,
  errorMessages,
}: UseCatechesisCRUDOptions<T>) {
  const { success, error: showError } = useToast();
  const t = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = useCallback(async (data: Partial<T>): Promise<boolean> => {
    if (!createFn) return false;

    setIsSubmitting(true);
    try {
      const result = await createFn(data);
      if (result) {
        success(successMessages.created || t('created') || 'Item created successfully');
        refreshFn();
        return true;
      }
      return false;
    } catch (err) {
      showError(
        err instanceof Error ? err.message : errorMessages.occurred || t('errorOccurred') || 'An error occurred'
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [createFn, success, showError, refreshFn, successMessages.created, errorMessages.occurred, t]);

  const handleUpdate = useCallback(async (id: string, data: Partial<T>): Promise<boolean> => {
    if (!updateFn) return false;

    setIsSubmitting(true);
    try {
      const result = await updateFn(id, data);
      if (result) {
        success(successMessages.updated || t('updated') || 'Item updated successfully');
        refreshFn();
        return true;
      }
      return false;
    } catch (err) {
      showError(
        err instanceof Error ? err.message : errorMessages.occurred || t('errorOccurred') || 'An error occurred'
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [updateFn, success, showError, refreshFn, successMessages.updated, errorMessages.occurred, t]);

  const handleDelete = useCallback(async (id: string): Promise<boolean> => {
    if (!deleteFn) return false;

    setIsSubmitting(true);
    try {
      const result = await deleteFn(id);
      if (result) {
        success(successMessages.deleted || t('deleted') || 'Item deleted successfully');
        refreshFn();
        return true;
      }
      return false;
    } catch (err) {
      showError(
        err instanceof Error ? err.message : errorMessages.occurred || t('errorOccurred') || 'An error occurred'
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteFn, success, showError, refreshFn, successMessages.deleted, errorMessages.occurred, t]);

  const validateRequired = useCallback((fields: Record<string, any>, requiredFields: string[]): boolean => {
    const missing = requiredFields.filter(field => {
      const value = fields[field];
      return !value || (typeof value === 'string' && !value.trim());
    });

    if (missing.length > 0) {
      showError(errorMessages.fillRequired || t('fillRequiredFields') || 'Please fill in all required fields');
      return false;
    }
    return true;
  }, [showError, errorMessages.fillRequired, t]);

  return {
    isSubmitting,
    handleCreate,
    handleUpdate,
    handleDelete,
    validateRequired,
  };
}

