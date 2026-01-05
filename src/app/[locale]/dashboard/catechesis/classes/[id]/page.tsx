'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { useCatechesisClasses } from '@/hooks/useCatechesisClasses';
import { ProgressChart } from '@/components/catechesis/ProgressChart';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CATECHESIS_PERMISSIONS } from '@/lib/permissions/catechesis';

export default function CatechesisClassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');

  // Check permission to view classes
  const { loading: permissionLoading } = useRequirePermission(CATECHESIS_PERMISSIONS.CLASSES_VIEW);

  // All hooks must be called before any conditional returns
  const { classes, fetchClasses, fetchClassStudents, fetchClassLessons } = useCatechesisClasses();
  const [classItem, setClassItem] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'lessons' | 'progress'>('overview');

  usePageTitle(classItem?.name ? `${classItem.name} - ${tCatechesis('classes.title')}` : tCatechesis('classes.title'));

  // Define loadClassData before useEffect (must be before conditional return)
  const loadClassData = useCallback(async (classId: string) => {
    setLoading(true);
    try {
      const [studentsData, lessonsData] = await Promise.all([
        fetchClassStudents(classId),
        fetchClassLessons(classId),
      ]);
      setStudents(studentsData);
      setLessons(lessonsData);
    } catch (err) {
      console.error('Failed to load class data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchClassStudents, fetchClassLessons]);

  useEffect(() => {
    if (permissionLoading) return;
    if (id) {
      fetchClasses({ pageSize: 1000 }).then(() => {
        const found = classes.find((c) => c.id === id);
        if (found) {
          setClassItem(found);
          loadClassData(id);
        }
      });
    }
  }, [permissionLoading, id, fetchClasses, classes, loadClassData]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  };

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: tCatechesis('title'), href: `/${locale}/dashboard/catechesis` },
    { label: tCatechesis('classes.title'), href: `/${locale}/dashboard/catechesis/classes` },
    { label: classItem?.name || id },
  ];

  if (loading && !classItem) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">{t('loading')}</div>
      </div>
    );
  }

  if (!classItem) {
    return (
      <div className="p-4 bg-danger/10 text-danger rounded-md">
        {tCatechesis('errors.classNotFound')}
      </div>
    );
  }

  const studentColumns = [
    { key: 'firstName', label: tCatechesis('students.firstName'), sortable: true },
    { key: 'lastName', label: tCatechesis('students.lastName'), sortable: true },
    {
      key: 'dateOfBirth',
      label: tCatechesis('students.dateOfBirth'),
      sortable: false,
      render: (value: string | null) => formatDate(value),
    },
    {
      key: 'status',
      label: t('status'),
      sortable: false,
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'success' : 'secondary'}>
          {tCatechesis(`enrollments.${value}`)}
        </Badge>
      ),
    },
  ];

  const lessonColumns = [
    { key: 'title', label: tCatechesis('lessons.name'), sortable: true },
    {
      key: 'orderIndex',
      label: tCatechesis('lessons.orderIndex'),
      sortable: true,
    },
    {
      key: 'durationMinutes',
      label: tCatechesis('lessons.durationMinutes'),
      sortable: false,
      render: (value: number | null) => value ? `${value} min` : '-',
    },
    {
      key: 'isPublished',
      label: t('status'),
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'}>
          {value ? tCatechesis('status.published') : tCatechesis('status.unpublished')}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      {/* Class Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{classItem.name}</h1>
              {classItem.description && (
                <p className="text-text-secondary mt-1">{classItem.description}</p>
              )}
            </div>
            <Badge variant={classItem.isActive ? 'success' : 'secondary'}>
              {classItem.isActive ? tCatechesis('status.active') : tCatechesis('status.inactive')}
            </Badge>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-text-secondary">{tCatechesis('classes.grade')}</div>
              <div className="font-medium">{classItem.grade || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-text-secondary">{tCatechesis('classes.startDate')}</div>
              <div className="font-medium">{formatDate(classItem.startDate)}</div>
            </div>
            <div>
              <div className="text-sm text-text-secondary">{tCatechesis('classes.endDate')}</div>
              <div className="font-medium">{formatDate(classItem.endDate)}</div>
            </div>
            <div>
              <div className="text-sm text-text-secondary">{tCatechesis('classes.maxStudents')}</div>
              <div className="font-medium">{classItem.maxStudents || '-'}</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          {(['overview', 'students', 'lessons', 'progress'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tCatechesis(`classes.${tab === 'overview' ? 'title' : tab}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">{tCatechesis('classes.students')}</h3>
            </CardHeader>
            <CardBody>
              <div className="text-3xl font-bold text-primary">{students.length}</div>
              <div className="text-sm text-text-secondary mt-1">Enrolled students</div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">{tCatechesis('classes.lessons')}</h3>
            </CardHeader>
            <CardBody>
              <div className="text-3xl font-bold text-primary">{lessons.length}</div>
              <div className="text-sm text-text-secondary mt-1">Assigned lessons</div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'students' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">{tCatechesis('classes.students')}</h3>
          </CardHeader>
          <CardBody>
            <Table
              data={students}
              columns={studentColumns}
              emptyMessage="No students enrolled"
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'lessons' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{tCatechesis('classes.lessons')}</h3>
              <Button
                size="sm"
                onClick={() => router.push(`/${locale}/dashboard/catechesis/lessons?classId=${id}`)}
              >
                {tCatechesis('actions.assign')} {tCatechesis('lessons.title')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <Table
              data={lessons}
              columns={lessonColumns}
              emptyMessage="No lessons assigned"
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'progress' && (
        <ProgressChart
          progress={[]}
          className="w-full"
        />
      )}
    </div>
  );
}

