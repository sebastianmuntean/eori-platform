'use client';

import { useState, useEffect, useCallback } from 'react';

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  roles: Role[];
}

interface UseUserRolesReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  assignRole: (userId: string, roleId: string) => Promise<boolean>;
  removeRole: (userId: string, roleId: string) => Promise<boolean>;
}

export function useUserRoles(): UseUserRolesReturn {
  console.log('Step 1: useUserRoles hook initialized');

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    console.log('Step 2: Fetching users with roles');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/superadmin/user-roles');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch users');
      }

      setUsers(result.data);
      console.log(`✓ Fetched ${result.data.length} users with roles`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      console.error(`❌ Error fetching users: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const assignRole = useCallback(async (userId: string, roleId: string): Promise<boolean> => {
    console.log('Step 2: Assigning role to user:', userId, roleId);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/superadmin/user-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to assign role');
      }

      // Refresh users list
      await fetchUsers();
      console.log(`✓ Role assigned to user`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign role';
      setError(errorMessage);
      console.error(`❌ Error assigning role: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const removeRole = useCallback(async (userId: string, roleId: string): Promise<boolean> => {
    console.log('Step 2: Removing role from user:', userId, roleId);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/superadmin/user-roles?userId=${userId}&roleId=${roleId}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove role');
      }

      // Refresh users list
      await fetchUsers();
      console.log(`✓ Role removed from user`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove role';
      setError(errorMessage);
      console.error(`❌ Error removing role: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    assignRole,
    removeRole,
  };
}

