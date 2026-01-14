'use client';

import { Input } from '@/components/ui/Input';
import { useTranslations } from 'next-intl';
import { Profile, UpdateProfileData } from '@/hooks/useProfile';

interface UserProfileFormProps {
  profile: Profile;
  formData: UpdateProfileData;
  errors: Record<string, string | undefined>;
  isSubmitting: boolean;
  onFieldChange: (field: keyof UpdateProfileData, value: string) => void;
  onClearError: (field: keyof UpdateProfileData) => void;
}

export function UserProfileForm({
  profile,
  formData,
  errors,
  isSubmitting,
  onFieldChange,
  onClearError,
}: UserProfileFormProps) {
  const t = useTranslations('common');
  const tProfile = useTranslations('profile');

  const handleFieldChange = (field: keyof UpdateProfileData, value: string) => {
    onFieldChange(field, value);
    if (errors[field]) {
      onClearError(field);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label={t('name') || tProfile('name')}
        type="text"
        value={formData.name ?? profile.name}
        onChange={(e) => handleFieldChange('name', e.target.value)}
        required
        disabled={isSubmitting}
        error={errors.name}
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
      />

      <Input
        label={t('email') || tProfile('email')}
        type="email"
        value={formData.email ?? profile.email}
        onChange={(e) => handleFieldChange('email', e.target.value)}
        required
        disabled={isSubmitting}
        error={errors.email}
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        }
      />

      <Input
        label={t('address') || tProfile('address')}
        type="text"
        value={formData.address ?? profile.address ?? ''}
        onChange={(e) => handleFieldChange('address', e.target.value)}
        disabled={isSubmitting}
        error={errors.address}
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        }
      />

      <Input
        label={t('city') || tProfile('city')}
        type="text"
        value={formData.city ?? profile.city ?? ''}
        onChange={(e) => handleFieldChange('city', e.target.value)}
        disabled={isSubmitting}
        error={errors.city}
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        }
      />

      <Input
        label={t('phone') || tProfile('phone')}
        type="tel"
        value={formData.phone ?? profile.phone ?? ''}
        onChange={(e) => handleFieldChange('phone', e.target.value)}
        disabled={isSubmitting}
        error={errors.phone}
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        }
      />
    </div>
  );
}
