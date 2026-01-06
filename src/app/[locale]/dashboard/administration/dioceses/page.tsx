'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDioceses, Diocese } from '@/hooks/useDioceses';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';
import { TablePagination } from '@/components/ui/TablePagination';

// Form data type for diocese forms
interface DioceseFormData {
  code: string;
  name: string;
  address: string;
  city: string;
  county: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  bishopName: string;
  isActive: boolean;
}

// Initial form data factory function
const getInitialFormData = (): DioceseFormData => ({
  code: '',
  name: '',
  address: '',
  city: '',
  county: '',
  country: 'România',
  phone: '',
  email: '',
  website: '',
  bishopName: '',
  isActive: true,
});

export default function DiocesesPage() {
  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.DIOCESES_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('dioceses'));

  const {
    dioceses,
    loading,
    error,
    pagination,
    fetchDioceses,
    createDiocese,
    updateDiocese,
    deleteDiocese,
  } = useDioceses();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDiocese, setSelectedDiocese] = useState<Diocese | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<DioceseFormData>(getInitialFormData());

  // Fetch dioceses when filters change
  useEffect(() => {
    fetchDioceses({
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  }, [currentPage, searchTerm, fetchDioceses]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
  }, []);

  // Populate form from diocese data
  const populateFormFromDiocese = useCallback((diocese: Diocese) => {
    setFormData({
      code: diocese.code,
      name: diocese.name,
      address: diocese.address || '',
      city: diocese.city || '',
      county: diocese.county || '',
      country: diocese.country || 'România',
      phone: diocese.phone || '',
      email: diocese.email || '',
      website: diocese.website || '',
      bishopName: diocese.bishopName || '',
      isActive: diocese.isActive,
    });
  }, []);

  // Handlers
  const handleCreate = useCallback(async () => {
    if (!formData.code || !formData.name) {
      alert(t('fillRequiredFields') || 'Please fill all required fields');
      return;
    }

    const result = await createDiocese(formData);
    if (result) {
      setShowAddModal(false);
      resetForm();
    }
  }, [formData, createDiocese, resetForm, t]);

  const handleUpdate = useCallback(async () => {
    if (!selectedDiocese) return;

    const result = await updateDiocese(selectedDiocese.id, formData);
    if (result) {
      setShowEditModal(false);
      setSelectedDiocese(null);
      resetForm();
    }
  }, [selectedDiocese, formData, updateDiocese, resetForm]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteDiocese(id);
    if (result) {
      setDeleteConfirm(null);
    }
  }, [deleteDiocese]);

  const handleEdit = useCallback((diocese: Diocese) => {
    setSelectedDiocese(diocese);
    populateFormFromDiocese(diocese);
    setShowEditModal(true);
  }, [populateFormFromDiocese]);

  const handleAddModalClose = useCallback(() => {
    setShowAddModal(false);
    resetForm();
  }, [resetForm]);

  const handleEditModalClose = useCallback(() => {
    setShowEditModal(false);
    setSelectedDiocese(null);
    resetForm();
  }, [resetForm]);

  // Memoized columns definition with proper TypeScript typing
  const columns = useMemo<Column<Diocese>[]>(() => [
    {
      key: 'code' as keyof Diocese,
      label: t('code') || 'Code',
      sortable: true,
    },
    {
      key: 'name' as keyof Diocese,
      label: t('name') || 'Name',
      sortable: true,
    },
    {
      key: 'city' as keyof Diocese,
      label: t('city') || 'City',
      sortable: true,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'county' as keyof Diocese,
      label: t('county') || 'County',
      sortable: true,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'isActive' as keyof Diocese,
      label: t('status') || 'Status',
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? t('active') || 'Active' : t('inactive') || 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions' as keyof Diocese,
      label: t('actions') || 'Actions',
      sortable: false,
      render: (_: any, row: Diocese) => (
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
  ], [t, handleEdit]);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('administration') || 'Administration', href: `/${locale}/dashboard/administration` },
          { label: t('dioceses') || 'Dioceses' },
        ]}
        title={t('dioceses') || 'Dioceses'}
        action={
          <Button onClick={() => setShowAddModal(true)}>
            {t('add')} {t('diocese') || 'Diocese'}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Input
              placeholder={t('search') || 'Search dioceses...'}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardBody>
          {error && (
            <div className="mb-4 p-4 bg-danger/10 text-danger rounded-md">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-center py-8 text-text-secondary">{t('loading') || 'Loading...'}</div>
          ) : (
            <>
              <Table
                data={dioceses}
                columns={columns}
                emptyMessage={t('noData') || 'No dioceses available'}
              />
              {pagination && pagination.totalPages > 1 && (
                <TablePagination
                  pagination={pagination}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  loading={loading}
                  t={t}
                />
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Add Diocese Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleAddModalClose}
        title={`${t('add')} ${t('diocese') || 'Diocese'}`}
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          <Input
            label={`${t('code') || 'Code'} *`}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <Input
            label={`${t('name') || 'Name'} *`}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={t('address') || 'Address'}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Input
            label={t('city') || 'City'}
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <Input
            label={t('county') || 'County'}
            value={formData.county}
            onChange={(e) => setFormData({ ...formData, county: e.target.value })}
          />
          <Input
            label={t('country') || 'Country'}
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          />
          <Input
            label={t('phone') || 'Phone'}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label={t('email') || 'Email'}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label={t('website') || 'Website'}
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
          <Input
            label={t('bishopName') || 'Bishop Name'}
            value={formData.bishopName}
            onChange={(e) => setFormData({ ...formData, bishopName: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleAddModalClose}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCreate}>{t('create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Diocese Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleEditModalClose}
        title={`${t('edit')} ${t('diocese') || 'Diocese'}`}
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          <Input
            label={`${t('code') || 'Code'} *`}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <Input
            label={`${t('name') || 'Name'} *`}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={t('address') || 'Address'}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Input
            label={t('city') || 'City'}
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <Input
            label={t('county') || 'County'}
            value={formData.county}
            onChange={(e) => setFormData({ ...formData, county: e.target.value })}
          />
          <Input
            label={t('country') || 'Country'}
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          />
          <Input
            label={t('phone') || 'Phone'}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label={t('email') || 'Email'}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label={t('website') || 'Website'}
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
          <Input
            label={t('bishopName') || 'Bishop Name'}
            value={formData.bishopName}
            onChange={(e) => setFormData({ ...formData, bishopName: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-sm">{t('active') || 'Active'}</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleEditModalClose}>
              {t('cancel')}
            </Button>
            <Button onClick={handleUpdate}>{t('save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title={t('confirmDelete')}
        message={t('confirmDeleteDiocese') || t('confirmDeleteMessage') || 'Are you sure you want to delete this diocese?'}
        variant="danger"
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
      />
    </PageContainer>
  );
}

