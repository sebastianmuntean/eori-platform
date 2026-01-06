import { useEffect, DependencyList } from 'react';

/**
 * Hook to handle permission-aware data fetching
 * Prevents API calls while permissions are being checked
 * 
 * @param permissionLoading - Loading state from useRequirePermission
 * @param fetchFn - Function to call for fetching data
 * @param deps - Dependencies for the useEffect
 */
export function usePermissionAwareFetch(
  permissionLoading: boolean,
  fetchFn: () => void,
  deps: DependencyList
) {
  useEffect(() => {
    if (permissionLoading) return;
    fetchFn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionLoading, ...deps]);
}





