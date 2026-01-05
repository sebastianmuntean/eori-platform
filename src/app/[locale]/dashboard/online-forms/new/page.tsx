'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useOnlineForms } from '@/hooks/useOnlineForms';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ONLINE_FORMS_PERMISSIONS } from '@/lib/permissions/onlineForms';

export default function CreateOnlineFormPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tForms = useTranslations('online-forms');

  // Check permission to view online forms (required to create)
  const { loading: permissionLoading } = useRequirePermission(ONLINE_FORMS_PERMISSIONS.VIEW);

  // All hooks must be called before any conditional returns
  const { createForm } = useOnlineForms();
  const { parishes, fetchParishes } = useParishes();

  const [formData, setFormData] = useState({
    parishId: '',
    name: '',
    description: '',
    isActive: true,
    emailValidationMode: 'end' as 'start' | 'end',
    submissionFlow: 'review' as 'direct' | 'review',
    targetModule: 'registratura' as 'registratura' | 'general_register' | 'events' | 'partners',
    successMessage: '',
    errorMessage: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
  }, [permissionLoading, fetchParishes]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

  const handleSave = async () => {
    setErrors({});

    if (!formData.parishId) {
      setErrors({ parishId: t('required') });
      return;
    }

    if (!formData.name.trim()) {
      setErrors({ name: t('required') });
      return;
    }

    setLoading(true);
    try {
      const form = await createForm({
        ...formData,
        description: formData.description || null,
        successMessage: formData.successMessage || null,
        errorMessage: formData.errorMessage || null,
      });

      if (form) {
        router.push(`/${locale}/dashboard/online-forms/${form.id}`);
      }
    } catch (err) {
      console.error('Error creating form:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/online-forms`);
  };

  const targetModuleOptions = [
    { value: 'registratura', label: tForms('targetModuleRegistratura') },
    { value: 'general_register', label: tForms('targetModuleGeneralRegister') },
    { value: 'events', label: tForms('targetModuleEvents') },
    { value: 'partners', label: tForms('targetModulePartners') },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tForms('onlineForms'), href: `/${locale}/dashboard/online-forms` },
          { label: tForms('createForm') },
        ]}
      />

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">{tForms('createForm')}</h1>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <Select
              label={`${t('parish')} *`}
              value={formData.parishId}
              onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
              options={parishes.map(p => ({ value: p.id, label: p.name }))}
              placeholder={t('selectParish')}
              required
              error={errors.parishId}
            />

            <Input
              label={`${tForms('formName')} *`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              error={errors.name}
            />

            <div>
              <label className="block text-sm font-medium mb-1">{tForms('formDescription')}</label>
              <textarea
                className="w-full px-4 py-2 border rounded-md bg-bg-primary text-text-primary"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label={tForms('emailValidationMode')}
                value={formData.emailValidationMode}
                onChange={(e) => setFormData({ ...formData, emailValidationMode: e.target.value as 'start' | 'end' })}
                options={[
                  { value: 'start', label: tForms('emailValidationModeStart') },
                  { value: 'end', label: tForms('emailValidationModeEnd') },
                ]}
              />

              <Select
                label={tForms('submissionFlow')}
                value={formData.submissionFlow}
                onChange={(e) => setFormData({ ...formData, submissionFlow: e.target.value as 'direct' | 'review' })}
                options={[
                  { value: 'direct', label: tForms('submissionFlowDirect') },
                  { value: 'review', label: tForms('submissionFlowReview') },
                ]}
              />
            </div>

            <Select
              label={`${tForms('targetModule')} *`}
              value={formData.targetModule}
              onChange={(e) => setFormData({ ...formData, targetModule: e.target.value as any })}
              options={targetModuleOptions}
              required
            />

            <div>
              <label className="block text-sm font-medium mb-1">{tForms('successMessage')}</label>
              <textarea
                className="w-full px-4 py-2 border rounded-md bg-bg-primary text-text-primary"
                value={formData.successMessage}
                onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })}
                rows={2}
                placeholder="Message shown after successful submission"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{tForms('errorMessage')}</label>
              <textarea
                className="w-full px-4 py-2 border rounded-md bg-bg-primary text-text-primary"
                value={formData.errorMessage}
                onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
                rows={2}
                placeholder="Message shown on submission error"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm">
                {tForms('isActive')}
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="ghost" onClick={handleCancel}>
                {t('cancel')}
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? t('loading') : t('save')}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

