'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function RegisterPage() {
  console.log('Step 1: Rendering Register page');
  
  const router = useRouter();
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    console.log('Step 2: Form field changed:', field);
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    console.log('Step 3: Validating form');
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = tCommon('nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = tCommon('emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = tCommon('emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = tCommon('passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = tCommon('passwordMinChars');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = tCommon('confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = tCommon('passwordsDontMatch');
    }

    setErrors(newErrors);
    console.log('✓ Form validation completed, errors:', Object.keys(newErrors).length);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Step 4: Register form submitted');

    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      console.log('Step 5: Sending register request to API');
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      console.log('Step 6: Register response received:', data);

      if (!response.ok) {
        console.log('❌ Registration failed:', data.error);
        setErrors({ general: data.error || t('registrationError') });
        setIsLoading(false);
        return;
      }

      if (data.success) {
        console.log('✓ Registration successful, redirecting to login');
        router.push('/login?registered=true');
      } else {
        console.log('❌ Registration failed:', data.error);
        setErrors({ general: data.error || t('registrationError') });
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      setErrors({ general: t('connectionError') });
    } finally {
      setIsLoading(false);
    }
  };

  console.log('✓ Rendering register form');
  return (
    <Card variant="elevated">
      <CardHeader>
        <h1 className="text-2xl font-bold text-text-primary text-center">{t('register')}</h1>
        <p className="text-sm text-text-secondary text-center mt-2">
          {t('createAccount')}
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardBody className="space-y-4">
          {errors.general && (
            <div className="p-3 rounded-md bg-danger bg-opacity-10 border border-danger text-danger text-sm">
              {errors.general}
            </div>
          )}

          <Input
            label={tCommon('fullName')}
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            required
            disabled={isLoading}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
            placeholder={tCommon('namePlaceholder')}
          />

          <Input
            label={t('email')}
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
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
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            error={errors.password}
            required
            disabled={isLoading}
            helperText={tCommon('passwordMinLength')}
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

          <Input
            label={tCommon('confirmPassword')}
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
            required
            disabled={isLoading}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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
            {t('register')}
          </Button>
          <div className="text-center text-sm text-text-secondary">
            {t('alreadyHaveAccount')}{' '}
            <Link
              href="/login"
              className="text-primary hover:text-primary-dark font-medium"
            >
              {t('signIn')}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

