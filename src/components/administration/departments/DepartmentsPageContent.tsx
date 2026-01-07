'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { ToastContainer } from '@/components/ui/Toast';
import { DepartmentAddModal, DepartmentFormData } from '@/components/administration/DepartmentAddModal';
import { DepartmentEditModal } from '@/components/administration/DepartmentEditModal';
import { DeleteDepartmentDialog } from '@/components/administration/DeleteDepartmentDialog';
import { DepartmentsFiltersCard } from '@/components/administration/DepartmentsFiltersCard';
import { DepartmentsTableCard } from '@/components/administration/DepartmentsTableCard';
import { useDepartments, Department } from '@/hooks/useDepartments';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';

interface DepartmentsPageContentProps {
  locale: string;
}

/**
 * Departments page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function DepartmentsPageContent({ locale }: DepartmentsPageContentProps) {
  const t = useTranslations('common');
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();

  const {
    departments,
    loading,
    error,
    pagination,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  } = useDepartments();

  const { parishes, fetchParishes } = useParishes();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>({
    parishId: '',
    code: '',
    name: '',
    description: '',
    headName: '',
    phone: '',
    email: '',
    isActive: true,
  });

  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  useEffect(() => {
    fetchDepartments({
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      isActive: statusFilter === '' ? undefined : statusFilter === 'true',
      sortBy: 'name',
      sortOrder: 'asc',
    });
  }, [currentPage, searchTerm, parishFilter, statusFilter, fetchDepartments]);

  const getInitialFormData = useCallback((): DepartmentFormData => ({
    parishId: '',
    code: '',
    name: '',
    description: '',
    headName: '',
    phone: '',
    email: '',
    isActive: true,
  }), []);

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
  }, [getInitialFormData]);

  const handleCreate = async () => {
    if (!formData.parishId || !formData.code || !formData.name) {
      showError(t('fillRequiredFields') || 'Please fill all required fields');
      return;
    }

    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError(t('invalidEmail') || 'Invalid email format');
      return;
    }

    const result = await createDepartment({
      ...formData,
      description: formData.description || null,
      headName: formData.headName || null,
      phone: formData.phone || null,
      email: formData.email || null,
    });

    if (result) {
      setShowAddModal(false);
      resetForm();
      showSuccess(t('departmentCreated') || 'Department created successfully');
    } else {
      showError(t('departmentCreationFailed') || 'Failed to create department');
    }
  };

  const handleUpdate = async () => {
    if (!selectedDepartment) return;

    if (!formData.parishId || !formData.code || !formData.name) {
      showError(t('fillRequiredFields') || 'Please fill all required fields');
      return;
    }

    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError(t('invalidEmail') || 'Invalid email format');
      return;
    }

    const result = await updateDepartment(selectedDepartment.id, {
      ...formData,
      description: formData.description || null,
      headName: formData.headName || null,
      phone: formData.phone || null,
      email: formData.email || null,
    });

    if (result) {
      setShowEditModal(false);
      setSelectedDepartment(null);
      showSuccess(t('departmentUpdated') || 'Department updated successfully');
    } else {
      showError(t('departmentUpdateFailed') || 'Failed to update department');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteDepartment(id);
    if (result) {
      setDeleteConfirm(null);
      showSuccess(t('departmentDeleted') || 'Department deleted successfully');
    } else {
      showError(t('departmentDeletionFailed') || 'Failed to delete department');
    }
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      parishId: department.parishId,
      code: department.code,
      name: department.name,
      description: department.description || '',
      headName: department.headName || '',
      phone: department.phone || '',
      email: department.email || '',
      isActive: department.isActive,
    });
    setShowEditModal(true);
  };

  // Get parish name for display
  const getParishName = useCallback((parishId: string) => {
    const parish = parishes.find((p) => p.id === parishId);
    return parish ? parish.name : parishId;
  }, [parishes]);

  const columns = useMemo(() => [
    { key: 'code' as keyof Department, label: t('code'), sortable: true },
    { key: 'name' as keyof Department, label: t('name'), sortable: true },
    {
      key: 'parishId' as keyof Department,
      label: t('parish'),
      sortable: false,
      render: (value: string) => getParishName(value),
    },
    {
      key: 'headName' as keyof Department,
      label: t('headName'),
      sortable: false,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'phone' as keyof Department,
      label: t('phone'),
      sortable: false,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'isActive' as keyof Department,
      label: t('status'),
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? t('active') : t('inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions' as keyof Department,
      label: t('actions'),
      sortable: false,
      render: (_: any, row: Department) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          }
          items={[
            { label: t('edit'), onClick: () => handleEdit(row) },
            { label: t('delete'), onClick: () => setDeleteConfirm(row.id), variant: 'danger' },
          ]}
          align="right"
        />
      ),
    },
  ], [t, getParishName]);

  return (
    <PageContainer>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('breadcrumbAdministration'), href: `/${locale}/dashboard/administration` },
          { label: t('departamente') || 'Departments' },
        ]}
        title={t('departamente') || 'Departments'}
        action={<Button onClick={() => setShowAddModal(true)}>{t('add')} {t('departamente')}</Button>}
      />

      {/* Filters */}
      <DepartmentsFiltersCard
        searchTerm={searchTerm}
        parishFilter={parishFilter}
        statusFilter={statusFilter}
        parishes={parishes}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        onParishFilterChange={(value) => {
          setParishFilter(value);
          setCurrentPage(1);
        }}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setCurrentPage(1);
        }}
        onClear={() => {
          setSearchTerm('');
          setParishFilter('');
          setStatusFilter('');
          setCurrentPage(1);
        }}
      />

      {/* Departments Table */}
      <DepartmentsTableCard
        data={departments}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData') || 'No departments available'}
      />

      {/* Add Modal */}
      <DepartmentAddModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onCancel={() => {
          setShowAddModal(false);
          resetForm();
        }}
        formData={formData}
        onFormDataChange={setFormData}
        parishes={parishes}
        onSubmit={handleCreate}
        isSubmitting={false}
      />

      {/* Edit Modal */}
      <DepartmentEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDepartment(null);
        }}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedDepartment(null);
        }}
        formData={formData}
        onFormDataChange={setFormData}
        parishes={parishes}
        onSubmit={handleUpdate}
        isSubmitting={false}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDepartmentDialog
        isOpen={!!deleteConfirm}
        departmentId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}

