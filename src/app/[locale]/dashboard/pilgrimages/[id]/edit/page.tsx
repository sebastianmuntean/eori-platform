'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePilgrimage } from '@/hooks/usePilgrimage';
import { usePilgrimages, PilgrimageStatus } from '@/hooks/usePilgrimages';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PILGRIMAGES_PERMISSIONS } from '@/lib/permissions/pilgrimages';

export default function EditPilgrimagePage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');

  // Check permission to view pilgrimages
  const { loading: permissionLoading } = useRequirePermission(PILGRIMAGES_PERMISSIONS.VIEW);

  // All hooks must be called before any conditional returns
  const { pilgrimage, loading: loadingPilgrimage, fetchPilgrimage } = usePilgrimage();
  usePageTitle(pilgrimage?.title ? `${t('edit')} ${pilgrimage.title}` : tPilgrimages('pilgrimages'));
  const { updatePilgrimage, loading } = usePilgrimages();
  const { parishes, fetchParishes } = useParishes();

  const [formData, setFormData] = useState({
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
  }, [permissionLoading, fetchParishes]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

  useEffect(() => {
    if (id) {
      fetchPilgrimage(id);
    }
  }, [id, fetchPilgrimage]);

  useEffect(() => {
    if (pilgrimage) {
      setFormData({
        parishId: pilgrimage.parishId,
        title: pilgrimage.title,
        description: pilgrimage.description || '',
        destination: pilgrimage.destination || '',
        startDate: pilgrimage.startDate || '',
        endDate: pilgrimage.endDate || '',
        registrationDeadline: pilgrimage.registrationDeadline || '',
        maxParticipants: pilgrimage.maxParticipants?.toString() || '',
        minParticipants: pilgrimage.minParticipants?.toString() || '',
        status: pilgrimage.status,
        pricePerPerson: pilgrimage.pricePerPerson || '',
        currency: pilgrimage.currency || 'RON',
        organizerName: pilgrimage.organizerName || '',
        organizerContact: pilgrimage.organizerContact || '',
        notes: pilgrimage.notes || '',
      });
    }
  }, [pilgrimage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.parishId) {
      setErrors({ parishId: t('fieldRequired') });
      return;
    }

    if (!formData.title.trim()) {
      setErrors({ title: tPilgrimages('titleRequired') });
      return;
    }

    const result = await updatePilgrimage(id, {
      ...formData,
      description: formData.description || null,
      destination: formData.destination || null,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      registrationDeadline: formData.registrationDeadline || null,
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
      minParticipants: formData.minParticipants ? parseInt(formData.minParticipants) : null,
      pricePerPerson: formData.pricePerPerson || null,
      organizerName: formData.organizerName || null,
      organizerContact: formData.organizerContact || null,
      notes: formData.notes || null,
    });

    if (result) {
      router.push(`/${locale}/dashboard/pilgrimages/${id}`);
    }
  };

  if (loadingPilgrimage && !pilgrimage) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">{t('loading')}</div>
      </div>
    );
  }

  if (!pilgrimage) {
    return (
      <div className="p-4 bg-danger/10 text-danger rounded-md">
        {tPilgrimages('errors.pilgrimageNotFound')}
      </div>
    );
  }

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: tPilgrimages('pilgrimages'), href: `/${locale}/dashboard/pilgrimages` },
    { label: pilgrimage.title, href: `/${locale}/dashboard/pilgrimages/${id}` },
    { label: t('edit') },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={tPilgrimages('editPilgrimage') || 'Edit Pilgrimage'}
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
                onChange={(e) => {
                  setFormData({ ...formData, parishId: e.target.value });
                  if (errors.parishId) setErrors({ ...errors, parishId: '' });
                }}
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
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                error={errors.title}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('status')}</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PilgrimageStatus })}
              >
                <option value="draft">{tPilgrimages('statuses.draft')}</option>
                <option value="open">{tPilgrimages('statuses.open')}</option>
                <option value="closed">{tPilgrimages('statuses.closed')}</option>
                <option value="in_progress">{tPilgrimages('statuses.in_progress')}</option>
                <option value="completed">{tPilgrimages('statuses.completed')}</option>
                <option value="cancelled">{tPilgrimages('statuses.cancelled')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('description')}</label>
              <textarea
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-bg-primary text-text-primary"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={tPilgrimages('description')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('destination')}</label>
              <Input
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{tPilgrimages('startDate')}</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{tPilgrimages('endDate')}</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{tPilgrimages('registrationDeadline')}</label>
                <Input
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{tPilgrimages('maxParticipants')}</label>
                <Input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{tPilgrimages('minParticipants')}</label>
                <Input
                  type="number"
                  value={formData.minParticipants}
                  onChange={(e) => setFormData({ ...formData, minParticipants: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, pricePerPerson: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{tPilgrimages('currency')}</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{tPilgrimages('organizerContact')}</label>
                <Input
                  value={formData.organizerContact}
                  onChange={(e) => setFormData({ ...formData, organizerContact: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('notes')}</label>
              <textarea
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-bg-primary text-text-primary"
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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


