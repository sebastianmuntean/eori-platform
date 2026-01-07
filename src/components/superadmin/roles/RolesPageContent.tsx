'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useRoles, Role } from '@/hooks/useRoles';
import { useTable } from '@/hooks/useTable';
import { Badge } from '@/components/ui/Badge';

interface RolesPageContentProps {
  locale: string;
}

/**
 * Roles page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function RolesPageContent({ locale }: RolesPageContentProps) {
  const t = useTranslations('common');
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
      key: 'name' as keyof Role,
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
      key: 'createdAt' as keyof Role,
      label: 'Data Creării',
      sortable: true,
      render: (value: Date) => (
        <span className="text-sm text-text-secondary">
          {new Date(value).toLocaleDateString('ro-RO')}
        </span>
      ),
    },
    {
      key: 'actions' as keyof Role,
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRole) {
      await updateRole(editingRole.id, formData);
    } else {
      await createRole(formData);
    }

    setIsModalOpen(false);
    setEditingRole(null);
    setFormData({ name: '', description: '' });
  }, [editingRole, formData, createRole, updateRole]);

  const handleDelete = useCallback(async (id: string) => {
    const success = await deleteRole(id);
    if (success) {
      setDeleteConfirm(null);
    }
  }, [deleteRole]);

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('breadcrumbSuperadmin'), href: `/${locale}/dashboard/superadmin` },
    { label: 'Roluri' },
  ];

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('manageRoles') || 'Manage Roles'}
        action={
          <Button onClick={() => {
            setEditingRole(null);
            setFormData({ name: '', description: '' });
            setIsModalOpen(true);
          }}>
            {t('addRole')}
          </Button>
        }
        className="mb-6"
      />

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
    </PageContainer>
  );
}

