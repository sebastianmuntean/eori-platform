'use client';

import { useParams } from 'next/navigation';
import { useState, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmployeeForm } from '@/components/hr/EmployeeForm';
import { EmployeesTable } from '@/components/hr/EmployeesTable';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { HR_PERMISSIONS } from '@/lib/permissions/hr';

export default function EmployeesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(t('employees'));
  const { showToast } = useToast();

  // Check permission to view employees
  const { loading } = useRequirePermission(HR_PERMISSIONS.EMPLOYEES_VIEW);

  // All hooks must be called before any conditional returns
  const { createEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breadcrumbs = useMemo(
    () => [
      { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
      { label: tMenu('hr') || 'Resurse Umane', href: `/${locale}/dashboard/hr` },
      { label: t('employees') },
    ],
    [t, tMenu, locale]
  );

  // Handlers for form actions
  const handleAdd = useCallback(() => {
    setSelectedEmployee(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((employee: Employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  }, []);

  // Handler to close form and reset state
  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setSelectedEmployee(null);
  }, []);

  // Handler to close delete dialog and reset state
  const handleDeleteDialogClose = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setEmployeeToDelete(null);
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
    async (data: Partial<Employee>) => {
      setIsSubmitting(true);
      try {
        if (selectedEmployee) {
          await updateEmployee(selectedEmployee.id, data);
          showToast(t('employeeUpdated') || 'Employee updated successfully', 'success');
        } else {
          await createEmployee(data);
          showToast(t('employeeCreated') || 'Employee created successfully', 'success');
        }
        handleFormClose();
      } catch (error) {
        showErrorToast(error, t('errorOccurred') || 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedEmployee, updateEmployee, createEmployee, showToast, t, handleFormClose, showErrorToast]
  );

  // Handler for delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (!employeeToDelete) return;

    setIsSubmitting(true);
    try {
      const success = await deleteEmployee(employeeToDelete.id);
      if (success) {
        showToast(t('employeeDeleted') || 'Employee deleted successfully', 'success');
        handleDeleteDialogClose();
      } else {
        showToast(t('errorDeletingEmployee') || 'Error deleting employee', 'error');
      }
    } catch (error) {
      showErrorToast(error, t('errorOccurred') || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [employeeToDelete, deleteEmployee, showToast, t, handleDeleteDialogClose, showErrorToast]);

  // Delete confirmation message
  const deleteMessage = useMemo(() => {
    if (employeeToDelete) {
      return `${t('confirmDeleteEmployee') || 'Are you sure you want to delete'} ${employeeToDelete.firstName} ${employeeToDelete.lastName}?`;
    }
    return t('confirmDelete') || 'Are you sure you want to delete this employee?';
  }, [employeeToDelete, t]);

  // Don't render content while checking permissions (after all hooks are called)
  if (loading) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('employees')}</h1>
        </div>
        <Button onClick={handleAdd}>{t('addEmployee')}</Button>
      </div>

      <EmployeesTable onEdit={handleEdit} onDelete={handleDelete} />

      <EmployeeForm
        employee={selectedEmployee}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleConfirmDelete}
        title={t('deleteEmployee') || 'Delete Employee'}
        message={deleteMessage}
        confirmLabel={t('delete') || 'Delete'}
        cancelLabel={t('cancel') || 'Cancel'}
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}

