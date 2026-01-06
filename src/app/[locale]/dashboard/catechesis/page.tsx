'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useCatechesisClasses } from '@/hooks/useCatechesisClasses';
import { useCatechesisStudents } from '@/hooks/useCatechesisStudents';
import { useCatechesisLessons } from '@/hooks/useCatechesisLessons';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CATECHESIS_PERMISSIONS } from '@/lib/permissions/catechesis';

export default function CatechesisPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');
  usePageTitle(tCatechesis('title'));

  // Check permission to access Catechesis module
  const { loading } = useRequirePermission(CATECHESIS_PERMISSIONS.CLASSES_VIEW);

  // All hooks must be called before any conditional returns
  const { classes, fetchClasses, loading: classesLoading } = useCatechesisClasses();
  const { students, fetchStudents, loading: studentsLoading } = useCatechesisStudents();
  const { lessons, fetchLessons, loading: lessonsLoading } = useCatechesisLessons();

  useEffect(() => {
    if (loading) return;
    fetchClasses({ pageSize: 10 });
    fetchStudents({ pageSize: 10 });
    fetchLessons({ pageSize: 10 });
  }, [loading, fetchClasses, fetchStudents, fetchLessons]);

  // Don't render content while checking permissions (after all hooks are called)
  if (loading) {
    return null;
  }

  const activeClasses = classes.filter((c) => c.isActive).length;
  const activeStudents = students.filter((s) => s.isActive).length;
  const publishedLessons = lessons.filter((l) => l.isPublished).length;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tCatechesis('title') },
        ]}
        title={tCatechesis('title')}
        description={tCatechesis('description')}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">{tCatechesis('classes.title')}</h3>
          </CardHeader>
          <CardBody>
            <div className="text-3xl font-bold text-primary">{activeClasses}</div>
            <div className="text-sm text-text-secondary mt-1">{tCatechesis('activeClasses')}</div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">{tCatechesis('students.title')}</h3>
          </CardHeader>
          <CardBody>
            <div className="text-3xl font-bold text-primary">{activeStudents}</div>
            <div className="text-sm text-text-secondary mt-1">{tCatechesis('activeStudents')}</div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">{tCatechesis('lessons.title')}</h3>
          </CardHeader>
          <CardBody>
            <div className="text-3xl font-bold text-primary">{publishedLessons}</div>
            <div className="text-sm text-text-secondary mt-1">{tCatechesis('publishedLessons')}</div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">{tCatechesis('quickLinks')}</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href={`/${locale}/dashboard/catechesis/classes`}
              className="p-4 border border-border rounded-md hover:bg-bg-secondary transition-colors"
            >
              <div className="font-medium">{tCatechesis('classes.title')}</div>
              <div className="text-sm text-text-secondary">{tCatechesis('manageClasses')}</div>
            </a>
            <a
              href={`/${locale}/dashboard/catechesis/students`}
              className="p-4 border border-border rounded-md hover:bg-bg-secondary transition-colors"
            >
              <div className="font-medium">{tCatechesis('students.title')}</div>
              <div className="text-sm text-text-secondary">{tCatechesis('manageStudents')}</div>
            </a>
            <a
              href={`/${locale}/dashboard/catechesis/lessons`}
              className="p-4 border border-border rounded-md hover:bg-bg-secondary transition-colors"
            >
              <div className="font-medium">{tCatechesis('lessons.title')}</div>
              <div className="text-sm text-text-secondary">{tCatechesis('manageLessons')}</div>
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}


