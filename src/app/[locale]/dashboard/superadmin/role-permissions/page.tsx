'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { SUPERADMIN_PERMISSIONS } from '@/lib/permissions/superadmin';

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Array<{
    id: string;
    name: string;
    resource: string;
    action: string;
  }>;
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string | null;
}

interface ResourceSectionProps {
  resource: string;
  permissions: Permission[];
  selectedPermissionIds: Set<string>;
  onToggleResource: () => void;
  onTogglePermission: (permissionId: string) => void;
}

function ResourceSection({
  resource,
  permissions,
  selectedPermissionIds,
  onToggleResource,
  onTogglePermission,
}: ResourceSectionProps) {
  const allSelected = permissions.length > 0 && permissions.every(p => selectedPermissionIds.has(p.id));
  const someSelected = permissions.some(p => selectedPermissionIds.has(p.id)) && !allSelected;
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  return (
    <div className="border border-border rounded-lg p-4 bg-bg-secondary">
      <label className="flex items-center gap-2 cursor-pointer hover:bg-bg-primary p-2 rounded mb-3">
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={allSelected}
          onChange={onToggleResource}
          className="w-5 h-5"
        />
        <span className="font-semibold text-base text-text-primary">{resource}</span>
      </label>
      <div className="space-y-2">
        {permissions.map((permission) => (
          <label
            key={permission.id}
            className="flex items-center gap-2 cursor-pointer hover:bg-bg-primary p-2 rounded"
          >
            <input
              type="checkbox"
              checked={selectedPermissionIds.has(permission.id)}
              onChange={() => onTogglePermission(permission.id)}
              className="w-4 h-4"
            />
            <span className="text-sm text-text-secondary">{permission.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function RolePermissionsPage() {
  console.log('Step 1: Rendering Role Permissions page');

  const params = useParams();
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('rolePermissions') || 'Role Permissions');

  // Check permission to view role permissions
  const { loading: permissionLoading } = useRequirePermission(SUPERADMIN_PERMISSIONS.ROLE_PERMISSIONS_VIEW);

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Array<{ id: string; name: string; resource: string; action: string; description?: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Define fetchData before useEffect (must be before conditional return)
  const fetchData = useCallback(async () => {
    console.log('Step 2: Fetching roles and permissions');
    setLoading(true);
    setError(null);

    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/superadmin/role-permissions'),
        fetch('/api/superadmin/permissions'),
      ]);

      if (!rolesRes.ok || !permsRes.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();

      if (!rolesData.success) {
        throw new Error(rolesData.error || 'Failed to load roles');
      }
      if (!permsData.success) {
        throw new Error(permsData.error || 'Failed to load permissions');
      }

      setRoles(rolesData.data);
      setPermissions(permsData.data);
      console.log('✓ Data loaded');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('❌ Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (permissionLoading) return;
    fetchData();
  }, [permissionLoading, fetchData]);

  const handleOpenModal = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissionIds(new Set(role.permissions.map((p) => p.id)));
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleToggleAllPermissions = () => {
    const allPermissionIds = permissions.map(p => p.id);
    const allSelected = allPermissionIds.every(id => selectedPermissionIds.has(id));
    
    if (allSelected) {
      setSelectedPermissionIds(new Set());
    } else {
      setSelectedPermissionIds(new Set(allPermissionIds));
    }
  };

  const handleToggleResourcePermissions = (resource: string) => {
    const resourcePermissions = permissionsByResource[resource] || [];
    const resourcePermissionIds = resourcePermissions.map(p => p.id);
    const allResourceSelected = resourcePermissionIds.every(id => selectedPermissionIds.has(id));
    
    setSelectedPermissionIds((prev) => {
      const newSet = new Set(prev);
      if (allResourceSelected) {
        resourcePermissionIds.forEach(id => newSet.delete(id));
      } else {
        resourcePermissionIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!selectedRole || isSaving) return;
    console.log('Step 2: Saving role permissions');

    const currentPermissionIds = new Set(selectedRole.permissions.map((p) => p.id));
    const toAdd = Array.from(selectedPermissionIds).filter((id) => !currentPermissionIds.has(id));
    const toRemove = Array.from(currentPermissionIds).filter((id) => !selectedPermissionIds.has(id));

    setIsSaving(true);
    setError(null);

    try {
      // Execute all add and remove operations in parallel
      const addPromises = toAdd.map(async (permissionId) => {
        const response = await fetch('/api/superadmin/role-permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId: selectedRole.id, permissionId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to add permission ${permissionId}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || `Failed to add permission ${permissionId}`);
        }

        return data;
      });

      const removePromises = toRemove.map(async (permissionId) => {
        const response = await fetch(
          `/api/superadmin/role-permissions?roleId=${selectedRole.id}&permissionId=${permissionId}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to remove permission ${permissionId}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || `Failed to remove permission ${permissionId}`);
        }

        return data;
      });

      // Wait for all operations to complete
      await Promise.all([...addPromises, ...removePromises]);

      await fetchData();
      setIsModalOpen(false);
      setSelectedRole(null);
      setSelectedPermissionIds(new Set());
      console.log('✓ Permissions updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permissions');
      console.error('❌ Error updating permissions:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const permissionsByResource = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Superadmin', href: '/dashboard/superadmin' },
    { label: 'Rol-Permisiuni' },
  ];

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  console.log('✓ Rendering role permissions page');
  return (
    <div>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Configurare Rol-Permisiuni"
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
            <div className="text-center py-12 text-text-secondary">Se încarcă...</div>
          ) : (
            <div className="space-y-4">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="p-4 border border-border rounded-md hover:bg-bg-secondary transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-text-primary">{role.name}</div>
                      {role.description && (
                        <div className="text-sm text-text-secondary">{role.description}</div>
                      )}
                    </div>
                    <Button onClick={() => handleOpenModal(role)}>
                      Configurează Permisiuni
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {role.permissions.length > 0 ? (
                      role.permissions.map((perm) => (
                        <Badge key={perm.id} variant="secondary" size="sm">
                          {perm.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-text-muted">Fără permisiuni</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Configure Permissions Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRole(null);
          setSelectedPermissionIds(new Set());
        }}
        title={`Configurează Permisiuni - ${selectedRole?.name}`}
        size="full"
      >
        <div className="flex flex-col -mx-6 -my-4 h-[calc(98vh-80px)]">
          {/* Select All Checkbox */}
          <div className="border-b border-border pb-4 mb-4 px-6 pt-4 flex-shrink-0">
            <label className="flex items-center gap-2 cursor-pointer hover:bg-bg-secondary p-3 rounded-lg">
              <input
                type="checkbox"
                checked={permissions.length > 0 && permissions.every(p => selectedPermissionIds.has(p.id))}
                onChange={handleToggleAllPermissions}
                className="w-5 h-5"
              />
              <span className="font-bold text-base text-white">Selectează toate permisiunile</span>
            </label>
          </div>

          {/* Permissions Grid in Multiple Columns */}
          <div className="flex-1 overflow-y-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
              {Object.entries(permissionsByResource).map(([resource, perms]) => (
                <ResourceSection
                  key={resource}
                  resource={resource}
                  permissions={perms}
                  selectedPermissionIds={selectedPermissionIds}
                  onToggleResource={() => handleToggleResourcePermissions(resource)}
                  onTogglePermission={handleTogglePermission}
                />
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 justify-end px-6 pb-4 pt-4 border-t border-border flex-shrink-0">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedRole(null);
                setSelectedPermissionIds(new Set());
              }}
              disabled={isSaving}
            >
              Anulează
            </Button>
            <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving}>
              Salvează
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

