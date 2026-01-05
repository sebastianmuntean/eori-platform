'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TimeEntryForm } from '@/components/hr/TimeEntryForm';
import { TimeEntriesTable } from '@/components/hr/TimeEntriesTable';
import { useTimeEntries, TimeEntry } from '@/hooks/useTimeEntries';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { HR_PERMISSIONS } from '@/lib/permissions/hr';

export default function TimeTrackingPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(t('timeEntries'));
  const { showToast } = useToast();

  // Check permission to view time entries
  const { loading } = useRequirePermission(HR_PERMISSIONS.TIME_ENTRIES_VIEW);

  // All hooks must be called before any conditional returns
  const { createTimeEntry, updateTimeEntry, deleteTimeEntry, approveTimeEntry, fetchTimeEntries } = useTimeEntries();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<TimeEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Don't render content while checking permissions (after all hooks are called)
  if (loading) {
    return null;
  }

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: tMenu('hr') || 'Resurse Umane', href: `/${locale}/dashboard/hr` },
    { label: t('timeEntries') },
  ];

  const handleAdd = () => {
    setSelectedEntry(null);
    setIsFormOpen(true);
  };

  const handleEdit = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setIsFormOpen(true);
  };

  const handleDelete = (entry: TimeEntry) => {
    setEntryToDelete(entry);
    setIsDeleteDialogOpen(true);
  };

  const handleApprove = async (entry: TimeEntry) => {
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
      showToast(
        error instanceof Error ? error.message : t('errorOccurred') || 'An error occurred',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (data: Partial<TimeEntry>) => {
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
      showToast(
        error instanceof Error ? error.message : t('errorOccurred') || 'An error occurred',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
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
      showToast(
        error instanceof Error ? error.message : t('errorOccurred') || 'An error occurred',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('timeEntries')}</h1>
        </div>
        <Button onClick={handleAdd}>{t('addTimeEntry') || 'Add Time Entry'}</Button>
      </div>

      <TimeEntriesTable onEdit={handleEdit} onDelete={handleDelete} onApprove={handleApprove} />

      <TimeEntryForm
        timeEntry={selectedEntry}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedEntry(null);
        }}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setEntryToDelete(null);
        }}
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
    </div>
  );
}


