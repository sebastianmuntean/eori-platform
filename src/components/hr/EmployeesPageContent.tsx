'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmployeeForm } from '@/components/hr/EmployeeForm';
import { EmployeesTable } from '@/components/hr/EmployeesTable';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { useTranslations } from 'next-intl';
import { useHRBreadcrumbs } from '@/lib/hr/breadcrumbs';
import { useHRCrudOperations } from '@/hooks/useHRCrudOperations';

interface EmployeesPageContentProps {
  locale: string;
}

/**
 * Employees page content component
 * Contains all the JSX/HTML and business logic
 * Separates presentation from routing and permission logic
 */
export function EmployeesPageContent({ locale }: EmployeesPageContentProps) {
  const t = useTranslations('common');

  const { createEmployee, updateEmployee, deleteEmployee } = useEmployees();

  const breadcrumbs = useHRBreadcrumbs(locale, t('employees'));

  // Use reusable CRUD operations hook
  const {
    isFormOpen,
    selectedEntity: selectedEmployee,
    isDeleteDialogOpen,
    entityToDelete: employeeToDelete,
    isSubmitting,
    handleAdd,
    handleEdit,
    handleDelete,
    handleFormClose,
    handleDeleteDialogClose,
    handleFormSubmit,
    handleConfirmDelete,
    deleteMessage,
  } = useHRCrudOperations<Employee>({
    createEntity: createEmployee,
    updateEntity: updateEmployee,
    deleteEntity: deleteEmployee,
    entityName: 'Employee',
    entityNamePlural: 'Employees',
    getDeleteMessage: (employee) =>
      `${t('confirmDeleteEmployee') || 'Are you sure you want to delete'} ${employee.firstName} ${employee.lastName}?`,
  });

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('employees')}
        action={<Button onClick={handleAdd}>{t('addEmployee')}</Button>}
      />

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
    </PageContainer>
  );
}

