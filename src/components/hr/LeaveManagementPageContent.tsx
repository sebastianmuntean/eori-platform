'use client';

import { useState, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LeaveRequestForm } from '@/components/hr/LeaveRequestForm';
import { LeaveRequestsTable } from '@/components/hr/LeaveRequestsTable';
import { useLeaveRequests, LeaveRequest } from '@/hooks/useLeaveRequests';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { useHRBreadcrumbs } from '@/lib/hr/breadcrumbs';
import { showErrorToast } from '@/lib/utils/hr';

interface LeaveManagementPageContentProps {
  locale: string;
}

/**
 * Leave Management page content component
 * Contains all the JSX/HTML and business logic
 * Separates presentation from routing and permission logic
 */
export function LeaveManagementPageContent({ locale }: LeaveManagementPageContentProps) {
  const t = useTranslations('common');
  const { showToast } = useToast();

  const { createLeaveRequest, updateLeaveRequest, deleteLeaveRequest, approveLeaveRequest, rejectLeaveRequest, fetchLeaveRequests } = useLeaveRequests();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<LeaveRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breadcrumbs = useHRBreadcrumbs(locale, t('leaveRequests'));

  // Handlers for form actions
  const handleAdd = useCallback(() => {
    setSelectedRequest(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((request: LeaveRequest) => {
    setSelectedRequest(request);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((request: LeaveRequest) => {
    setRequestToDelete(request);
    setIsDeleteDialogOpen(true);
  }, []);

  // Handler to close form and reset state
  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setSelectedRequest(null);
  }, []);

  // Handler to close delete dialog and reset state
  const handleDeleteDialogClose = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setRequestToDelete(null);
  }, []);

  // Handler for approve action
  const handleApprove = useCallback(
    async (request: LeaveRequest) => {
      setIsSubmitting(true);
      try {
        const success = await approveLeaveRequest(request.id);
        if (success) {
          showToast(t('leaveRequestApproved') || 'Leave request approved successfully', 'success');
          await fetchLeaveRequests({ page: 1, pageSize: 10 });
        } else {
          showToast(t('errorApprovingLeaveRequest') || 'Error approving leave request', 'error');
        }
      } catch (error) {
        showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
      } finally {
        setIsSubmitting(false);
      }
    },
    [approveLeaveRequest, fetchLeaveRequests, showToast, t]
  );

  // Handler for reject action
  const handleReject = useCallback(
    async (request: LeaveRequest) => {
      setIsSubmitting(true);
      try {
        const success = await rejectLeaveRequest(request.id);
        if (success) {
          showToast(t('leaveRequestRejected') || 'Leave request rejected successfully', 'success');
          await fetchLeaveRequests({ page: 1, pageSize: 10 });
        } else {
          showToast(t('errorRejectingLeaveRequest') || 'Error rejecting leave request', 'error');
        }
      } catch (error) {
        showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
      } finally {
        setIsSubmitting(false);
      }
    },
    [rejectLeaveRequest, fetchLeaveRequests, showToast, t]
  );

  // Handler for form submission (create or update)
  const handleFormSubmit = useCallback(
    async (data: Partial<LeaveRequest>) => {
      setIsSubmitting(true);
      try {
        if (selectedRequest) {
          await updateLeaveRequest(selectedRequest.id, data);
          showToast(t('leaveRequestUpdated') || 'Leave request updated successfully', 'success');
        } else {
          await createLeaveRequest(data);
          showToast(t('leaveRequestCreated') || 'Leave request created successfully', 'success');
        }
        handleFormClose();
        await fetchLeaveRequests({ page: 1, pageSize: 10 });
      } catch (error) {
        showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedRequest, updateLeaveRequest, createLeaveRequest, fetchLeaveRequests, showToast, t, handleFormClose]
  );

  // Handler for delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (!requestToDelete) return;

    setIsSubmitting(true);
    try {
      const success = await deleteLeaveRequest(requestToDelete.id);
      if (success) {
        showToast(t('leaveRequestDeleted') || 'Leave request deleted successfully', 'success');
        handleDeleteDialogClose();
        await fetchLeaveRequests({ page: 1, pageSize: 10 });
      } else {
        showToast(t('errorDeletingLeaveRequest') || 'Error deleting leave request', 'error');
      }
    } catch (error) {
      showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
    } finally {
      setIsSubmitting(false);
    }
  }, [requestToDelete, deleteLeaveRequest, fetchLeaveRequests, showToast, t, handleDeleteDialogClose]);

  // Delete confirmation message
  const deleteMessage = useMemo(() => {
    if (requestToDelete) {
      return `${t('confirmDeleteLeaveRequest') || 'Are you sure you want to delete leave request for'} ${new Date(requestToDelete.startDate).toLocaleDateString()} - ${new Date(requestToDelete.endDate).toLocaleDateString()}?`;
    }
    return t('confirmDelete') || 'Are you sure you want to delete this leave request?';
  }, [requestToDelete, t]);

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('leaveRequests')}
        action={<Button onClick={handleAdd}>{t('addLeaveRequest') || 'Add Leave Request'}</Button>}
      />

      <LeaveRequestsTable
        onEdit={handleEdit}
        onDelete={handleDelete}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <LeaveRequestForm
        leaveRequest={selectedRequest}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleConfirmDelete}
        title={t('deleteLeaveRequest') || 'Delete Leave Request'}
        message={deleteMessage}
        confirmLabel={t('delete') || 'Delete'}
        cancelLabel={t('cancel') || 'Cancel'}
        variant="danger"
        isLoading={isSubmitting}
      />
    </PageContainer>
  );
}

