'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { usePermissions, Permission } from '@/hooks/usePermissions';
import { useTable } from '@/hooks/useTable';
import { Badge } from '@/components/ui/Badge';
import { useTranslations } from 'next-intl';
import { PERMISSION_RESOURCES, PERMISSION_ACTIONS } from '@/lib/constants/permissions';

interface PermissionsPageContentProps {
  locale: string;
}

/**
 * Permissions page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function PermissionsPageContent({ locale }: PermissionsPageContentProps) {
  const t = useTranslations('common');
  const { permissions, loading, error, createPermission, updatePermission, deletePermission, bulkDeletePermissions } = usePermissions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<typeof permissions[0] | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', resource: '', action: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Display all permissions - increase page size significantly
  const {
    data: tableData,
    page,
    pageSize,
    totalPages,
    sortConfig,
    handleSort,
    handlePageChange,
  } = useTable(permissions, 1000);

  // Group permissions by resource for check-all functionality
  const permissionsByResource = useMemo(() => {
    const grouped: Record<string, typeof permissions> = {};
    permissions.forEach((perm) => {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push(perm);
    });
    return grouped;
  }, [permissions]);

  // Check if all permissions in a resource are selected
  const isResourceFullySelected = (resource: string): boolean => {
    const resourcePerms = permissionsByResource[resource] || [];
    return resourcePerms.length > 0 && resourcePerms.every((perm) => selectedPermissions.has(perm.id));
  };

  // Check if some (but not all) permissions in a resource are selected
  const isResourcePartiallySelected = (resource: string): boolean => {
    const resourcePerms = permissionsByResource[resource] || [];
    const selectedCount = resourcePerms.filter((perm) => selectedPermissions.has(perm.id)).length;
    return selectedCount > 0 && selectedCount < resourcePerms.length;
  };

  // Check if all permissions are selected
  const isAllSelected = useMemo(() => {
    return permissions.length > 0 && permissions.every((perm) => selectedPermissions.has(perm.id));
  }, [permissions, selectedPermissions]);

  // Check if some (but not all) permissions are selected
  const isSomeSelected = useMemo(() => {
    return selectedPermissions.size > 0 && selectedPermissions.size < permissions.length;
  }, [permissions.length, selectedPermissions.size]);

  // Handle individual checkbox toggle
  const handleTogglePermission = useCallback((permissionId: string) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedPermissions(new Set());
    } else {
      setSelectedPermissions(new Set(permissions.map((perm) => perm.id)));
    }
  }, [isAllSelected, permissions]);

  // Handle select all for a resource
  const handleSelectResource = useCallback((resource: string) => {
    const resourcePerms = permissionsByResource[resource] || [];
    const allSelected = isResourceFullySelected(resource);
    
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        resourcePerms.forEach((perm) => newSet.delete(perm.id));
      } else {
        resourcePerms.forEach((perm) => newSet.add(perm.id));
      }
      return newSet;
    });
  }, [permissionsByResource]);

  // Ref for select all checkbox
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const columns = [
    {
      key: 'checkbox' as keyof Permission,
      label: (
        <div className="flex items-center gap-2">
          <input
            ref={selectAllCheckboxRef}
            type="checkbox"
            checked={isAllSelected}
            onChange={handleSelectAll}
            className="w-4 h-4 cursor-pointer"
            title={isAllSelected ? 'Deselectează toate' : 'Selectează toate'}
          />
          <span>Select</span>
        </div>
      ),
      sortable: false,
      render: (_: any, row: typeof permissions[0]) => (
        <input
          type="checkbox"
          checked={selectedPermissions.has(row.id)}
          onChange={() => handleTogglePermission(row.id)}
          className="w-4 h-4 cursor-pointer"
        />
      ),
    },
    {
      key: 'name' as keyof Permission,
      label: t('name'),
      sortable: true,
    },
    {
      key: 'resource' as keyof Permission,
      label: 'Resource',
      sortable: true,
      render: (value: string, row: typeof permissions[0]) => {
        const isFullySelected = isResourceFullySelected(value);
        const isPartiallySelected = isResourcePartiallySelected(value);
        const hasMultiplePerms = permissionsByResource[value] && permissionsByResource[value].length > 1;
        
        return (
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">{value}</Badge>
            {hasMultiplePerms && (
              <input
                type="checkbox"
                checked={isFullySelected}
                ref={(input) => {
                  if (input) input.indeterminate = isPartiallySelected;
                }}
                onChange={() => handleSelectResource(value)}
                className="w-4 h-4 cursor-pointer ml-2"
                title={`Selectează toate permisiunile pentru ${value}`}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        );
      },
    },
    {
      key: 'action' as keyof Permission,
      label: 'Acțiune',
      sortable: true,
      render: (value: string) => <Badge variant="secondary" size="sm">{value}</Badge>,
    },
    {
      key: 'description' as keyof Permission,
      label: 'Descriere',
      sortable: false,
    },
    {
      key: 'actions' as keyof Permission,
      label: 'Acțiuni',
      sortable: false,
      render: (_: any, row: typeof permissions[0]) => (
        <div className="flex gap-2 items-center">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingPermission(row);
              setFormData({
                name: row.name,
                description: row.description || '',
                resource: row.resource,
                action: row.action,
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1"
            title="Editare permisiune"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editare
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteConfirm(row.id)}
            className="flex items-center gap-1"
            title="Șterge permisiune"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Șterge
          </Button>
        </div>
      ),
    },
  ];

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPermission) {
      await updatePermission(editingPermission.id, formData);
    } else {
      await createPermission(formData);
    }

    setIsModalOpen(false);
    setEditingPermission(null);
    setFormData({ name: '', description: '', resource: '', action: '' });
  }, [editingPermission, formData, createPermission, updatePermission]);

  const handleDelete = useCallback(async (id: string) => {
    const success = await deletePermission(id);
    if (success) {
      setDeleteConfirm(null);
      setSelectedPermissions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [deletePermission]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedPermissions.size === 0) return;
    
    const success = await bulkDeletePermissions(Array.from(selectedPermissions));
    if (success) {
      setSelectedPermissions(new Set());
      setBulkDeleteConfirm(false);
    }
  }, [selectedPermissions, bulkDeletePermissions]);

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('breadcrumbSuperadmin'), href: `/${locale}/dashboard/superadmin` },
    { label: t('permissionsBreadcrumb') },
  ];

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('managePermissions') || 'Manage Permissions'}
        action={
          <Button onClick={() => {
            setEditingPermission(null);
            setFormData({ name: '', description: '', resource: '', action: '' });
            setIsModalOpen(true);
          }}>
            {t('addPermission')}
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
          {/* Bulk Actions Bar */}
          {selectedPermissions.size > 0 && (
            <div className="mb-4 p-4 bg-primary bg-opacity-10 border border-primary rounded-md flex items-center justify-between">
              <div className="text-sm text-text-primary font-medium">
                {selectedPermissions.size} permisiune{selectedPermissions.size !== 1 ? 'i' : ''} selectată{selectedPermissions.size !== 1 ? 'e' : ''}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedPermissions(new Set())}
                >
                  Anulează selecția
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setBulkDeleteConfirm(true)}
                >
                  Șterge selectate ({selectedPermissions.size})
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-text-secondary">{t('loading')}</div>
          ) : (
            <Table
              data={tableData}
              columns={columns}
              sortConfig={sortConfig}
              onSort={handleSort}
              emptyMessage={t('noPermissions')}
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
          setEditingPermission(null);
          setFormData({ name: '', description: '', resource: '', action: '' });
        }}
        title={editingPermission ? t('editPermission') : t('addPermission')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Resource
            </label>
            <select
              className="w-full px-4 py-2 border border-border rounded-md bg-bg-primary text-text-primary"
              value={formData.resource}
              onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
              required
            >
              <option value="">Selectează resource</option>
              {PERMISSION_RESOURCES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Acțiune
            </label>
            <select
              className="w-full px-4 py-2 border border-border rounded-md bg-bg-primary text-text-primary"
              value={formData.action}
              onChange={(e) => {
                const action = e.target.value;
                setFormData({
                  ...formData,
                  action,
                  name: formData.resource && action ? `${formData.resource}.${action}` : '',
                });
              }}
              required
            >
              <option value="">Selectează acțiune</option>
              {PERMISSION_ACTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <Input
            label="Nume"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={!!editingPermission}
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
                setEditingPermission(null);
                setFormData({ name: '', description: '', resource: '', action: '' });
              }}
            >
              Anulează
            </Button>
            <Button type="submit">{editingPermission ? 'Actualizează' : 'Creează'}</Button>
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
          Ești sigur că vrei să ștergi această permisiune? Această acțiune nu poate fi anulată.
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

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        title="Confirmă ștergerea în bulk"
      >
        <p className="mb-4 text-text-primary">
          Ești sigur că vrei să ștergi {selectedPermissions.size} permisiune{selectedPermissions.size !== 1 ? 'i' : ''}? Această acțiune nu poate fi anulată.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setBulkDeleteConfirm(false)}>
            Anulează
          </Button>
          <Button
            variant="danger"
            onClick={handleBulkDelete}
          >
            Șterge {selectedPermissions.size} permisiune{selectedPermissions.size !== 1 ? 'i' : ''}
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}

