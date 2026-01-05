'use client';

import { useParams } from 'next/navigation';
import { useState, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ContractForm } from '@/components/hr/ContractForm';
import { ContractsTable } from '@/components/hr/ContractsTable';
import { useEmploymentContracts, EmploymentContract } from '@/hooks/useEmploymentContracts';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { HR_PERMISSIONS } from '@/lib/permissions/hr';

export default function ContractsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(t('employmentContracts'));
  const { showToast } = useToast();

  // Check permission to view contracts
  const { loading } = useRequirePermission(HR_PERMISSIONS.CONTRACTS_VIEW);

  // All hooks must be called before any conditional returns
  const { createContract, updateContract, deleteContract, renewContract, terminateContract } = useEmploymentContracts();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<EmploymentContract | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<EmploymentContract | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breadcrumbs = useMemo(
    () => [
      { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
      { label: tMenu('hr') || 'Resurse Umane', href: `/${locale}/dashboard/hr` },
      { label: t('employmentContracts') },
    ],
    [t, tMenu, locale]
  );

  // Handlers for form actions
  const handleAdd = useCallback(() => {
    setSelectedContract(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((contract: EmploymentContract) => {
    setSelectedContract(contract);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((contract: EmploymentContract) => {
    setContractToDelete(contract);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleRenew = useCallback(
    (contract: EmploymentContract) => {
      // TODO: Implement renew functionality
      showToast(t('renewContract') || 'Renew contract functionality', 'info');
    },
    [showToast, t]
  );

  const handleTerminate = useCallback(
    (contract: EmploymentContract) => {
      // TODO: Implement terminate functionality
      showToast(t('terminateContract') || 'Terminate contract functionality', 'info');
    },
    [showToast, t]
  );

  // Handler to close form and reset state
  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setSelectedContract(null);
  }, []);

  // Handler to close delete dialog and reset state
  const handleDeleteDialogClose = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setContractToDelete(null);
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
    async (data: Partial<EmploymentContract>) => {
      setIsSubmitting(true);
      try {
        if (selectedContract) {
          await updateContract(selectedContract.id, data);
          showToast(t('contractUpdated') || 'Contract updated successfully', 'success');
        } else {
          await createContract(data);
          showToast(t('contractCreated') || 'Contract created successfully', 'success');
        }
        handleFormClose();
      } catch (error) {
        showErrorToast(error, t('errorOccurred') || 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedContract, updateContract, createContract, showToast, t, handleFormClose, showErrorToast]
  );

  // Handler for delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (!contractToDelete) return;

    setIsSubmitting(true);
    try {
      const success = await deleteContract(contractToDelete.id);
      if (success) {
        showToast(t('contractDeleted') || 'Contract deleted successfully', 'success');
        handleDeleteDialogClose();
      } else {
        showToast(t('errorDeletingContract') || 'Error deleting contract', 'error');
      }
    } catch (error) {
      showErrorToast(error, t('errorOccurred') || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [contractToDelete, deleteContract, showToast, t, handleDeleteDialogClose, showErrorToast]);

  // Delete confirmation message
  const deleteMessage = useMemo(() => {
    if (contractToDelete) {
      return `${t('confirmDeleteContract') || 'Are you sure you want to delete'} ${contractToDelete.contractNumber}?`;
    }
    return t('confirmDelete') || 'Are you sure you want to delete this contract?';
  }, [contractToDelete, t]);

  // Don't render content while checking permissions (after all hooks are called)
  if (loading) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('employmentContracts')}</h1>
        </div>
        <Button onClick={handleAdd}>{t('addContract') || 'Add Contract'}</Button>
      </div>

      <ContractsTable onEdit={handleEdit} onDelete={handleDelete} onRenew={handleRenew} onTerminate={handleTerminate} />

      <ContractForm
        contract={selectedContract}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleConfirmDelete}
        title={t('deleteContract') || 'Delete Contract'}
        message={deleteMessage}
        confirmLabel={t('delete') || 'Delete'}
        cancelLabel={t('cancel') || 'Cancel'}
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}


