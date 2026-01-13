'use client';

import { useState, useRef } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { EmployeeForm } from '@/components/hr/EmployeeForm';
import { EmployeesTable } from '@/components/hr/EmployeesTable';
import { useEmployees, Employee, ImportResult } from '@/hooks/useEmployees';
import { useTranslations } from 'next-intl';
import { useHRBreadcrumbs } from '@/lib/hr/breadcrumbs';
import { useHRCrudOperations } from '@/hooks/useHRCrudOperations';
import { useToast } from '@/hooks/useToast';

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
  const { showToast } = useToast();

  const { createEmployee, updateEmployee, deleteEmployee, importEmployees, downloadTemplate, loading } = useEmployees();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

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

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate();
      showToast(t('downloadTemplate') || 'Template downloaded', 'success');
    } catch (error) {
      showToast(t('templateDownloadError') || 'Failed to download template', 'error');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      const result = await importEmployees(importFile);
      if (result) {
        setImportResult(result);
        setShowImportModal(true);
        setImportFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (result.failed === 0) {
          showToast(t('employeeImportSuccess') || 'Import completed successfully', 'success');
        } else {
          showToast(
            `${t('employeeImportSuccess') || 'Import completed'} - ${result.successful} ${t('importedSuccessfully') || 'imported'}, ${result.failed} ${t('failed') || 'failed'}`,
            'warning'
          );
        }
      }
    } catch (error) {
      showToast(t('employeeImportFailed') || 'Import failed', 'error');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('employees')}
        action={
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImportFile(file);
                  setImportResult(null);
                }
              }}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              disabled={loading}
            >
              {t('downloadEmployeeTemplate') || 'Descarcă Template'}
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              {t('importFromExcel') || 'Importă din Excel'}
            </Button>
            {importFile && (
              <>
                <span className="text-sm text-text-secondary px-2">
                  {importFile.name}
                </span>
                <Button
                  onClick={handleImport}
                  disabled={loading}
                  isLoading={loading}
                >
                  {t('import') || 'Importă'}
                </Button>
              </>
            )}
            <Button onClick={handleAdd}>{t('addEmployee')}</Button>
          </div>
        }
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

      {/* Import Results Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportResult(null);
        }}
        title={t('importResults') || 'Rezultate Import'}
        size="lg"
      >
        {importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-bg-secondary rounded-lg">
                <div className="text-sm text-text-secondary">{t('totalRowsProcessed') || 'Total procesate'}</div>
                <div className="text-2xl font-bold text-text-primary">{importResult.total}</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-text-secondary">{t('importedSuccessfully') || 'Importate cu succes'}</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{importResult.successful}</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-sm text-text-secondary">{t('failed') || 'Eșuate'}</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{importResult.failed}</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <h3 className="font-semibold text-text-primary mb-2">{t('viewErrors') || 'Vezi erorile'}</h3>
                <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-bg-secondary sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">{t('row') || 'Rând'}</th>
                        <th className="px-4 py-2 text-left">{t('employeeNumber') || 'Număr Angajat'}</th>
                        <th className="px-4 py-2 text-left">{t('error') || 'Eroare'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.errors.map((error, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="px-4 py-2">{error.row}</td>
                          <td className="px-4 py-2">{error.employeeNumber}</td>
                          <td className="px-4 py-2 text-red-600 dark:text-red-400">{error.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                }}
              >
                {t('close') || 'Închide'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}

