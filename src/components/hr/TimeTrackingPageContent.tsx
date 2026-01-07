'use client';

import { useState, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TimeEntryForm } from '@/components/hr/TimeEntryForm';
import { TimeEntriesTable } from '@/components/hr/TimeEntriesTable';
import { useTimeEntries, TimeEntry } from '@/hooks/useTimeEntries';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { useHRBreadcrumbs } from '@/lib/hr/breadcrumbs';
import { showErrorToast } from '@/lib/utils/hr';

interface TimeTrackingPageContentProps {
  locale: string;
}

/**
 * Time Tracking page content component
 * Contains all the JSX/HTML and business logic
 * Separates presentation from routing and permission logic
 */
export function TimeTrackingPageContent({ locale }: TimeTrackingPageContentProps) {
  const t = useTranslations('common');
  const { showToast } = useToast();

  const { createTimeEntry, updateTimeEntry, deleteTimeEntry, approveTimeEntry, fetchTimeEntries } = useTimeEntries();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<TimeEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breadcrumbs = useHRBreadcrumbs(locale, t('timeEntries'));

  const handleAdd = useCallback(() => {
    setSelectedEntry(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((entry: TimeEntry) => {
    setSelectedEntry(entry);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((entry: TimeEntry) => {
    setEntryToDelete(entry);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleApprove = useCallback(
    async (entry: TimeEntry) => {
      setIsSubmitting(true);
      try {
        const success = await approveTimeEntry(entry.id);
        if (success) {
          showToast(t('timeEntryApproved') || 'Time entry approved successfully', 'success');
          await fetchTimeEntries({ page: 1, pageSize: 10 });
        } else {
          showToast(t('errorApprovingTimeEntry') || 'Error approving time entry', 'error');
        }
      } catch (error) {
        showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
      } finally {
        setIsSubmitting(false);
      }
    },
    [approveTimeEntry, fetchTimeEntries, showToast, t]
  );

  const handleFormSubmit = useCallback(
    async (data: Partial<TimeEntry>) => {
      setIsSubmitting(true);
      try {
        if (selectedEntry) {
          await updateTimeEntry(selectedEntry.id, data);
          showToast(t('timeEntryUpdated') || 'Time entry updated successfully', 'success');
        } else {
          await createTimeEntry(data);
          showToast(t('timeEntryCreated') || 'Time entry created successfully', 'success');
        }
        setIsFormOpen(false);
        setSelectedEntry(null);
        await fetchTimeEntries({ page: 1, pageSize: 10 });
      } catch (error) {
        showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedEntry, updateTimeEntry, createTimeEntry, fetchTimeEntries, showToast, t]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!entryToDelete) return;

    setIsSubmitting(true);
    try {
      const success = await deleteTimeEntry(entryToDelete.id);
      if (success) {
        showToast(t('timeEntryDeleted') || 'Time entry deleted successfully', 'success');
        setIsDeleteDialogOpen(false);
        setEntryToDelete(null);
        await fetchTimeEntries({ page: 1, pageSize: 10 });
      } else {
        showToast(t('errorDeletingTimeEntry') || 'Error deleting time entry', 'error');
      }
    } catch (error) {
      showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
    } finally {
      setIsSubmitting(false);
    }
  }, [entryToDelete, deleteTimeEntry, fetchTimeEntries, showToast, t]);

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setSelectedEntry(null);
  }, []);

  const handleDeleteDialogClose = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setEntryToDelete(null);
  }, []);

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('timeEntries')}
        action={<Button onClick={handleAdd}>{t('addTimeEntry') || 'Add Time Entry'}</Button>}
      />

      <TimeEntriesTable onEdit={handleEdit} onDelete={handleDelete} onApprove={handleApprove} />

      <TimeEntryForm
        timeEntry={selectedEntry}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleConfirmDelete}
        title={t('deleteTimeEntry') || 'Delete Time Entry'}
        message={
          entryToDelete
            ? `${t('confirmDeleteTimeEntry') || 'Are you sure you want to delete time entry for'} ${new Date(entryToDelete.entryDate).toLocaleDateString()}?`
            : t('confirmDelete') || 'Are you sure you want to delete this time entry?'
        }
        confirmLabel={t('delete') || 'Delete'}
        cancelLabel={t('cancel') || 'Cancel'}
        variant="danger"
        isLoading={isSubmitting}
      />
    </PageContainer>
  );
}

