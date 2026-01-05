'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useRoles } from '@/hooks/useRoles';
import { useTable } from '@/hooks/useTable';
import { Badge } from '@/components/ui/Badge';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useParams } from 'next/navigation';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { SUPERADMIN_PERMISSIONS } from '@/lib/permissions/superadmin';

export default function RolesPage() {
  const { loading: permissionLoading } = useRequirePermission(SUPERADMIN_PERMISSIONS.ROLES_VIEW);
  console.log('Step 1: Rendering Roles page');

  const params = useParams();
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('roles'));
  const { roles, loading, error, createRole, updateRole, deleteRole } = useRoles();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<typeof roles[0] | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const {
    data: tableData,
    page,
    pageSize,
    totalPages,
    sortConfig,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
  } = useTable(roles, 10);

  const columns = [
    {
      key: 'name' as const,
      label: 'Nume',
      sortable: true,
      render: (value: string, row: typeof roles[0]) => (
        <div>
          <div className="font-medium text-text-primary">{value}</div>
          {row.description && (
            <div className="text-sm text-text-secondary">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt' as const,
      label: 'Data Creării',
      sortable: true,
      render: (value: Date) => (
        <span className="text-sm text-text-secondary">
          {new Date(value).toLocaleDateString('ro-RO')}
        </span>
      ),
    },
    {
      key: 'actions' as const,
      label: 'Acțiuni',
      sortable: false,
      render: (_: any, row: typeof roles[0]) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingRole(row);
              setFormData({ name: row.name, description: row.description || '' });
              setIsModalOpen(true);
            }}
          >
            Editare
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteConfirm(row.id)}
            disabled={['superadmin', 'admin', 'moderator', 'user'].includes(row.name)}
          >
            {t('deleteRole')}
          </Button>
        </div>
      ),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Step 2: Submitting role form');

    if (editingRole) {
      await updateRole(editingRole.id, formData);
    } else {
      await createRole(formData);
    }

    setIsModalOpen(false);
    setEditingRole(null);
    setFormData({ name: '', description: '' });
  };

  const handleDelete = async (id: string) => {
    console.log('Step 2: Deleting role:', id);
    const success = await deleteRole(id);
    if (success) {
      setDeleteConfirm(null);
    }
  };

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: '/dashboard' },
    { label: t('breadcrumbSuperadmin'), href: '/dashboard/superadmin' },
    { label: 'Roluri' },
  ];

  if (permissionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  console.log('✓ Rendering roles page');
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('manageRoles')}</h1>
        </div>
        <Button onClick={() => {
          setEditingRole(null);
          setFormData({ name: '', description: '' });
          setIsModalOpen(true);
        }}>
          {t('addRole')}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger bg-opacity-10 border border-danger rounded-md text-danger">
          {error}
        </div>
      )}

      <Card>
        <CardBody>
          {loading ? (
            <div className="text-center py-12 text-text-secondary">{t('loading')}</div>
          ) : (
            <Table
              data={tableData}
              columns={columns}
              sortConfig={sortConfig}
              onSort={handleSort}
              emptyMessage={t('noRoles')}
            />
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-text-secondary">
                Pagina {page} din {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Următor
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRole(null);
          setFormData({ name: '', description: '' });
        }}
        title={editingRole ? t('editRole') : t('addRole')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nume"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={!!editingRole}
          />
          <Input
            label="Descriere"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingRole(null);
                setFormData({ name: '', description: '' });
              }}
            >
              Anulează
            </Button>
            <Button type="submit">{editingRole ? 'Actualizează' : 'Creează'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('confirmDelete')}
      >
        <p className="mb-4 text-text-primary">
          Ești sigur că vrei să ștergi acest rol? Această acțiune nu poate fi anulată.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Anulează
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            {t('delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

