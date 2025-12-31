import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

export function useUser() {
  console.log('Step 1: useUser hook initialized');
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    console.log('Step 2: Fetching current user from API');
    setLoading(true);
    setError(null);

    try {
      console.log('Step 3: Sending request to /api/auth/me');
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Step 4: User response received:', data);

      if (!response.ok) {
        console.log('❌ Failed to get user:', data.error);
        setError(data.error || 'Failed to get user');
        setUser(null);
        return;
      }

      if (data.success && data.user) {
        console.log('✓ User fetched successfully:', data.user.name);
        setUser(data.user);
      } else {
        console.log('❌ No user in response');
        setUser(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user';
      console.error('❌ Error fetching user:', errorMessage);
      setError(errorMessage);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // Listen for storage events (when login happens in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-refresh') {
        console.log('Step 5: Auth refresh event detected, refetching user');
        fetchUser();
      }
    };

    // Listen for custom auth events
    const handleAuthEvent = () => {
      console.log('Step 6: Auth event detected, refetching user');
      fetchUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-refresh', handleAuthEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-refresh', handleAuthEvent);
    };
  }, [fetchUser]);

  return { user, loading, error, refetch: fetchUser };
}



