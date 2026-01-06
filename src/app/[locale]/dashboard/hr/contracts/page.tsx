'use client';

import { useParams } from 'next/navigation';
import { useState, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
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
import { useHRBreadcrumbs } from '@/lib/hr/breadcrumbs';
import { showErrorToast } from '@/lib/utils/hr';

export default function ContractsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
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

  const breadcrumbs = useHRBreadcrumbs(locale, t('employmentContracts'));

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
        showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedContract, updateContract, createContract, showToast, t, handleFormClose]
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
      showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
    } finally {
      setIsSubmitting(false);
    }
  }, [contractToDelete, deleteContract, showToast, t, handleDeleteDialogClose]);

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
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('employmentContracts')}
        action={<Button onClick={handleAdd}>{t('addContract') || 'Add Contract'}</Button>}
      />

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


