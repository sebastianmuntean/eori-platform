'use client';

import { useParams } from 'next/navigation';
import { useState, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SalaryForm } from '@/components/hr/SalaryForm';
import { SalariesTable } from '@/components/hr/SalariesTable';
import { useSalaries, Salary } from '@/hooks/useSalaries';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { HR_PERMISSIONS } from '@/lib/permissions/hr';
import { useHRBreadcrumbs } from '@/lib/hr/breadcrumbs';
import { showErrorToast } from '@/lib/utils/hr';

export default function SalariesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle(t('salaries'));
  const { showToast } = useToast();

  // Check permission to view salaries
  const { loading } = useRequirePermission(HR_PERMISSIONS.SALARIES_VIEW);

  // All hooks must be called before any conditional returns
  const { createSalary, updateSalary, deleteSalary, approveSalary, paySalary } = useSalaries();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [salaryToDelete, setSalaryToDelete] = useState<Salary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers for form actions
  const handleAdd = useCallback(() => {
    setSelectedSalary(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((salary: Salary) => {
    setSelectedSalary(salary);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((salary: Salary) => {
    setSalaryToDelete(salary);
    setIsDeleteDialogOpen(true);
  }, []);

  // Handler to close form and reset state
  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setSelectedSalary(null);
  }, []);

  // Handler to close delete dialog and reset state
  const handleDeleteDialogClose = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSalaryToDelete(null);
  }, []);

  const breadcrumbs = useHRBreadcrumbs(locale, t('salaries'));

  // Handler for approve action
  const handleApprove = useCallback(
    async (salary: Salary) => {
      setIsSubmitting(true);
      try {
        const success = await approveSalary(salary.id);
        if (success) {
          showToast(t('salaryApproved') || 'Salary approved successfully', 'success');
        } else {
          showToast(t('errorApprovingSalary') || 'Error approving salary', 'error');
        }
      } catch (error) {
        showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
      } finally {
        setIsSubmitting(false);
      }
    },
    [approveSalary, showToast, t]
  );

  // Handler for pay action
  const handlePay = useCallback(
    async (salary: Salary) => {
      setIsSubmitting(true);
      try {
        const success = await paySalary(salary.id);
        if (success) {
          showToast(t('salaryPaid') || 'Salary marked as paid successfully', 'success');
        } else {
          showToast(t('errorPayingSalary') || 'Error paying salary', 'error');
        }
      } catch (error) {
        showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
      } finally {
        setIsSubmitting(false);
      }
    },
    [paySalary, showToast, t]
  );

  // Handler for form submission (create or update)
  const handleFormSubmit = useCallback(
    async (data: Partial<Salary>) => {
      setIsSubmitting(true);
      try {
        if (selectedSalary) {
          await updateSalary(selectedSalary.id, data);
          showToast(t('salaryUpdated') || 'Salary updated successfully', 'success');
        } else {
          await createSalary(data);
          showToast(t('salaryCreated') || 'Salary created successfully', 'success');
        }
        handleFormClose();
      } catch (error) {
        showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedSalary, updateSalary, createSalary, showToast, t, handleFormClose]
  );

  // Handler for delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (!salaryToDelete) return;

    setIsSubmitting(true);
    try {
      const success = await deleteSalary(salaryToDelete.id);
      if (success) {
        showToast(t('salaryDeleted') || 'Salary deleted successfully', 'success');
        handleDeleteDialogClose();
      } else {
        showToast(t('errorDeletingSalary') || 'Error deleting salary', 'error');
      }
    } catch (error) {
      showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
    } finally {
      setIsSubmitting(false);
    }
  }, [salaryToDelete, deleteSalary, showToast, t, handleDeleteDialogClose]);

  // Delete confirmation message
  const deleteMessage = useMemo(() => {
    if (salaryToDelete) {
      return `${t('confirmDeleteSalary') || 'Are you sure you want to delete salary for period'} ${salaryToDelete.salaryPeriod}?`;
    }
    return t('confirmDelete') || 'Are you sure you want to delete this salary?';
  }, [salaryToDelete, t]);

  // Don't render content while checking permissions (after all hooks are called)
  if (loading) {
    return null;
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('salaries')}
        action={<Button onClick={handleAdd}>{t('addSalary') || 'Add Salary'}</Button>}
      />

      <SalariesTable
        onEdit={handleEdit}
        onDelete={handleDelete}
        onApprove={handleApprove}
        onPay={handlePay}
      />

      <SalaryForm
        salary={selectedSalary}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleConfirmDelete}
        title={t('deleteSalary') || 'Delete Salary'}
        message={deleteMessage}
        confirmLabel={t('delete') || 'Delete'}
        cancelLabel={t('cancel') || 'Cancel'}
        variant="danger"
        isLoading={isSubmitting}
      />
    </PageContainer>
  );
}


