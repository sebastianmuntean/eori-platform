'use client';

import { useState, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  name: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UsersResponse {
  data: User[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
}

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchUsers: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    approvalStatus?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createUser: (userData: {
    email: string;
    name: string;
    role?: string;
    address?: string;
    city?: string;
    phone?: string;
    isActive?: boolean;
    approvalStatus?: string;
  }) => Promise<boolean>;
  updateUser: (userId: string, userData: {
    name?: string;
    email?: string;
    isActive?: boolean;
    approvalStatus?: string;
  }) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  importUsers: (file: File) => Promise<ImportResult | null>;
  exportUsers: (params?: {
    search?: string;
    status?: string;
    approvalStatus?: string;
  }) => Promise<void>;
  resendConfirmationEmail: (userId: string) => Promise<boolean>;
}

export function useUsers(): UseUsersReturn {
  console.log('Step 1: useUsers hook initialized');

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseUsersReturn['pagination']>(null);

  const fetchUsers = useCallback(async (params = {}) => {
    console.log('Step 2: Fetching users with params:', params);
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.approvalStatus) queryParams.append('approvalStatus', params.approvalStatus);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = `/api/users?${queryParams.toString()}`;
      console.log(`  Fetching from: ${url}`);

      const response = await fetch(url);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch users');
      }

      setUsers(result.data);
      setPagination(result.pagination);
      console.log(`✓ Fetched ${result.data.length} users`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      console.error(`❌ Error fetching users: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData): Promise<boolean> => {
    console.log('Step 2: Creating user:', userData.email);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create user');
      }

      console.log(`✓ User created: ${result.data.id}`);
      // Refresh users list
      await fetchUsers();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      console.error(`❌ Error creating user: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const updateUser = useCallback(async (userId: string, userData): Promise<boolean> => {
    console.log(`Step 2: Updating user ${userId}`);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update user');
      }

      console.log(`✓ User updated: ${userId}`);
      // Refresh users list
      await fetchUsers();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
      console.error(`❌ Error updating user: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    console.log(`Step 2: Deleting user ${userId}`);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete user');
      }

      console.log(`✓ User deleted: ${userId}`);
      // Refresh users list
      await fetchUsers();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
      console.error(`❌ Error deleting user: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const importUsers = useCallback(async (file: File): Promise<ImportResult | null> => {
    console.log(`Step 2: Importing users from file: ${file.name}`);
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/users/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to import users');
      }

      console.log(`✓ Import completed: ${result.data.successful} successful, ${result.data.failed} failed`);
      // Refresh users list
      await fetchUsers();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import users';
      setError(errorMessage);
      console.error(`❌ Error importing users: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const exportUsers = useCallback(async (params = {}): Promise<void> => {
    console.log('Step 2: Exporting users');
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.approvalStatus) queryParams.append('approvalStatus', params.approvalStatus);

      const url = `/api/users/export?${queryParams.toString()}`;
      console.log(`  Exporting from: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to export users');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : 'utilizatori.xlsx';

      // Download file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log(`✓ Users exported to ${filename}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export users';
      setError(errorMessage);
      console.error(`❌ Error exporting users: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const resendConfirmationEmail = useCallback(async (userId: string): Promise<boolean> => {
    console.log(`Step 2: Resending confirmation email for user ${userId}`);
    setLoading(true);
    setError(null);

    try {
      console.log(`  Calling API: /api/users/${userId}/resend-confirmation`);
      const response = await fetch(`/api/users/${userId}/resend-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to resend confirmation email');
      }

      console.log(`✓ Confirmation email resent successfully to ${result.data?.email || 'user'}`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend confirmation email';
      setError(errorMessage);
      console.error(`❌ Error resending confirmation email: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    importUsers,
    exportUsers,
    resendConfirmationEmail,
  };
}

