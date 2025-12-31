'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';

export default function ConfirmPasswordPage() {
  console.log('Step 1: Rendering Confirm Password page');

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState(false);

  // Validate token on mount
  useEffect(() => {
    console.log('Step 2: Validating token on mount');
    if (!token) {
      console.log('❌ No token provided');
      setIsValidating(false);
      setIsTokenValid(false);
      setErrors({ general: 'Token lipsă. Te rugăm să folosești link-ul din email.' });
      return;
    }

    const validateToken = async () => {
      try {
        console.log(`Step 2.1: Validating token: ${token.substring(0, 8)}...`);
        const response = await fetch(`/api/auth/confirm-password?token=${token}`);
        const data = await response.json();

        if (data.success && data.data) {
          console.log('✓ Token is valid');
          setUserEmail(data.data.email);
          setUserName(data.data.name);
          setIsTokenValid(true);
        } else {
          console.log('❌ Token is invalid or expired');
          setIsTokenValid(false);
          setErrors({
            general: data.error || 'Token invalid sau expirat. Te rugăm să soliciti un link nou.',
          });
        }
      } catch (error) {
        console.error('❌ Error validating token:', error);
        setIsTokenValid(false);
        setErrors({
          general: 'Eroare la validarea token-ului. Te rugăm să încerci din nou.',
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const validatePasswordStrength = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) {
      errors.push('Parola trebuie să aibă cel puțin 8 caractere');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Parola trebuie să conțină cel puțin o literă mare');
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('Parola trebuie să conțină cel puțin o literă mică');
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push('Parola trebuie să conțină cel puțin o cifră');
    }
    if (!/[^A-Za-z0-9]/.test(pwd)) {
      errors.push('Parola trebuie să conțină cel puțin un caracter special');
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Step 3: Password confirmation form submitted');

    setErrors({});

    // Validate passwords match
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      setErrors({ confirmPassword: 'Parolele nu se potrivesc' });
      return;
    }

    // Validate password strength
    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      console.log('❌ Password validation failed:', passwordErrors);
      setErrors({ password: passwordErrors.join(', ') });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Step 4: Sending password confirmation request');
      const response = await fetch('/api/auth/confirm-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();
      console.log('Step 5: Password confirmation response received:', data);

      if (!response.ok || !data.success) {
        console.log('❌ Password confirmation failed:', data.error);
        setErrors({ general: data.error || 'Eroare la setarea parolei' });
        setIsLoading(false);
        return;
      }

      console.log('✓ Password set successfully, redirecting to login');
      // Redirect to login with success message
      router.push('/login?passwordSet=true');
    } catch (error) {
      console.error('❌ Password confirmation error:', error);
      setErrors({
        general: 'Eroare de conexiune. Te rugăm să încerci din nou.',
      });
      setIsLoading(false);
    }
  };

  console.log('✓ Rendering password confirmation form');
  return (
    <Card variant="elevated">
      <CardHeader>
        <h1 className="text-2xl font-bold text-text-primary text-center">
          Setează Parola
        </h1>
        <p className="text-sm text-text-secondary text-center mt-2">
          {isValidating
            ? 'Se validează token-ul...'
            : isTokenValid
            ? userEmail
              ? `Contul pentru ${userEmail}`
              : 'Introdu parola nouă pentru contul tău'
            : 'Token invalid sau expirat'}
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardBody className="space-y-4">
          {errors.general && (
            <div className="p-3 rounded-md bg-danger bg-opacity-10 border border-danger text-danger text-sm">
              {errors.general}
            </div>
          )}

          {isValidating ? (
            <div className="text-center py-8 text-text-secondary">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2">Se validează token-ul...</p>
            </div>
          ) : isTokenValid ? (
            <>
              <div className="p-3 rounded-md bg-info bg-opacity-10 border border-info text-info text-sm">
                <p className="font-medium mb-1">Cerințe pentru parolă:</p>
                <ul className="list-disc list-inside text-xs space-y-1">
                  <li>Minimum 8 caractere</li>
                  <li>Cel puțin o literă mare (A-Z)</li>
                  <li>Cel puțin o literă mică (a-z)</li>
                  <li>Cel puțin o cifră (0-9)</li>
                  <li>Cel puțin un caracter special (!@#$%^&*)</li>
                </ul>
              </div>

              <Input
                label="Parolă"
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
              />

              <Input
                label="Confirmă Parola"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                required
                disabled={isLoading}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                }
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Setează Parola
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-text-secondary mb-4">
                Link-ul de confirmare este invalid sau a expirat.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/login')}
              >
                Mergi la Autentificare
              </Button>
            </div>
          )}
        </CardBody>
      </form>
    </Card>
  );
}


