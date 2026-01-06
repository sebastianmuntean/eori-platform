'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { ToastContainer } from '@/components/ui/Toast';
import { StudentAddModal, StudentFormData } from '@/components/catechesis/StudentAddModal';
import { StudentEditModal } from '@/components/catechesis/StudentEditModal';
import { DeleteStudentDialog } from '@/components/catechesis/DeleteStudentDialog';
import { StudentsFiltersCard } from '@/components/catechesis/StudentsFiltersCard';
import { StudentsTableCard } from '@/components/catechesis/StudentsTableCard';
import { useCatechesisStudents, CatechesisStudent } from '@/hooks/useCatechesisStudents';
import { useTranslations } from 'next-intl';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CATECHESIS_PERMISSIONS } from '@/lib/permissions/catechesis';

const PAGE_SIZE = 10;

export default function CatechesisStudentsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');
  usePageTitle(tCatechesis('students.title'));
  const { toasts, success, error: showError, removeToast } = useToast();

  // Check permission to view students
  const { loading: permissionLoading } = useRequirePermission(CATECHESIS_PERMISSIONS.STUDENTS_VIEW);

  // All hooks must be called before any conditional returns
  const { students, loading, error, pagination, fetchStudents, createStudent, updateStudent, deleteStudent } = useCatechesisStudents();
  const { user } = useUser();

  const [searchTerm, setSearchTerm] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<CatechesisStudent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    parishId: user?.parishId || '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    address: '',
    notes: '',
    isActive: true,
  });

  // Fetch students when filters or page changes
  useEffect(() => {
    if (permissionLoading) return;
    const params: any = {
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: searchTerm || undefined,
      isActive: isActiveFilter !== '' ? isActiveFilter : undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    fetchStudents(params);
  }, [permissionLoading, currentPage, searchTerm, isActiveFilter, fetchStudents]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleIsActiveFilterChange = useCallback((value: boolean | '') => {
    setIsActiveFilter(value);
    setCurrentPage(1);
  }, []);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  // Reset form to empty state
  const resetForm = useCallback(() => {
    setFormData({
      parishId: user?.parishId || '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      address: '',
      notes: '',
      isActive: true,
    });
  }, [user?.parishId]);

  // Validate form data
  const validateForm = useCallback((): boolean => {
    if (!formData.parishId || !formData.firstName.trim() || !formData.lastName.trim()) {
      showError(t('fillRequiredFields') || 'Please fill in all required fields');
      return false;
    }
    return true;
  }, [formData, showError, t]);

  // Handle create student
  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await createStudent({
        ...formData,
        dateOfBirth: formData.dateOfBirth || null,
        parentName: formData.parentName || null,
        parentEmail: formData.parentEmail || null,
        parentPhone: formData.parentPhone || null,
        address: formData.address || null,
        notes: formData.notes || null,
      });

      if (result) {
        success(tCatechesis('students.created') || t('created') || 'Student created successfully');
        setShowAddModal(false);
        resetForm();
        // Refresh the list
        fetchStudents({
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: searchTerm || undefined,
          isActive: isActiveFilter !== '' ? isActiveFilter : undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : t('errorOccurred') || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, createStudent, success, showError, resetForm, fetchStudents, currentPage, searchTerm, isActiveFilter, t, tCatechesis]);

  // Handle update student
  const handleUpdate = useCallback(async () => {
    if (!selectedStudent || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await updateStudent(selectedStudent.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth || null,
        parentName: formData.parentName || null,
        parentEmail: formData.parentEmail || null,
        parentPhone: formData.parentPhone || null,
        address: formData.address || null,
        notes: formData.notes || null,
        isActive: formData.isActive,
      });

      if (result) {
        success(tCatechesis('students.updated') || t('updated') || 'Student updated successfully');
        setShowEditModal(false);
        setSelectedStudent(null);
        // Refresh the list
        fetchStudents({
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: searchTerm || undefined,
          isActive: isActiveFilter !== '' ? isActiveFilter : undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : t('errorOccurred') || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedStudent, formData, validateForm, updateStudent, success, showError, fetchStudents, currentPage, searchTerm, isActiveFilter, t, tCatechesis]);

  // Handle delete student
  const handleDelete = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      const result = await deleteStudent(id);
      if (result) {
        success(tCatechesis('students.deleted') || t('deleted') || 'Student deleted successfully');
        setDeleteConfirm(null);
        // Refresh the list
        fetchStudents({
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: searchTerm || undefined,
          isActive: isActiveFilter !== '' ? isActiveFilter : undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : t('errorOccurred') || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteStudent, success, showError, fetchStudents, currentPage, searchTerm, isActiveFilter, t, tCatechesis]);

  // Handle edit - populate form with student data
  const handleEdit = useCallback((student: CatechesisStudent) => {
    setSelectedStudent(student);
    setFormData({
      parishId: student.parishId,
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
      parentName: student.parentName || '',
      parentEmail: student.parentEmail || '',
      parentPhone: student.parentPhone || '',
      address: student.address || '',
      notes: student.notes || '',
      isActive: student.isActive,
    });
    setShowEditModal(true);
  }, []);

  // Format date for display
  const formatDate = useCallback((date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  }, [locale]);

  // Table columns configuration
  const columns = useMemo(
    () => [
      { key: 'firstName' as keyof CatechesisStudent, label: tCatechesis('students.firstName'), sortable: true },
      { key: 'lastName' as keyof CatechesisStudent, label: tCatechesis('students.lastName'), sortable: true },
      {
        key: 'dateOfBirth' as keyof CatechesisStudent,
        label: tCatechesis('students.dateOfBirth'),
        sortable: false,
        render: (value: string | null) => formatDate(value),
      },
      {
        key: 'parentName' as keyof CatechesisStudent,
        label: tCatechesis('students.parentName'),
        sortable: false,
        render: (value: string | null) => value || '-',
      },
      {
        key: 'isActive' as keyof CatechesisStudent,
        label: t('status'),
        sortable: false,
        render: (value: boolean) => (
          <Badge variant={value ? 'success' : 'secondary'}>
            {value ? tCatechesis('status.active') : tCatechesis('status.inactive')}
          </Badge>
        ),
      },
      {
        key: 'actions' as keyof CatechesisStudent,
        label: t('actions'),
        sortable: false,
        render: (_: any, row: CatechesisStudent) => (
          <Dropdown
            trigger={
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </Button>
            }
            items={[
              { label: t('edit') || 'Edit', onClick: () => handleEdit(row) },
              { label: t('delete') || 'Delete', onClick: () => setDeleteConfirm(row.id), variant: 'danger' as const },
            ]}
            align="right"
          />
        ),
      },
    ],
    [tCatechesis, t, formatDate, handleEdit]
  );

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tCatechesis('title'), href: `/${locale}/dashboard/catechesis` },
          { label: tCatechesis('students.title') },
        ]}
        title={tCatechesis('students.title')}
        description={tCatechesis('manageStudents')}
        action={
          <Button onClick={() => setShowAddModal(true)}>
            {tCatechesis('actions.create')} {tCatechesis('students.title')}
          </Button>
        }
      />

      {/* Filters */}
      <StudentsFiltersCard
        searchTerm={searchTerm}
        isActiveFilter={isActiveFilter}
        onSearchChange={handleSearchChange}
        onIsActiveFilterChange={handleIsActiveFilterChange}
      />

      {/* Table */}
      <StudentsTableCard
        data={students}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData')}
      />

      {/* Add Modal */}
      <StudentAddModal
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
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />

      {/* Edit Modal */}
      <StudentEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStudent(null);
        }}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedStudent(null);
        }}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation */}
      <DeleteStudentDialog
        isOpen={!!deleteConfirm}
        studentId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        isSubmitting={isSubmitting}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </PageContainer>
  );
}

