import { useState, useEffect, useCallback } from 'react';
import { useUser } from './useUser';
import { permissionsResponseSchema } from '@/lib/validations/permissions';
import { isValidPermissionString, sanitizePermissionString } from '@/lib/utils/permission-validation';

interface UseUserPermissionsReturn {
  permissions: string[];
  loading: boolean;
  error: string | null;
  hasPermission: (permission: string) => boolean;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage user permissions
 * 
 * Features:
 * - Fetches permissions from API with validation
 * - Caches permissions in component state
 * - Provides hasPermission() function for easy checking
 * - Listens to auth changes across tabs/windows
 * - Validates permission strings before checking
 * 
 * @returns Object with permissions, loading state, error, and helper functions
 */
export function useUserPermissions(): UseUserPermissionsReturn {
  const { user } = useUser();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches permissions from the API with proper validation
   */
  const fetchPermissions = useCallback(async () => {
    // Clear permissions if user is not authenticated
    if (!user) {
      setPermissions([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/permissions', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Parse and validate response
      const rawData = await response.json();
      
      // Validate response structure using Zod schema
      const validationResult = permissionsResponseSchema.safeParse(rawData);

      if (!validationResult.success) {
        console.error('Invalid API response format:', validationResult.error);
        setError('Invalid response from server');
        setPermissions([]);
        return;
      }

      const data = validationResult.data;

      // Handle error responses
      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to fetch permissions');
        setPermissions([]);
        return;
      }

      // Validate and filter permissions array
      if (Array.isArray(data.permissions)) {
        // Filter to ensure all permissions are valid strings
        const validPermissions = data.permissions.filter(
          (p): p is string => typeof p === 'string' && p.length > 0 && isValidPermissionString(p)
        );
        if (process.env.NODE_ENV === 'development') {
          console.log(`✓ Loaded ${validPermissions.length} permissions:`, validPermissions);
        }
        setPermissions(validPermissions);
      } else {
        setPermissions([]);
      }
    } catch (err) {
      // Handle network errors or JSON parsing errors
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to fetch permissions';
      setError(errorMessage);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Sets up listeners for auth changes across tabs/windows
   */
  useEffect(() => {
    fetchPermissions();

    /**
     * Handles storage events (auth changes in other tabs/windows)
     * Validates origin and event key before processing
     */
    const handleStorageChange = (e: StorageEvent) => {
      // Security: Only process events from same origin
      if (e.origin !== window.location.origin) {
        return;
      }

      // Only process auth-refresh events
      if (e.key !== 'auth-refresh') {
        return;
      }

      // Optional: Validate event data structure
      try {
        const data = e.newValue ? JSON.parse(e.newValue) : null;
        if (data && typeof data === 'object' && data.type === 'auth-refresh') {
          fetchPermissions();
        }
      } catch (error) {
        // Invalid data, ignore silently
        console.warn('Invalid storage event data');
      }
    };

    /**
     * Handles custom auth refresh events
     */
    const handleAuthEvent = () => {
      fetchPermissions();
    };

    // Register event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-refresh', handleAuthEvent);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-refresh', handleAuthEvent);
    };
  }, [fetchPermissions]);

  /**
   * Checks if user has a specific permission
   * 
   * @param permission - Permission string (e.g., 'hr.employees.view')
   * @returns true if user has the permission, false otherwise
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      // Early return if no permission string provided
      if (!permission || typeof permission !== 'string') {
        return false;
      }

      // Early return if no permissions loaded
      if (permissions.length === 0) {
        return false;
      }

      // Sanitize and validate permission string format (but preserve case for comparison)
      const trimmed = permission.trim();
      if (!isValidPermissionString(trimmed)) {
        // Invalid permission format - log warning in development only
        if (process.env.NODE_ENV === 'development') {
          console.warn('Invalid permission string format:', permission);
        }
        return false;
      }

      // Check for specific permission (case-insensitive comparison)
      // Permissions in database may have mixed case (e.g., superadmin.rolePermissions.view)
      const hasPerm = permissions.some(p => p.toLowerCase() === trimmed.toLowerCase());
      if (process.env.NODE_ENV === 'development' && !hasPerm) {
        console.log(`Permission not found: ${permission} (looking for: ${trimmed})`);
        console.log('Available permissions (total:', permissions.length, '):', permissions);
        // Check if there are any superadmin permissions
        const superadminPerms = permissions.filter(p => p.toLowerCase().startsWith('superadmin.'));
        console.log('Superadmin permissions found (total:', superadminPerms.length, '):', superadminPerms);
      }
      return hasPerm;
    },
    [permissions]
  );

  return {
    permissions,
    loading,
    error,
    hasPermission,
    refetch: fetchPermissions,
  };
}

