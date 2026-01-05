'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { useParishionerTypes, ParishionerType } from '@/hooks/useParishionerTypes';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PARISHIONERS_PERMISSIONS } from '@/lib/permissions/parishioners';

export default function ParishionerTypesPage() {
  const { loading: permissionLoading } = useRequirePermission(PARISHIONERS_PERMISSIONS.TYPES_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('parishionerTypes'));

  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const {
    types,
    loading,
    error,
    fetchTypes,
    createType,
    updateType,
    deleteType,
  } = useParishionerTypes();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ParishionerType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    fetchTypes({ all: true });
  }, [fetchTypes]);

  const handleCreate = async () => {
    if (!formData.name) {
      alert(t('fillRequiredFields') || 'Please fill all required fields');
      return;
    }

    const result = await createType(formData);
    if (result) {
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!selectedType) return;

    const result = await updateType(selectedType.id, formData);
    if (result) {
      setShowEditModal(false);
      setSelectedType(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirmDelete') || 'Are you sure you want to delete this type?')) {
      await deleteType(id);
    }
  };

  const handleEdit = (type: ParishionerType) => {
    setSelectedType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      isActive: type.isActive,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
    });
  };

  const columns = [
    { key: 'name', label: t('name'), sortable: true },
    { key: 'description', label: t('description'), sortable: false },
    {
      key: 'isActive',
      label: t('status'),
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? t('active') : t('inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: t('actions'),
      sortable: false,
      render: (_: any, row: ParishionerType) => (
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
            { label: t('delete'), onClick: () => handleDelete(row.id), variant: 'danger' },
          ]}
          align="right"
        />
      ),
    },
  ];

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('parishioners') || 'Parishioners', href: `/${locale}/dashboard/parishioners` },
    { label: t('parishionerTypes') || 'Parishioner Types' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('parishionerTypes') || 'Parishioner Types'}</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          {t('add')} {t('type') || 'Type'}
        </Button>
      </div>

      <Card>
        <CardBody>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div>{t('loading') || 'Loading...'}</div>
          ) : (
            <Table data={types} columns={columns} />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={`${t('add')} ${t('type') || 'Type'}`}
      >
        <div className="space-y-4">
          <Input
            label={`${t('name')} *`}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-1">{t('description')}</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              {t('active')}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCreate}>{t('create')}</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedType(null);
        }}
        title={`${t('edit')} ${t('type') || 'Type'}`}
      >
        <div className="space-y-4">
          <Input
            label={`${t('name')} *`}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-1">{t('description')}</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              {t('active')}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedType(null); }}>
              {t('cancel')}
            </Button>
            <Button onClick={handleUpdate}>{t('save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


