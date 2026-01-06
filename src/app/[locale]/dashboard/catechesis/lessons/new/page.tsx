'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ToastContainer } from '@/components/ui/Toast';
import { useCatechesisLessons, CatechesisLesson } from '@/hooks/useCatechesisLessons';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/hooks/useToast';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CATECHESIS_PERMISSIONS } from '@/lib/permissions/catechesis';

interface LessonFormData {
  title: string;
  description: string;
  content: string;
  orderIndex: number;
  durationMinutes: string;
  isPublished: boolean;
}

export default function NewCatechesisLessonPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');
  const { toasts, success, error: showError, removeToast } = useToast();

  // Check permission to view lessons (required to access create page)
  const { loading: permissionLoading } = useRequirePermission(CATECHESIS_PERMISSIONS.LESSONS_VIEW);

  // All hooks must be called before any conditional returns
  const { createLesson, loading, error } = useCatechesisLessons();
  const { user } = useUser();

  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    content: '',
    orderIndex: 0,
    durationMinutes: '',
    isPublished: false,
  });

  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof LessonFormData, string>>>({});

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof LessonFormData, string>> = {};
    
    if (!formData.title.trim()) {
      errors.title = tCatechesis('validations.titleRequired') || 'Title is required';
    }
    
    if (!user?.parishId) {
      showError(tCatechesis('errors.parishRequired') || 'Parish is required');
      return false;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm() || !user?.parishId) {
      return;
    }

    const lessonData: Partial<CatechesisLesson> = {
      parishId: user.parishId,
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      content: formData.content.trim() || null,
      orderIndex: formData.orderIndex,
      durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes, 10) : null,
      isPublished: formData.isPublished,
    };

    const result = await createLesson(lessonData);

    if (result) {
      success(tCatechesis('actions.create') + ' ' + t('success') || 'Lesson created successfully');
      router.push(`/${locale}/dashboard/catechesis/lessons/${result.id}`);
    } else {
      showError(error || tCatechesis('errors.failedToCreate') || 'Failed to create lesson');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">{t('loading')}</div>
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tCatechesis('title'), href: `/${locale}/dashboard/catechesis` },
          { label: tCatechesis('lessons.title'), href: `/${locale}/dashboard/catechesis/lessons` },
          { label: tCatechesis('actions.create') + ' ' + tCatechesis('lessons.title') },
        ]}
        title={tCatechesis('actions.create') + ' ' + tCatechesis('lessons.title')}
        description={tCatechesis('lessons.createDescription') || 'Create a new lesson'}
      />

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">{tCatechesis('lessons.title')}</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <Input
              label={tCatechesis('lessons.name')}
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (validationErrors.title) {
                  setValidationErrors({ ...validationErrors, title: undefined });
                }
              }}
              error={validationErrors.title}
              required
            />
            <Textarea
              label={tCatechesis('lessons.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {tCatechesis('lessons.content')} (HTML)
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-md bg-bg-primary text-text-primary font-mono text-sm"
                rows={20}
                placeholder="Enter HTML content for the lesson..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label={tCatechesis('lessons.orderIndex')}
                type="number"
                value={formData.orderIndex.toString()}
                onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
              />
              <Input
                label={tCatechesis('lessons.durationMinutes')}
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
              />
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isPublished" className="text-sm text-text-primary">
                  {tCatechesis('lessons.isPublished')}
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => router.push(`/${locale}/dashboard/catechesis/lessons`)}
              >
                {t('cancel')}
              </Button>
              <Button onClick={handleCreate} disabled={loading || !formData.title.trim()}>
                {loading ? t('saving') || t('save') : t('save')}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </PageContainer>
  );
}
