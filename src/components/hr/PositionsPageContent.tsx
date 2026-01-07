'use client';

import { useState, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PositionForm } from '@/components/hr/PositionForm';
import { PositionsTable } from '@/components/hr/PositionsTable';
import { usePositions, Position } from '@/hooks/usePositions';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { useHRBreadcrumbs } from '@/lib/hr/breadcrumbs';
import { showErrorToast } from '@/lib/utils/hr';

interface PositionsPageContentProps {
  locale: string;
}

/**
 * Positions page content component
 * Contains all the JSX/HTML and business logic
 * Separates presentation from routing and permission logic
 */
export function PositionsPageContent({ locale }: PositionsPageContentProps) {
  const t = useTranslations('common');
  const { showToast } = useToast();

  const { createPosition, updatePosition, deletePosition } = usePositions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers for form actions
  const handleAdd = useCallback(() => {
    setSelectedPosition(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((position: Position) => {
    setSelectedPosition(position);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((position: Position) => {
    setPositionToDelete(position);
    setIsDeleteDialogOpen(true);
  }, []);

  // Handler to close form and reset state
  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setSelectedPosition(null);
  }, []);

  // Handler to close delete dialog and reset state
  const handleDeleteDialogClose = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setPositionToDelete(null);
  }, []);

  const breadcrumbs = useHRBreadcrumbs(locale, t('positions'));

  // Handler for form submission (create or update)
  const handleFormSubmit = useCallback(
    async (data: Partial<Position>) => {
      setIsSubmitting(true);
      try {
        if (selectedPosition) {
          await updatePosition(selectedPosition.id, data);
          showToast(t('positionUpdated') || 'Position updated successfully', 'success');
        } else {
          await createPosition(data);
          showToast(t('positionCreated') || 'Position created successfully', 'success');
        }
        handleFormClose();
      } catch (error) {
        showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedPosition, updatePosition, createPosition, showToast, t, handleFormClose]
  );

  // Handler for delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (!positionToDelete) return;

    setIsSubmitting(true);
    try {
      const success = await deletePosition(positionToDelete.id);
      if (success) {
        showToast(t('positionDeleted') || 'Position deleted successfully', 'success');
        handleDeleteDialogClose();
      } else {
        showToast(t('errorDeletingPosition') || 'Error deleting position', 'error');
      }
    } catch (error) {
      showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
    } finally {
      setIsSubmitting(false);
    }
  }, [positionToDelete, deletePosition, showToast, t, handleDeleteDialogClose]);

  // Delete confirmation message
  const deleteMessage = useMemo(() => {
    if (positionToDelete) {
      return `${t('confirmDeletePosition') || 'Are you sure you want to delete'} ${positionToDelete.title}?`;
    }
    return t('confirmDelete') || 'Are you sure you want to delete this position?';
  }, [positionToDelete, t]);

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('positions')}
        action={<Button onClick={handleAdd}>{t('addPosition') || 'Add Position'}</Button>}
      />

      <PositionsTable onEdit={handleEdit} onDelete={handleDelete} />

      <PositionForm
        position={selectedPosition}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleConfirmDelete}
        title={t('deletePosition') || 'Delete Position'}
        message={deleteMessage}
        confirmLabel={t('delete') || 'Delete'}
        cancelLabel={t('cancel') || 'Cancel'}
        variant="danger"
        isLoading={isSubmitting}
      />
    </PageContainer>
  );
}

