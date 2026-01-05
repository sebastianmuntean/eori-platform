'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { FormModal } from '@/components/accounting/FormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ToastContainer } from '@/components/ui/Toast';
import { useCatechesisStudents, CatechesisStudent } from '@/hooks/useCatechesisStudents';
import { useTranslations } from 'next-intl';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CATECHESIS_PERMISSIONS } from '@/lib/permissions/catechesis';

interface StudentFormData {
  parishId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  address: string;
  notes: string;
  isActive: boolean;
}

const PAGE_SIZE = 10;

export default function CatechesisStudentsPage() {
  const params = useParams();
  const router = useRouter();
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

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
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
    ],
    [tCatechesis, t, formatDate]
  );

  // Breadcrumbs configuration
  const breadcrumbs = useMemo(
    () => [
      { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
      { label: tCatechesis('title'), href: `/${locale}/dashboard/catechesis` },
      { label: tCatechesis('students.title') },
    ],
    [t, tCatechesis, locale]
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{tCatechesis('students.title')}</h1>
          <p className="text-text-secondary mt-1">{tCatechesis('manageStudents')}</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          {tCatechesis('actions.create')} {tCatechesis('students.title')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <select
              value={isActiveFilter.toString()}
              onChange={(e) => {
                setIsActiveFilter(e.target.value === '' ? '' : e.target.value === 'true');
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-border rounded-md bg-bg-primary text-text-primary"
            >
              <option value="">All Status</option>
              <option value="true">{tCatechesis('status.active')}</option>
              <option value="false">{tCatechesis('status.inactive')}</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardBody>
          {loading && !students.length ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-text-secondary">{t('loading')}</div>
            </div>
          ) : error ? (
            <div className="p-4 bg-danger/10 text-danger rounded-md">{error}</div>
          ) : (
            <>
              <Table
                data={students}
                columns={columns}
                emptyMessage={t('noData')}
              />
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-text-secondary">
                    {t('page')} {pagination.page} {t('of')} {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      {t('previous')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage === pagination.totalPages}
                    >
                      {t('next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Add Modal */}
      <FormModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onCancel={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={`${tCatechesis('actions.create')} ${tCatechesis('students.title')}`}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        submitLabel={isSubmitting ? t('saving') || 'Saving...' : t('save') || 'Save'}
        cancelLabel={t('cancel')}
        size="full"
      >
        <div className="space-y-4">
          <Input
            label={tCatechesis('students.firstName')}
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
          <Input
            label={tCatechesis('students.lastName')}
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
          <Input
            label={tCatechesis('students.dateOfBirth')}
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
          <Input
            label={tCatechesis('students.parentName')}
            value={formData.parentName}
            onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
          />
          <Input
            label={tCatechesis('students.parentEmail')}
            type="email"
            value={formData.parentEmail}
            onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
          />
          <Input
            label={tCatechesis('students.parentPhone')}
            value={formData.parentPhone}
            onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
          />
          <Input
            label={tCatechesis('students.address')}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-sm text-text-primary">
              {tCatechesis('students.isActive')}
            </label>
          </div>
        </div>
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStudent(null);
        }}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedStudent(null);
        }}
        title={`${tCatechesis('actions.edit')} ${tCatechesis('students.title')}`}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        submitLabel={isSubmitting ? t('saving') || 'Saving...' : t('save') || 'Save'}
        cancelLabel={t('cancel')}
        size="full"
      >
        <div className="space-y-4">
          <Input
            label={tCatechesis('students.firstName')}
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
          <Input
            label={tCatechesis('students.lastName')}
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
          <Input
            label={tCatechesis('students.dateOfBirth')}
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
          <Input
            label={tCatechesis('students.parentName')}
            value={formData.parentName}
            onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
          />
          <Input
            label={tCatechesis('students.parentEmail')}
            type="email"
            value={formData.parentEmail}
            onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
          />
          <Input
            label={tCatechesis('students.parentPhone')}
            value={formData.parentPhone}
            onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
          />
          <Input
            label={tCatechesis('students.address')}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveEdit"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isActiveEdit" className="text-sm text-text-primary">
              {tCatechesis('students.isActive')}
            </label>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title={t('confirm') || 'Confirm Delete'}
        message={tCatechesis('students.confirmDelete') || t('confirmDelete') || 'Are you sure you want to delete this student?'}
        confirmLabel={isSubmitting ? t('deleting') || 'Deleting...' : t('delete') || 'Delete'}
        cancelLabel={t('cancel') || 'Cancel'}
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

