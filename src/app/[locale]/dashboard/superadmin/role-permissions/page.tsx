'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

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

export default function RolePermissionsPage() {
  console.log('Step 1: Rendering Role Permissions page');

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Array<{ id: string; name: string; resource: string; action: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
  };

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
  }, {} as Record<string, typeof permissions>);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Superadmin', href: '/dashboard/superadmin' },
    { label: 'Rol-Permisiuni' },
  ];

  console.log('✓ Rendering role permissions page');
  return (
    <div>
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbs} className="mb-2" />
        <h1 className="text-3xl font-bold text-text-primary">Configurare Rol-Permisiuni</h1>
      </div>

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
        size="lg"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {Object.entries(permissionsByResource).map(([resource, perms]) => (
            <div key={resource} className="border-b border-border pb-4 last:border-0">
              <h3 className="font-semibold text-text-primary mb-2">{resource}</h3>
              <div className="space-y-2">
                {perms.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-bg-secondary p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissionIds.has(perm.id)}
                      onChange={() => handleTogglePermission(perm.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-text-primary">{perm.name}</span>
                    {perm.description && (
                      <span className="text-xs text-text-secondary">- {perm.description}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-border">
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
      </Modal>
    </div>
  );
}

