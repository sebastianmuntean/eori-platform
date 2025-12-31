'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { defaultLocale } from '@/i18n/config';

export default function NotFound() {
  console.log('Step 1: NotFound page rendered - handling 404');
  
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    console.log('Step 2: Extracting locale from params:', params);
    
    // Get locale from params (since we're in [locale] route segment)
    const locale = (params.locale as string) || defaultLocale;
    
    const dashboardPath = `/${locale}/dashboard`;
    console.log('Step 3: Redirecting to dashboard:', dashboardPath);
    
    // Redirect to dashboard
    router.replace(dashboardPath);
    console.log('✓ Redirect initiated to dashboard');
  }, [params, router]);

  // Show a loading state while redirecting
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500">Redirecting to dashboard...</p>
      </div>
    </main>
  );
}

