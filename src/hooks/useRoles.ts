'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UseRolesReturn {
  roles: Role[];
  loading: boolean;
  error: string | null;
  fetchRoles: () => Promise<void>;
  createRole: (data: { name: string; description?: string }) => Promise<Role | null>;
  updateRole: (id: string, data: { name?: string; description?: string }) => Promise<Role | null>;
  deleteRole: (id: string) => Promise<boolean>;
}

export function useRoles(): UseRolesReturn {
  console.log('Step 1: useRoles hook initialized');

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    console.log('Step 2: Fetching roles');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/superadmin/roles');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch roles');
      }

      setRoles(result.data);
      console.log(`✓ Fetched ${result.data.length} roles`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roles';
      setError(errorMessage);
      console.error(`❌ Error fetching roles: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRole = useCallback(async (data: { name: string; description?: string }): Promise<Role | null> => {
    console.log('Step 2: Creating role:', data.name);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/superadmin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create role');
      }

      setRoles((prev) => [...prev, result.data]);
      console.log(`✓ Role created: ${result.data.id}`);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role';
      setError(errorMessage);
      console.error(`❌ Error creating role: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRole = useCallback(async (
    id: string,
    data: { name?: string; description?: string }
  ): Promise<Role | null> => {
    console.log('Step 2: Updating role:', id);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/superadmin/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update role');
      }

      setRoles((prev) => prev.map((role) => (role.id === id ? result.data : role)));
      console.log(`✓ Role updated: ${id}`);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      setError(errorMessage);
      console.error(`❌ Error updating role: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRole = useCallback(async (id: string): Promise<boolean> => {
    console.log('Step 2: Deleting role:', id);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/superadmin/roles/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete role');
      }

      setRoles((prev) => prev.filter((role) => role.id !== id));
      console.log(`✓ Role deleted: ${id}`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
      setError(errorMessage);
      console.error(`❌ Error deleting role: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    loading,
    error,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
  };
}

