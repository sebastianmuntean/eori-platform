'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { FormModal } from '@/components/accounting/FormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Select } from '@/components/ui/Select';
import { useCatechesisClasses } from '@/hooks/useCatechesisClasses';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { useUser } from '@/hooks/useUser';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CATECHESIS_PERMISSIONS } from '@/lib/permissions/catechesis';

export default function CatechesisClassesPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');
  usePageTitle(tCatechesis('classes.title'));

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
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
  }, [permissionLoading, fetchParishes]);

  useEffect(() => {
    if (permissionLoading) return;
    const params: any = {
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      grade: gradeFilter || undefined,
      isActive: isActiveFilter !== '' ? isActiveFilter : undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    fetchClasses(params);
  }, [permissionLoading, currentPage, searchTerm, parishFilter, gradeFilter, isActiveFilter, fetchClasses]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

  const handleCreate = async () => {
    if (!formData.parishId || !formData.name) {
      alert(t('fillRequiredFields'));
      return;
    }

    const result = await createClass({
      ...formData,
      description: formData.description || null,
      grade: formData.grade || null,
      teacherId: formData.teacherId || null,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
    });

    if (result) {
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!selectedClass) return;

    const result = await updateClass(selectedClass.id, {
      name: formData.name,
      description: formData.description || null,
      grade: formData.grade || null,
      teacherId: formData.teacherId || null,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
      isActive: formData.isActive,
    });

    if (result) {
      setShowEditModal(false);
      setSelectedClass(null);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteClass(id);
    if (result) {
      setDeleteConfirm(null);
    }
  };

  const handleEdit = (classItem: any) => {
    setSelectedClass(classItem);
    setFormData({
      parishId: classItem.parishId,
      name: classItem.name,
      description: classItem.description || '',
      grade: classItem.grade || '',
      teacherId: classItem.teacherId || '',
      startDate: classItem.startDate ? new Date(classItem.startDate).toISOString().split('T')[0] : '',
      endDate: classItem.endDate ? new Date(classItem.endDate).toISOString().split('T')[0] : '',
      maxStudents: classItem.maxStudents?.toString() || '',
      isActive: classItem.isActive,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
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
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  };

  const columns = [
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
  ];

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: tCatechesis('title'), href: `/${locale}/dashboard/catechesis` },
    { label: tCatechesis('classes.title') },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{tCatechesis('classes.title')}</h1>
          <p className="text-text-secondary mt-1">Manage catechesis classes</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          {tCatechesis('actions.create')} {tCatechesis('classes.title')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Select
              value={parishFilter}
              onChange={(e) => {
                setParishFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: '', label: 'All Parishes' },
                ...parishes.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            <Select
              value={isActiveFilter.toString()}
              onChange={(e) => {
                setIsActiveFilter(e.target.value === '' ? '' : e.target.value === 'true');
                setCurrentPage(1);
              }}
              options={[
                { value: '', label: 'All Status' },
                { value: 'true', label: tCatechesis('status.active') },
                { value: 'false', label: tCatechesis('status.inactive') },
              ]}
            />
            <Input
              placeholder={tCatechesis('classes.grade')}
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardBody>
          {loading && !classes.length ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-text-secondary">{t('loading')}</div>
            </div>
          ) : error ? (
            <div className="p-4 bg-danger/10 text-danger rounded-md">{error}</div>
          ) : (
            <>
              <Table
                data={classes}
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
        title={`${tCatechesis('actions.create')} ${tCatechesis('classes.title')}`}
        onSubmit={handleCreate}
        isSubmitting={false}
        submitLabel={t('save')}
        cancelLabel={t('cancel')}
        size="full"
      >
        <div className="space-y-4">
          <Input
            label={tCatechesis('classes.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={tCatechesis('classes.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Input
            label={tCatechesis('classes.grade')}
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
          />
          <Input
            label={tCatechesis('classes.startDate')}
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
          <Input
            label={tCatechesis('classes.endDate')}
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
          <Input
            label={tCatechesis('classes.maxStudents')}
            type="number"
            value={formData.maxStudents}
            onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
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
              {tCatechesis('classes.isActive')}
            </label>
          </div>
        </div>
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedClass(null);
        }}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedClass(null);
        }}
        title={`${tCatechesis('actions.edit')} ${tCatechesis('classes.title')}`}
        onSubmit={handleUpdate}
        isSubmitting={false}
        submitLabel={t('save')}
        cancelLabel={t('cancel')}
        size="full"
      >
        <div className="space-y-4">
          <Input
            label={tCatechesis('classes.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={tCatechesis('classes.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Input
            label={tCatechesis('classes.grade')}
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
          />
          <Input
            label={tCatechesis('classes.startDate')}
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
          <Input
            label={tCatechesis('classes.endDate')}
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
          <Input
            label={tCatechesis('classes.maxStudents')}
            type="number"
            value={formData.maxStudents}
            onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
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
              {tCatechesis('classes.isActive')}
            </label>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title={t('confirm')}
        message="Are you sure you want to delete this class?"
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        variant="danger"
      />
    </div>
  );
}

