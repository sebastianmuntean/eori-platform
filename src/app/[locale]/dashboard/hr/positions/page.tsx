'use client';

import { useParams } from 'next/navigation';
import { useState, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PositionForm } from '@/components/hr/PositionForm';
import { PositionsTable } from '@/components/hr/PositionsTable';
import { usePositions, Position } from '@/hooks/usePositions';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { HR_PERMISSIONS } from '@/lib/permissions/hr';

export default function PositionsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(t('positions'));
  const { showToast } = useToast();

  // Check permission to view positions
  const { loading } = useRequirePermission(HR_PERMISSIONS.POSITIONS_VIEW);

  // All hooks must be called before any conditional returns
  const { createPosition, updatePosition, deletePosition } = usePositions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breadcrumbs = useMemo(
    () => [
      { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
      { label: tMenu('hr') || 'Resurse Umane', href: `/${locale}/dashboard/hr` },
      { label: t('positions') },
    ],
    [t, tMenu, locale]
  );

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

  // Helper function to show error toast
  const showErrorToast = useCallback(
    (error: unknown, fallbackMessage: string) => {
      const message = error instanceof Error ? error.message : fallbackMessage;
      showToast(message, 'error');
    },
    [showToast]
  );

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
        showErrorToast(error, t('errorOccurred') || 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedPosition, updatePosition, createPosition, showToast, t, handleFormClose, showErrorToast]
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
      showErrorToast(error, t('errorOccurred') || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [positionToDelete, deletePosition, showToast, t, handleDeleteDialogClose, showErrorToast]);

  // Delete confirmation message
  const deleteMessage = useMemo(() => {
    if (positionToDelete) {
      return `${t('confirmDeletePosition') || 'Are you sure you want to delete'} ${positionToDelete.title}?`;
    }
    return t('confirmDelete') || 'Are you sure you want to delete this position?';
  }, [positionToDelete, t]);

  // Don't render content while checking permissions (after all hooks are called)
  if (loading) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('positions')}</h1>
        </div>
        <Button onClick={handleAdd}>{t('addPosition') || 'Add Position'}</Button>
      </div>

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
    </div>
  );
}


