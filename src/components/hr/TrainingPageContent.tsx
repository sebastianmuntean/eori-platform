'use client';

import { useState, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TrainingCourseForm } from '@/components/hr/TrainingCourseForm';
import { TrainingCoursesTable } from '@/components/hr/TrainingCoursesTable';
import { TrainingCourse, useTrainingCourses } from '@/hooks/useTrainingCourses';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { useHRBreadcrumbs } from '@/lib/hr/breadcrumbs';
import { showErrorToast } from '@/lib/utils/hr';

interface TrainingPageContentProps {
  locale: string;
}

/**
 * Training page content component
 * Contains all the JSX/HTML and business logic
 * Separates presentation from routing and permission logic
 */
export function TrainingPageContent({ locale }: TrainingPageContentProps) {
  const t = useTranslations('common');
  const { showToast } = useToast();

  const { createTrainingCourse, updateTrainingCourse, deleteTrainingCourse, fetchTrainingCourses } = useTrainingCourses();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<TrainingCourse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breadcrumbs = useHRBreadcrumbs(locale, t('training'));

  // Handlers for form actions
  const handleAdd = useCallback(() => {
    setSelectedCourse(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((course: TrainingCourse) => {
    setSelectedCourse(course);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((course: TrainingCourse) => {
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  }, []);

  // Handler to close form and reset state
  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setSelectedCourse(null);
  }, []);

  // Handler to close delete dialog and reset state
  const handleDeleteDialogClose = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setCourseToDelete(null);
  }, []);

  // Handler for form submission (create or update)
  const handleFormSubmit = useCallback(
    async (data: Partial<TrainingCourse>) => {
      setIsSubmitting(true);
      try {
        if (selectedCourse) {
          await updateTrainingCourse(selectedCourse.id, data);
          showToast(t('trainingCourseUpdated') || 'Training course updated successfully', 'success');
        } else {
          await createTrainingCourse(data);
          showToast(t('trainingCourseCreated') || 'Training course created successfully', 'success');
        }
        handleFormClose();
        await fetchTrainingCourses({ page: 1, pageSize: 10 });
      } catch (error) {
        showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedCourse, updateTrainingCourse, createTrainingCourse, fetchTrainingCourses, showToast, t, handleFormClose]
  );

  // Handler for delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (!courseToDelete) return;

    setIsSubmitting(true);
    try {
      const success = await deleteTrainingCourse(courseToDelete.id);
      if (success) {
        showToast(t('trainingCourseDeleted') || 'Training course deleted successfully', 'success');
        handleDeleteDialogClose();
        await fetchTrainingCourses({ page: 1, pageSize: 10 });
      } else {
        showToast(t('errorDeletingTrainingCourse') || 'Error deleting training course', 'error');
      }
    } catch (error) {
      showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
    } finally {
      setIsSubmitting(false);
    }
  }, [courseToDelete, deleteTrainingCourse, fetchTrainingCourses, showToast, t, handleDeleteDialogClose]);

  // Delete confirmation message
  const deleteMessage = useMemo(() => {
    if (courseToDelete) {
      return `${t('confirmDeleteTrainingCourse') || 'Are you sure you want to delete training course'} "${courseToDelete.name}"?`;
    }
    return t('confirmDelete') || 'Are you sure you want to delete this training course?';
  }, [courseToDelete, t]);

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('training')}
        action={<Button onClick={handleAdd}>{t('addTrainingCourse') || 'Add Training Course'}</Button>}
      />

      <TrainingCoursesTable
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TrainingCourseForm
        course={selectedCourse}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleConfirmDelete}
        title={t('deleteTrainingCourse') || 'Delete Training Course'}
        message={deleteMessage}
        confirmLabel={t('delete') || 'Delete'}
        cancelLabel={t('cancel') || 'Cancel'}
        variant="danger"
        isLoading={isSubmitting}
      />
    </PageContainer>
  );
}

