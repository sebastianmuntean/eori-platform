'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { isValidInternalPath } from '@/lib/utils/permission-validation';

/**
 * Custom hook that requires a specific permission and redirects to unauthorized page if missing
 * 
 * Security Note: This is a client-side check for UX purposes only. Server-side validation
 * must be implemented separately (e.g., in middleware or API routes) to ensure security.
 * 
 * @param permission - The permission name to check (e.g., 'hr.employees.view')
 * @param redirectTo - Optional custom redirect path (defaults to /dashboard/unauthorized)
 *                     Must be a valid internal path (validated to prevent open redirect)
 * @returns Object with hasPermission status and loading state
 */
export function useRequirePermission(permission: string, redirectTo?: string): {
  hasPermission: boolean;
  loading: boolean;
} {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'ro';
  const { hasPermission, loading, permissions } = useUserPermissions();
  const hasRedirectedRef = useRef(false); // Prevent multiple redirects

  useEffect(() => {
    // Don't redirect while loading, if permissions are not loaded yet, or if already redirected
    if (loading || hasRedirectedRef.current || permissions.length === 0) {
      return;
    }

    // Validate permission string (early return if invalid)
    if (!permission || typeof permission !== 'string') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('useRequirePermission: Invalid permission string provided:', permission);
      }
      return;
    }

    // Check permission AFTER loading is complete
    const userHasPermission = hasPermission(permission);

    // If user doesn't have permission, redirect to unauthorized page
    if (!userHasPermission) {
      // Validate redirect path to prevent open redirect vulnerability
      let redirectPath: string;

      if (redirectTo) {
        // Validate that redirect path is safe
        if (!isValidInternalPath(redirectTo)) {
          if (process.env.NODE_ENV === 'development') {
            console.error('useRequirePermission: Invalid redirect path (potential open redirect):', redirectTo);
          }
          // Fallback to default unauthorized page
          redirectPath = `/${locale}/dashboard/unauthorized`;
        } else {
          redirectPath = `/${locale}${redirectTo}`;
        }
      } else {
        redirectPath = `/${locale}/dashboard/unauthorized`;
      }

      // Mark as redirected to prevent multiple redirects
      hasRedirectedRef.current = true;

      // Only log in development to avoid leaking information
      if (process.env.NODE_ENV === 'development') {
        console.log(`Permission denied: ${permission}, redirecting to ${redirectPath}`);
      }

      // Perform redirect
      router.replace(redirectPath);
    }
  }, [loading, hasPermission, permission, permissions, locale, router, redirectTo]);

  // Reset redirect flag when permission changes
  useEffect(() => {
    hasRedirectedRef.current = false;
  }, [permission]);

  // Calculate userHasPermission for return value (only when not loading)
  const userHasPermission = loading ? false : hasPermission(permission);

  return {
    hasPermission: userHasPermission,
    loading,
  };
}

