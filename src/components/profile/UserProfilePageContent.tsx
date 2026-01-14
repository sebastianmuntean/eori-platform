'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { useProfile, UpdateProfileData, ChangePasswordData } from '@/hooks/useProfile';
import { UserProfileForm } from './UserProfileForm';
import { PasswordChangeForm } from './PasswordChangeForm';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

interface UserProfilePageContentProps {
  locale: string;
}

export function UserProfilePageContent({ locale }: UserProfilePageContentProps) {
  const t = useTranslations('common');
  const tProfile = useTranslations('profile');
  const { profile, loading, error, fetchProfile, updateProfile, changePassword } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileFormData, setProfileFormData] = useState<UpdateProfileData>({});
  const [passwordFormData, setPasswordFormData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string | undefined>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string | undefined>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setProfileFormData({
        name: profile.name,
        email: profile.email,
        address: profile.address || undefined,
        city: profile.city || undefined,
        phone: profile.phone || undefined,
      });
    }
  }, [profile]);

  const handleProfileFieldChange = (field: keyof UpdateProfileData, value: string) => {
    setProfileFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileClearError = (field: keyof UpdateProfileData) => {
    setProfileErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePasswordFieldChange = (field: keyof ChangePasswordData, value: string) => {
    setPasswordFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordClearError = (field: keyof ChangePasswordData) => {
    setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setProfileErrors({});
    setSuccessMessage(null);

    // Validate required fields
    if (!profileFormData.name?.trim()) {
      setProfileErrors({ name: tProfile('nameRequired') || 'Name is required' });
      return;
    }

    if (!profileFormData.email?.trim()) {
      setProfileErrors({ email: tProfile('emailRequired') || 'Email is required' });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileFormData.email)) {
      setProfileErrors({ email: tProfile('invalidEmail') || 'Invalid email address' });
      return;
    }

    const success = await updateProfile(profileFormData);

    if (success) {
      setIsEditing(false);
      setSuccessMessage(tProfile('profileUpdated') || 'Profile updated successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } else {
      setProfileErrors({ general: tProfile('updateError') || 'Failed to update profile' });
    }
  };

  const handleChangePassword = async () => {
    setPasswordErrors({});
    setSuccessMessage(null);

    // Validate required fields
    if (!passwordFormData.currentPassword) {
      setPasswordErrors({ currentPassword: tProfile('currentPasswordRequired') || 'Current password is required' });
      return;
    }

    if (!passwordFormData.newPassword) {
      setPasswordErrors({ newPassword: tProfile('newPasswordRequired') || 'New password is required' });
      return;
    }

    if (passwordFormData.newPassword.length < 8) {
      setPasswordErrors({ newPassword: tProfile('passwordMinLength') || 'Password must be at least 8 characters' });
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordErrors({ confirmPassword: tProfile('passwordsDoNotMatch') || 'Passwords do not match' });
      return;
    }

    const success = await changePassword(passwordFormData);

    if (success) {
      setIsChangingPassword(false);
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setSuccessMessage(tProfile('passwordChanged') || 'Password changed successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } else {
      setPasswordErrors({ general: tProfile('passwordChangeError') || 'Failed to change password' });
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      episcop: t('episcop') || 'Episcop',
      vicar: t('vicar') || 'Vicar',
      paroh: t('paroh') || 'Paroh',
      secretar: t('secretar') || 'Secretar',
      contabil: t('contabil') || 'Contabil',
    };
    return roleLabels[role] || role;
  };

  const getApprovalStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      pending: t('pending') || 'Pending',
      approved: t('approved') || 'Approved',
      rejected: t('rejected') || 'Rejected',
    };
    return statusLabels[status] || status;
  };

  if (loading && !profile) {
    return (
      <PageContainer>
        <PageHeader
          breadcrumbs={[
            { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
            { label: tProfile('title') || 'Profile' },
          ]}
          title={tProfile('title') || 'Profile'}
          className="mb-6"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">{t('loading')}</div>
        </div>
      </PageContainer>
    );
  }

  if (error && !profile) {
    return (
      <PageContainer>
        <PageHeader
          breadcrumbs={[
            { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
            { label: tProfile('title') || 'Profile' },
          ]}
          title={tProfile('title') || 'Profile'}
          className="mb-6"
        />
        <Card>
          <CardBody>
            <div className="text-danger">{error}</div>
            <Button onClick={fetchProfile} className="mt-4">
              {t('retry') || 'Retry'}
            </Button>
          </CardBody>
        </Card>
      </PageContainer>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tProfile('title') || 'Profile' },
        ]}
        title={tProfile('title') || 'Profile'}
        className="mb-6"
      />

      {successMessage && (
        <div className="mb-6 p-4 rounded-md bg-success bg-opacity-10 border border-success text-success">
          {successMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{tProfile('profileInformation') || 'Profile Information'}</h2>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="primary">
                  {tProfile('editProfile') || 'Edit Profile'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {isEditing ? (
              <div className="space-y-4">
                {profileErrors.general && (
                  <div className="p-3 rounded-md bg-danger bg-opacity-10 border border-danger text-danger text-sm">
                    {profileErrors.general}
                  </div>
                )}

                <UserProfileForm
                  profile={profile}
                  formData={profileFormData}
                  errors={profileErrors}
                  isSubmitting={loading}
                  onFieldChange={handleProfileFieldChange}
                  onClearError={handleProfileClearError}
                />

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSaveProfile} variant="primary" disabled={loading}>
                    {tProfile('saveChanges') || 'Save Changes'}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setProfileErrors({});
                      setProfileFormData({
                        name: profile.name,
                        email: profile.email,
                        address: profile.address || undefined,
                        city: profile.city || undefined,
                        phone: profile.phone || undefined,
                      });
                    }}
                    variant="secondary"
                    disabled={loading}
                  >
                    {tProfile('cancel') || 'Cancel'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-text-secondary">{t('name') || 'Name'}</label>
                    <p className="mt-1 text-text-primary">{profile.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary">{t('email') || 'Email'}</label>
                    <p className="mt-1 text-text-primary">{profile.email}</p>
                  </div>
                  {profile.address && (
                    <div>
                      <label className="text-sm font-medium text-text-secondary">{t('address') || 'Address'}</label>
                      <p className="mt-1 text-text-primary">{profile.address}</p>
                    </div>
                  )}
                  {profile.city && (
                    <div>
                      <label className="text-sm font-medium text-text-secondary">{t('city') || 'City'}</label>
                      <p className="mt-1 text-text-primary">{profile.city}</p>
                    </div>
                  )}
                  {profile.phone && (
                    <div>
                      <label className="text-sm font-medium text-text-secondary">{t('phone') || 'Phone'}</label>
                      <p className="mt-1 text-text-primary">{profile.phone}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-text-secondary">{t('role') || 'Role'}</label>
                    <p className="mt-1">
                      <Badge variant="info">{getRoleLabel(profile.role)}</Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary">
                      {t('approvalStatus') || 'Approval Status'}
                    </label>
                    <p className="mt-1">
                      <Badge
                        variant={
                          profile.approvalStatus === 'approved'
                            ? 'success'
                            : profile.approvalStatus === 'pending'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {getApprovalStatusLabel(profile.approvalStatus)}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Password Change Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">{tProfile('changePassword') || 'Change Password'}</h2>
          </CardHeader>
          <CardBody>
            {isChangingPassword ? (
              <div className="space-y-4">
                {passwordErrors.general && (
                  <div className="p-3 rounded-md bg-danger bg-opacity-10 border border-danger text-danger text-sm">
                    {passwordErrors.general}
                  </div>
                )}

                <PasswordChangeForm
                  formData={passwordFormData}
                  errors={passwordErrors}
                  isSubmitting={loading}
                  onFieldChange={handlePasswordFieldChange}
                  onClearError={handlePasswordClearError}
                />

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleChangePassword} variant="primary" disabled={loading}>
                    {tProfile('changePassword') || 'Change Password'}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordErrors({});
                      setPasswordFormData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                    variant="secondary"
                    disabled={loading}
                  >
                    {tProfile('cancel') || 'Cancel'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-text-secondary">{tProfile('passwordChangeDescription') || 'Click the button below to change your password.'}</p>
                <Button onClick={() => setIsChangingPassword(true)} variant="primary">
                  {tProfile('changePassword') || 'Change Password'}
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  );
}
