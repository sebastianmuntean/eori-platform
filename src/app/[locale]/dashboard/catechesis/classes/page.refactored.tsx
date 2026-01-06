'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { ToastContainer } from '@/components/ui/Toast';
import { ClassAddModal, ClassFormData } from '@/components/catechesis/ClassAddModal';
import { ClassEditModal } from '@/components/catechesis/ClassEditModal';
import { DeleteClassDialog } from '@/components/catechesis/DeleteClassDialog';
import { ClassesFiltersCard } from '@/components/catechesis/ClassesFiltersCard';
import { ClassesTableCard } from '@/components/catechesis/ClassesTableCard';
import { useCatechesisClasses, CatechesisClass } from '@/hooks/useCatechesisClasses';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CATECHESIS_PERMISSIONS } from '@/lib/permissions/catechesis';
import { useCatechesisPageHelpers } from '@/hooks/useCatechesisPageHelpers';
import { normalizeOptionalField, dateToInputValue, numberToString, stringToNumber, createModalCloseHandlers } from '@/utils/catechesisHelpers';

const PAGE_SIZE = 10;

export default function CatechesisClassesPage() {
  const { locale, t, tCatechesis, formatDate, buildBaseBreadcrumbs, buildFetchParams, createFilterChangeHandler } = useCatechesisPageHelpers();
  usePageTitle(tCatechesis('classes.title'));
  const { toasts, success, error: showError, removeToast } = useToast();

  // Check permission to view classes
  const { loading: permissionLoading } = useRequirePermission(CATECHESIS_PERMISSIONS.CLASSES_VIEW);

  // All hooks must be called before any conditional returns
  const { classes, loading, error, pagination, fetchClasses, createClass, updateClass, deleteClass } = useCatechesisClasses();
  const { parishes, fetchParishes } = useParishes();
  const { user } = useUser();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<CatechesisClass | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ClassFormData>({
    parishId: user?.parishId || '',
    name: '',
    description: '',
    grade: '',
    teacherId: '',
    startDate: '',
    endDate: '',
    maxStudents: '',
    isActive: true,
  });

  // Build fetch parameters - memoized to prevent unnecessary recalculations
  const fetchParams = useMemo(() => buildFetchParams(currentPage, PAGE_SIZE, {
    search: searchTerm || undefined,
    parishId: parishFilter || undefined,
    grade: gradeFilter || undefined,
    isActive: isActiveFilter !== '' ? isActiveFilter : undefined,
  }), [currentPage, searchTerm, parishFilter, gradeFilter, isActiveFilter, buildFetchParams]);

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
  }, [permissionLoading, fetchParishes]);

  useEffect(() => {
    if (permissionLoading) return;
    fetchClasses(fetchParams);
  }, [permissionLoading, fetchParams, fetchClasses]);

  // Filter change handlers using utility
  const handleSearchChange = useCallback(createFilterChangeHandler(setSearchTerm, setCurrentPage), [createFilterChangeHandler]);
  const handleParishFilterChange = useCallback(createFilterChangeHandler(setParishFilter, setCurrentPage), [createFilterChangeHandler]);
  const handleGradeFilterChange = useCallback(createFilterChangeHandler(setGradeFilter, setCurrentPage), [createFilterChangeHandler]);
  const handleIsActiveFilterChange = useCallback(createFilterChangeHandler(setIsActiveFilter, setCurrentPage), [createFilterChangeHandler]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

  // Refresh list with current filters
  const refreshList = useCallback(() => {
    fetchClasses(fetchParams);
  }, [fetchClasses, fetchParams]);

  const resetForm = useCallback(() => {
    setFormData({
      parishId: user?.parishId || '',
      name: '',
      description: '',
      grade: '',
      teacherId: '',
      startDate: '',
      endDate: '',
      maxStudents: '',
      isActive: true,
    });
  }, [user?.parishId]);

  const handleCreate = useCallback(async () => {
    if (!formData.parishId || !formData.name.trim()) {
      showError(t('fillRequiredFields') || 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createClass({
        ...formData,
        description: normalizeOptionalField(formData.description),
        grade: normalizeOptionalField(formData.grade),
        teacherId: normalizeOptionalField(formData.teacherId),
        startDate: normalizeOptionalField(formData.startDate),
        endDate: normalizeOptionalField(formData.endDate),
        maxStudents: stringToNumber(formData.maxStudents),
      });

      if (result) {
        success(tCatechesis('classes.created') || t('created') || 'Class created successfully');
        setShowAddModal(false);
        resetForm();
        refreshList();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : t('errorOccurred') || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, createClass, success, showError, resetForm, refreshList, t, tCatechesis]);

  const handleUpdate = useCallback(async () => {
    if (!selectedClass) return;

    if (!formData.name.trim()) {
      showError(t('fillRequiredFields') || 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateClass(selectedClass.id, {
        name: formData.name,
        description: normalizeOptionalField(formData.description),
        grade: normalizeOptionalField(formData.grade),
        teacherId: normalizeOptionalField(formData.teacherId),
        startDate: normalizeOptionalField(formData.startDate),
        endDate: normalizeOptionalField(formData.endDate),
        maxStudents: stringToNumber(formData.maxStudents),
        isActive: formData.isActive,
      });

      if (result) {
        success(tCatechesis('classes.updated') || t('updated') || 'Class updated successfully');
        setShowEditModal(false);
        setSelectedClass(null);
        refreshList();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : t('errorOccurred') || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedClass, formData, updateClass, success, showError, refreshList, t, tCatechesis]);

  const handleDelete = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      const result = await deleteClass(id);
      if (result) {
        success(tCatechesis('classes.deleted') || t('deleted') || 'Class deleted successfully');
        setDeleteConfirm(null);
        refreshList();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : t('errorOccurred') || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteClass, success, showError, refreshList, t, tCatechesis]);

  const handleEdit = useCallback((classItem: CatechesisClass) => {
    setSelectedClass(classItem);
    setFormData({
      parishId: classItem.parishId,
      name: classItem.name,
      description: classItem.description || '',
      grade: classItem.grade || '',
      teacherId: classItem.teacherId || '',
      startDate: dateToInputValue(classItem.startDate),
      endDate: dateToInputValue(classItem.endDate),
      maxStudents: numberToString(classItem.maxStudents),
      isActive: classItem.isActive,
    });
    setShowEditModal(true);
  }, []);

  const columns = useMemo(
    () => [
      { key: 'name', label: tCatechesis('classes.name'), sortable: true },
      { key: 'grade', label: tCatechesis('classes.grade'), sortable: false, render: (value: string | null) => value || '-' },
      {
        key: 'startDate',
        label: tCatechesis('classes.startDate'),
        sortable: false,
        render: (value: string | null) => formatDate(value),
      },
      {
        key: 'endDate',
        label: tCatechesis('classes.endDate'),
        sortable: false,
        render: (value: string | null) => formatDate(value),
      },
      {
        key: 'isActive',
        label: t('status'),
        sortable: false,
        render: (value: boolean) => (
          <Badge variant={value ? 'success' : 'secondary'}>
            {value ? tCatechesis('status.active') : tCatechesis('status.inactive')}
          </Badge>
        ),
      },
      {
        key: 'actions',
        label: t('actions'),
        sortable: false,
        render: (_: any, row: CatechesisClass) => (
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

  const baseBreadcrumbs = buildBaseBreadcrumbs();
  const addModalHandlers = createModalCloseHandlers(() => setShowAddModal(false), resetForm);
  const editModalHandlers = createModalCloseHandlers(() => {
    setShowEditModal(false);
    setSelectedClass(null);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          ...baseBreadcrumbs,
          { label: tCatechesis('classes.title') },
        ]}
        title={tCatechesis('classes.title')}
        description={tCatechesis('classes.description') || tCatechesis('manageClasses') || 'Manage catechesis classes'}
        action={
          <Button onClick={() => setShowAddModal(true)}>
            {tCatechesis('actions.create')} {tCatechesis('classes.title')}
          </Button>
        }
      />

      {/* Filters */}
      <ClassesFiltersCard
        searchTerm={searchTerm}
        parishFilter={parishFilter}
        gradeFilter={gradeFilter}
        isActiveFilter={isActiveFilter}
        parishes={parishes}
        onSearchChange={handleSearchChange}
        onParishFilterChange={handleParishFilterChange}
        onGradeFilterChange={handleGradeFilterChange}
        onIsActiveFilterChange={handleIsActiveFilterChange}
      />

      {/* Table */}
      <ClassesTableCard
        data={classes}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData')}
      />

      {/* Add Modal */}
      <ClassAddModal
        isOpen={showAddModal}
        {...addModalHandlers}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />

      {/* Edit Modal */}
      <ClassEditModal
        isOpen={showEditModal}
        {...editModalHandlers}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation */}
      <DeleteClassDialog
        isOpen={!!deleteConfirm}
        classId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        isSubmitting={isSubmitting}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

