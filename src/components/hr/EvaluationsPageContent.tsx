'use client';

import { useState, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EvaluationForm } from '@/components/hr/EvaluationForm';
import { EvaluationsTable } from '@/components/hr/EvaluationsTable';
import { useEvaluations, Evaluation } from '@/hooks/useEvaluations';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { useHRBreadcrumbs } from '@/lib/hr/breadcrumbs';
import { showErrorToast } from '@/lib/utils/hr';

interface EvaluationsPageContentProps {
  locale: string;
}

/**
 * Evaluations page content component
 * Contains all the JSX/HTML and business logic
 * Separates presentation from routing and permission logic
 */
export function EvaluationsPageContent({ locale }: EvaluationsPageContentProps) {
  const t = useTranslations('common');
  const { showToast } = useToast();

  const { createEvaluation, updateEvaluation, deleteEvaluation, acknowledgeEvaluation, fetchEvaluations } = useEvaluations();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [evaluationToDelete, setEvaluationToDelete] = useState<Evaluation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breadcrumbs = useHRBreadcrumbs(locale, t('evaluations'));

  // Handlers for form actions
  const handleAdd = useCallback(() => {
    setSelectedEvaluation(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((evaluation: Evaluation) => {
    setEvaluationToDelete(evaluation);
    setIsDeleteDialogOpen(true);
  }, []);

  // Handler to close form and reset state
  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setSelectedEvaluation(null);
  }, []);

  // Handler to close delete dialog and reset state
  const handleDeleteDialogClose = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setEvaluationToDelete(null);
  }, []);

  // Handler for acknowledge action
  const handleAcknowledge = useCallback(
    async (evaluation: Evaluation) => {
      setIsSubmitting(true);
      try {
        const success = await acknowledgeEvaluation(evaluation.id);
        if (success) {
          showToast(t('evaluationAcknowledged') || 'Evaluation acknowledged successfully', 'success');
          await fetchEvaluations({ page: 1, pageSize: 10 });
        } else {
          showToast(t('errorAcknowledgingEvaluation') || 'Error acknowledging evaluation', 'error');
        }
      } catch (error) {
        showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
      } finally {
        setIsSubmitting(false);
      }
    },
    [acknowledgeEvaluation, fetchEvaluations, showToast, t]
  );

  // Handler for form submission (create or update)
  const handleFormSubmit = useCallback(
    async (data: Partial<Evaluation>) => {
      setIsSubmitting(true);
      try {
        if (selectedEvaluation) {
          await updateEvaluation(selectedEvaluation.id, data);
          showToast(t('evaluationUpdated') || 'Evaluation updated successfully', 'success');
        } else {
          await createEvaluation(data);
          showToast(t('evaluationCreated') || 'Evaluation created successfully', 'success');
        }
        handleFormClose();
        await fetchEvaluations({ page: 1, pageSize: 10 });
      } catch (error) {
        showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedEvaluation, updateEvaluation, createEvaluation, fetchEvaluations, showToast, t, handleFormClose]
  );

  // Handler for delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (!evaluationToDelete) return;

    setIsSubmitting(true);
    try {
      const success = await deleteEvaluation(evaluationToDelete.id);
      if (success) {
        showToast(t('evaluationDeleted') || 'Evaluation deleted successfully', 'success');
        handleDeleteDialogClose();
        await fetchEvaluations({ page: 1, pageSize: 10 });
      } else {
        showToast(t('errorDeletingEvaluation') || 'Error deleting evaluation', 'error');
      }
    } catch (error) {
      showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
    } finally {
      setIsSubmitting(false);
    }
  }, [evaluationToDelete, deleteEvaluation, fetchEvaluations, showToast, t, handleDeleteDialogClose]);

  // Delete confirmation message
  const deleteMessage = useMemo(() => {
    if (evaluationToDelete) {
      return `${t('confirmDeleteEvaluation') || 'Are you sure you want to delete evaluation for'} ${new Date(evaluationToDelete.evaluationDate).toLocaleDateString()}?`;
    }
    return t('confirmDelete') || 'Are you sure you want to delete this evaluation?';
  }, [evaluationToDelete, t]);

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('evaluations')}
        action={<Button onClick={handleAdd}>{t('addEvaluation') || 'Add Evaluation'}</Button>}
      />

      <EvaluationsTable
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAcknowledge={handleAcknowledge}
      />

      <EvaluationForm
        evaluation={selectedEvaluation}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleConfirmDelete}
        title={t('deleteEvaluation') || 'Delete Evaluation'}
        message={deleteMessage}
        confirmLabel={t('delete') || 'Delete'}
        cancelLabel={t('cancel') || 'Cancel'}
        variant="danger"
        isLoading={isSubmitting}
      />
    </PageContainer>
  );
}

