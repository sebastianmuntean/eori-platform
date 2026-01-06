'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { useCemeteries, Cemetery } from '@/hooks/useCemeteries';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CEMETERY_PERMISSIONS } from '@/lib/permissions/cemeteries';
import { CemeteryAddModal, CemeteryFormData } from '@/components/cemeteries/CemeteryAddModal';
import { CemeteryEditModal } from '@/components/cemeteries/CemeteryEditModal';
import { DeleteCemeteryDialog } from '@/components/cemeteries/DeleteCemeteryDialog';
import { CemeteriesFiltersCard } from '@/components/cemeteries/CemeteriesFiltersCard';
import { CemeteriesTableCard } from '@/components/cemeteries/CemeteriesTableCard';

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
  const [formData, setFormData] = useState<CemeteryFormData>({
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

  const columns = useMemo(() => [
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

  const handleCreate = async () => {
    const data: any = {
      ...formData,
      totalArea: formData.totalArea ? parseFloat(formData.totalArea) : null,
      totalPlots: formData.totalPlots ? parseInt(formData.totalPlots) : null,
    };

    const result = await createCemetery(data);
    if (result) {
      setShowAddModal(false);
      resetForm();
      fetchCemeteries({ page: currentPage, pageSize: PAGE_SIZE });
    }
  };

  const handleUpdate = async () => {
    if (!selectedCemetery) return;

    const data: any = {
      ...formData,
      totalArea: formData.totalArea ? parseFloat(formData.totalArea) : null,
      totalPlots: formData.totalPlots ? parseInt(formData.totalPlots) : null,
    };

    const result = await updateCemetery(selectedCemetery.id, data);
    if (result) {
      setShowEditModal(false);
      setSelectedCemetery(null);
      fetchCemeteries({ page: currentPage, pageSize: PAGE_SIZE });
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

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('cemeteries') || 'Cemeteries' },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('cemeteries') || 'Cemeteries'}
        action={<Button onClick={handleAdd}>{t('add')} {t('cemeteries') || 'Cemetery'}</Button>}
        className="mb-6"
      />

      <CemeteriesFiltersCard
        searchTerm={searchTerm}
        parishFilter={parishFilter}
        parishes={parishes}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        onParishFilterChange={setParishFilter}
      />

      <CemeteriesTableCard
        data={cemeteries}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData') || 'No cemeteries available'}
      />

      <CemeteryAddModal
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
        error={error}
      />

      <CemeteryEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCemetery(null);
        }}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedCemetery(null);
        }}
        formData={formData}
        onFormDataChange={setFormData}
        parishes={parishes}
        onSubmit={handleUpdate}
        isSubmitting={false}
        error={error}
      />

      <DeleteCemeteryDialog
        isOpen={!!deleteConfirm}
        cemeteryId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

