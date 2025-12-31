'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  console.log('Step 1: Rendering Login page');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const registered = searchParams.get('registered') === 'true';
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(registered);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Step 2: Login form submitted');
    
    setErrors({});
    setIsLoading(true);

    try {
      console.log('Step 3: Sending login request to API');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Step 4: Login response received:', data);

      if (!response.ok) {
        console.log('❌ Login failed:', data.error);
        setErrors({ general: data.error || t('loginError') });
        setIsLoading(false);
        return;
      }

      if (data.success) {
        console.log('✓ Login successful, redirecting to:', redirect);
        // Trigger auth refresh event for Header component
        window.dispatchEvent(new Event('auth-refresh'));
        // Small delay to ensure cookie is set
        setTimeout(() => {
          router.push(redirect);
          router.refresh();
        }, 100);
      } else {
        console.log('❌ Login failed:', data.error);
        setErrors({ general: data.error || t('loginError') });
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setErrors({ general: t('connectionError') });
    } finally {
      setIsLoading(false);
    }
  };

  console.log('✓ Rendering login form');
  return (
    <Card variant="elevated">
      <CardHeader>
        <h1 className="text-2xl font-bold text-text-primary text-center">{t('authentication')}</h1>
        <p className="text-sm text-text-secondary text-center mt-2">
          {t('enterEmailPassword')}
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardBody className="space-y-4">
          {showSuccess && (
            <div className="p-3 rounded-md bg-success bg-opacity-10 border border-success text-success text-sm">
              {t('accountCreatedSuccess')}
            </div>
          )}
          {errors.general && (
            <div className="p-3 rounded-md bg-danger bg-opacity-10 border border-danger text-danger text-sm">
              {errors.general}
            </div>
          )}

          <Input
            label={t('email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
            disabled={isLoading}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            }
            placeholder={tCommon('emailPlaceholder')}
          />

          <Input
            label={t('password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
            disabled={isLoading}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            }
            placeholder="••••••••"
          />
        </CardBody>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {t('login')}
          </Button>
          <div className="text-center text-sm text-text-secondary">
            {t('noAccount')}{' '}
            <Link
              href="/register"
              className="text-primary hover:text-primary-dark font-medium"
            >
              {t('registerHere')}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

