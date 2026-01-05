'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { FormModal } from '@/components/accounting/FormModal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useCemeteries, Cemetery } from '@/hooks/useCemeteries';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, ParishFilter } from '@/components/ui/FilterGrid';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CEMETERY_PERMISSIONS } from '@/lib/permissions/cemeteries';

const PAGE_SIZE = 10;

export default function CemeteriesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('cemeteries'));

  // Check permission to view cemeteries
  const { loading: permissionLoading } = useRequirePermission(CEMETERY_PERMISSIONS.CEMETERIES_READ);

  // All hooks must be called before any conditional returns
  const {
    cemeteries,
    loading,
    error,
    pagination,
    fetchCemeteries,
    createCemetery,
    updateCemetery,
    deleteCemetery,
  } = useCemeteries();

  const { parishes, fetchParishes } = useParishes();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCemetery, setSelectedCemetery] = useState<Cemetery | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    parishId: '',
    code: '',
    name: '',
    address: '',
    city: '',
    county: '',
    totalArea: '',
    totalPlots: '',
    notes: '',
    isActive: true,
  });

  // All useEffect hooks must be called before any conditional returns
  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
  }, [permissionLoading, fetchParishes]);

  useEffect(() => {
    if (permissionLoading) return;
    fetchCemeteries({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  }, [permissionLoading, currentPage, searchTerm, parishFilter, fetchCemeteries]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (cemetery: Cemetery) => {
    setSelectedCemetery(cemetery);
    setFormData({
      parishId: cemetery.parishId,
      code: cemetery.code,
      name: cemetery.name,
      address: cemetery.address || '',
      city: cemetery.city || '',
      county: cemetery.county || '',
      totalArea: cemetery.totalArea || '',
      totalPlots: cemetery.totalPlots?.toString() || '',
      notes: cemetery.notes || '',
      isActive: cemetery.isActive,
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    const data: any = {
      ...formData,
      totalArea: formData.totalArea ? parseFloat(formData.totalArea) : null,
      totalPlots: formData.totalPlots ? parseInt(formData.totalPlots) : null,
    };

    if (selectedCemetery) {
      const result = await updateCemetery(selectedCemetery.id, data);
      if (result) {
        setShowEditModal(false);
        setSelectedCemetery(null);
        fetchCemeteries({ page: currentPage, pageSize: PAGE_SIZE });
      }
    } else {
      const result = await createCemetery(data);
      if (result) {
        setShowAddModal(false);
        resetForm();
        fetchCemeteries({ page: currentPage, pageSize: PAGE_SIZE });
      }
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteCemetery(id);
    if (success) {
      setDeleteConfirm(null);
      fetchCemeteries({ page: currentPage, pageSize: PAGE_SIZE });
    }
  };

  const resetForm = () => {
    setFormData({
      parishId: '',
      code: '',
      name: '',
      address: '',
      city: '',
      county: '',
      totalArea: '',
      totalPlots: '',
      notes: '',
      isActive: true,
    });
    setSelectedCemetery(null);
  };

  const columns: any[] = [
    { key: 'code', label: t('code') || 'Code', sortable: true },
    { key: 'name', label: t('name') || 'Name', sortable: true },
    { key: 'city', label: t('city') || 'City', sortable: true },
    { key: 'county', label: t('county') || 'County', sortable: true },
    {
      key: 'isActive',
      label: t('status') || 'Status',
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? t('active') : t('inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: t('actions') || 'Actions',
      sortable: false,
      render: (_: any, row: Cemetery) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
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
  ];

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('cemeteries') || 'Cemeteries' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('cemeteries') || 'Cemeteries'}</h1>
        </div>
        <Button onClick={handleAdd}>{t('add')} {t('cemeteries') || 'Cemetery'}</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <SearchInput
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              placeholder={`${t('search')} ${t('cemeteries') || 'cemeteries'}...`}
            />
            <FilterGrid>
              <ParishFilter
                parishes={parishes}
                value={parishFilter}
                onChange={setParishFilter}
              />
            </FilterGrid>
          </div>
        </CardHeader>
        <CardBody>
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger rounded text-danger text-sm">
              {error}
            </div>
          )}
          <Table
            columns={columns}
            data={cemeteries}
            loading={loading}
            pagination={pagination}
            onPageChange={setCurrentPage}
          />
        </CardBody>
      </Card>

      <FormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCancel={() => setShowAddModal(false)}
        title={`${t('add')} ${t('cemeteries') || 'Cemetery'}`}
        onSubmit={handleSave}
        isSubmitting={false}
        submitLabel={t('create') || 'Create'}
        cancelLabel={t('cancel') || 'Cancel'}
        error={error}
      >
        <div className="space-y-4">
            <Select
              label={t('parish') || 'Parish'}
              value={formData.parishId}
              onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
              options={parishes.map((parish) => ({ value: parish.id, label: parish.name }))}
              placeholder={t('select') || 'Select...'}
            />
            <Input
              label={t('code') || 'Code'}
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Input
              label={t('name') || 'Name'}
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
              label={t('totalArea') || 'Total Area'}
              type="number"
              value={formData.totalArea}
              onChange={(e) => setFormData({ ...formData, totalArea: e.target.value })}
            />
            <Input
              label={t('totalPlots') || 'Total Plots'}
              type="number"
              value={formData.totalPlots}
              onChange={(e) => setFormData({ ...formData, totalPlots: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium mb-1">{t('notes') || 'Notes'}</label>
              <textarea
                className="w-full px-4 py-2 border rounded-md"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
        </div>
      </FormModal>

      <FormModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedCemetery(null); }}
        onCancel={() => { setShowEditModal(false); setSelectedCemetery(null); }}
        title={`${t('edit')} ${t('cemeteries') || 'Cemetery'}`}
        onSubmit={handleSave}
        isSubmitting={false}
        submitLabel={t('update') || 'Update'}
        cancelLabel={t('cancel') || 'Cancel'}
        error={error}
      >
        <div className="space-y-4">
            <Input
              label={t('code') || 'Code'}
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Input
              label={t('name') || 'Name'}
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
              label={t('totalArea') || 'Total Area'}
              type="number"
              value={formData.totalArea}
              onChange={(e) => setFormData({ ...formData, totalArea: e.target.value })}
            />
            <Input
              label={t('totalPlots') || 'Total Plots'}
              type="number"
              value={formData.totalPlots}
              onChange={(e) => setFormData({ ...formData, totalPlots: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium mb-1">{t('notes') || 'Notes'}</label>
              <textarea
                className="w-full px-4 py-2 border rounded-md"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title={t('confirmDelete')}
        message={t('confirmDeleteCemetery') || 'Are you sure you want to delete this cemetery?'}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        variant="danger"
      />
    </div>
  );
}

