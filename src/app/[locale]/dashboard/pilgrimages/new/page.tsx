'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePilgrimages, PilgrimageStatus } from '@/hooks/usePilgrimages';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PILGRIMAGES_PERMISSIONS } from '@/lib/permissions/pilgrimages';

export default function NewPilgrimagePage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');
  usePageTitle(`${t('create')} ${tPilgrimages('pilgrimages')}`);

  // Check permission to view pilgrimages
  const { loading: permissionLoading } = useRequirePermission(PILGRIMAGES_PERMISSIONS.VIEW);

  // All hooks must be called before any conditional returns
  const { createPilgrimage, loading } = usePilgrimages();
  const { parishes, fetchParishes } = useParishes();

  // Initial form data constant
  const initialFormData = useMemo(
    () => ({
      parishId: '',
      title: '',
      description: '',
      destination: '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      maxParticipants: '',
      minParticipants: '',
      status: 'draft' as PilgrimageStatus,
      pricePerPerson: '',
      currency: 'RON',
      organizerName: '',
      organizerContact: '',
      notes: '',
    }),
    []
  );

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
  }, [permissionLoading, fetchParishes]);

  // Helper function to transform form data to API format
  const transformFormDataToApi = useCallback(
    (data: typeof initialFormData) => ({
      ...data,
      description: data.description || null,
      destination: data.destination || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      registrationDeadline: data.registrationDeadline || null,
      maxParticipants: data.maxParticipants ? parseInt(data.maxParticipants, 10) : null,
      minParticipants: data.minParticipants ? parseInt(data.minParticipants, 10) : null,
      pricePerPerson: data.pricePerPerson || null,
      organizerName: data.organizerName || null,
      organizerContact: data.organizerContact || null,
      notes: data.notes || null,
    }),
    []
  );

  // Validation function
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.parishId) {
      newErrors.parishId = t('fieldRequired');
    }

    if (!formData.title.trim()) {
      newErrors.title = tPilgrimages('titleRequired');
    }

    return newErrors;
  }, [formData, t, tPilgrimages]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationErrors = validateForm();

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setErrors({});
      const result = await createPilgrimage(transformFormDataToApi(formData));

      if (result) {
        router.push(`/${locale}/dashboard/pilgrimages/${result.id}`);
      }
    },
    [formData, validateForm, createPilgrimage, transformFormDataToApi, router, locale]
  );

  // Handler to update form field and clear error
  const handleFieldChange = useCallback(
    <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const breadcrumbs = useMemo(
    () => [
      { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
      { label: tPilgrimages('pilgrimages'), href: `/${locale}/dashboard/pilgrimages` },
      { label: tPilgrimages('newPilgrimage') },
    ],
    [t, tPilgrimages, locale]
  );

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={tPilgrimages('newPilgrimage') || 'New Pilgrimage'}
        className="mb-6"
      />
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">{t('parish')} *</label>
              <select
                className={`w-full px-3 py-2 border rounded-md bg-background text-text-primary ${errors.parishId ? 'border-danger' : 'border-border'}`}
                value={formData.parishId}
                onChange={(e) => handleFieldChange('parishId', e.target.value)}
                required
              >
                <option value="">{t('selectParish')}</option>
                {parishes.map((parish) => (
                  <option key={parish.id} value={parish.id}>
                    {parish.name}
                  </option>
                ))}
              </select>
              {errors.parishId && <p className="text-danger text-sm mt-1">{errors.parishId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('titleField')} *</label>
              <Input
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                error={errors.title}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('description')}</label>
              <textarea
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-bg-primary text-text-primary"
                rows={4}
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder={tPilgrimages('description')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('destination')}</label>
              <Input
                value={formData.destination}
                onChange={(e) => handleFieldChange('destination', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{tPilgrimages('startDate')}</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleFieldChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{tPilgrimages('endDate')}</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleFieldChange('endDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{tPilgrimages('registrationDeadline')}</label>
                <Input
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={(e) => handleFieldChange('registrationDeadline', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{tPilgrimages('maxParticipants')}</label>
                <Input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => handleFieldChange('maxParticipants', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{tPilgrimages('minParticipants')}</label>
                <Input
                  type="number"
                  value={formData.minParticipants}
                  onChange={(e) => handleFieldChange('minParticipants', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{tPilgrimages('pricePerPerson')}</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.pricePerPerson}
                  onChange={(e) => handleFieldChange('pricePerPerson', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{tPilgrimages('currency')}</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
                  value={formData.currency}
                  onChange={(e) => handleFieldChange('currency', e.target.value)}
                >
                  <option value="RON">RON</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{tPilgrimages('organizerName')}</label>
                <Input
                  value={formData.organizerName}
                  onChange={(e) => handleFieldChange('organizerName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{tPilgrimages('organizerContact')}</label>
                <Input
                  value={formData.organizerContact}
                  onChange={(e) => handleFieldChange('organizerContact', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('notes')}</label>
              <textarea
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-bg-primary text-text-primary"
                rows={4}
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder={tPilgrimages('notes')}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (t('saving') || 'Saving...') : t('save')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}


