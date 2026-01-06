'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function UnauthorizedPage() {
  console.log('Step 1: Rendering Unauthorized page');

  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle(t('unauthorized') || 'Unauthorized - EORI');

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('unauthorizedTitle') || 'Access Denied'}
          </h1>
        </CardHeader>
        <CardBody className="text-center">
          <p className="text-gray-600 mb-4">
            {t('unauthorizedMessage') || 
              'You do not have permission to access this resource. Please contact your administrator if you believe this is an error.'}
          </p>
        </CardBody>
        <CardFooter className="flex justify-center">
          <Link href={`/${locale}/dashboard`}>
            <Button variant="primary">
              {t('backToDashboard') || t('dashboard') || 'Back to Dashboard'}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}






