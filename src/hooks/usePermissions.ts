'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UsePermissionsReturn {
  permissions: Permission[];
  loading: boolean;
  error: string | null;
  fetchPermissions: () => Promise<void>;
  createPermission: (data: {
    name: string;
    description?: string;
    resource: string;
    action: string;
  }) => Promise<Permission | null>;
  updatePermission: (
    id: string,
    data: { name?: string; description?: string; resource?: string; action?: string }
  ) => Promise<Permission | null>;
  deletePermission: (id: string) => Promise<boolean>;
  bulkDeletePermissions: (ids: string[]) => Promise<boolean>;
}

export function usePermissions(): UsePermissionsReturn {
  console.log('Step 1: usePermissions hook initialized');

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    console.log('Step 2: Fetching permissions');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/superadmin/permissions');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch permissions');
      }

      setPermissions(result.data);
      console.log(`✓ Fetched ${result.data.length} permissions`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch permissions';
      setError(errorMessage);
      console.error(`❌ Error fetching permissions: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPermission = useCallback(async (data: {
    name: string;
    description?: string;
    resource: string;
    action: string;
  }): Promise<Permission | null> => {
    console.log('Step 2: Creating permission:', data.name);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/superadmin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create permission');
      }

      setPermissions((prev) => [...prev, result.data]);
      console.log(`✓ Permission created: ${result.data.id}`);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create permission';
      setError(errorMessage);
      console.error(`❌ Error creating permission: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePermission = useCallback(async (
    id: string,
    data: { name?: string; description?: string; resource?: string; action?: string }
  ): Promise<Permission | null> => {
    console.log('Step 2: Updating permission:', id);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/superadmin/permissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update permission');
      }

      setPermissions((prev) => prev.map((perm) => (perm.id === id ? result.data : perm)));
      console.log(`✓ Permission updated: ${id}`);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update permission';
      setError(errorMessage);
      console.error(`❌ Error updating permission: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePermission = useCallback(async (id: string): Promise<boolean> => {
    console.log('Step 2: Deleting permission:', id);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/superadmin/permissions/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete permission');
      }

      setPermissions((prev) => prev.filter((perm) => perm.id !== id));
      console.log(`✓ Permission deleted: ${id}`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete permission';
      setError(errorMessage);
      console.error(`❌ Error deleting permission: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkDeletePermissions = useCallback(async (ids: string[]): Promise<boolean> => {
    console.log('Step 2: Bulk deleting permissions:', ids);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/superadmin/permissions/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete permissions');
      }

      setPermissions((prev) => prev.filter((perm) => !ids.includes(perm.id)));
      console.log(`✓ Deleted ${ids.length} permissions`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete permissions';
      setError(errorMessage);
      console.error(`❌ Error bulk deleting permissions: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    error,
    fetchPermissions,
    createPermission,
    updatePermission,
    deletePermission,
    bulkDeletePermissions,
  };
}

