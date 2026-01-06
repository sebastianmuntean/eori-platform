'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { useCatechesisClasses, CatechesisClass } from '@/hooks/useCatechesisClasses';
import { CatechesisStudent } from '@/hooks/useCatechesisStudents';
import { CatechesisLesson } from '@/hooks/useCatechesisLessons';
import { ProgressChart } from '@/components/catechesis/ProgressChart';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CATECHESIS_PERMISSIONS } from '@/lib/permissions/catechesis';

interface ClassStudent extends Pick<CatechesisStudent, 'id' | 'firstName' | 'lastName' | 'dateOfBirth'> {
  status: string;
}

interface ClassLesson extends Pick<CatechesisLesson, 'id' | 'title' | 'orderIndex' | 'durationMinutes' | 'isPublished'> {}

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
  const [classItem, setClassItem] = useState<CatechesisClass | null>(null);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [lessons, setLessons] = useState<ClassLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'lessons' | 'progress'>('overview');
  const hasLoadedRef = useRef(false);

  usePageTitle(classItem?.name ? `${classItem.name} - ${tCatechesis('classes.title')}` : tCatechesis('classes.title'));

  // Define loadClassData before useEffect (must be before conditional return)
  const loadClassData = useCallback(async (classId: string) => {
    setLoading(true);
    try {
      const [studentsData, lessonsData] = await Promise.all([
        fetchClassStudents(classId),
        fetchClassLessons(classId),
      ]);
      setStudents(studentsData as ClassStudent[]);
      setLessons(lessonsData as ClassLesson[]);
    } catch (err) {
      console.error('Failed to load class data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchClassStudents, fetchClassLessons]);

  // Load class data when component mounts or id changes
  useEffect(() => {
    if (permissionLoading || !id || hasLoadedRef.current) return;
    
    const loadClass = async () => {
      await fetchClasses({ pageSize: 1000 });
    };
    
    loadClass();
  }, [permissionLoading, id, fetchClasses]);

  // Find and set class item after classes are fetched
  useEffect(() => {
    if (!id || classItem || !classes.length || hasLoadedRef.current) return;
    
    const found = classes.find((c) => c.id === id);
    if (found) {
      setClassItem(found);
      hasLoadedRef.current = true;
      loadClassData(id);
    }
  }, [classes, id, classItem, loadClassData]);

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  };

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  if (loading && !classItem) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">{t('loading')}</div>
      </div>
    );
  }

  if (!classItem) {
    return (
      <PageContainer>
        <PageHeader
          breadcrumbs={[
            { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
            { label: tCatechesis('title'), href: `/${locale}/dashboard/catechesis` },
            { label: tCatechesis('classes.title'), href: `/${locale}/dashboard/catechesis/classes` },
            { label: id },
          ]}
          title={id}
        />
        <div className="p-4 bg-danger/10 text-danger rounded-md">
          {tCatechesis('errors.classNotFound')}
        </div>
      </PageContainer>
    );
  }

  const studentColumns = [
    { key: 'firstName' as keyof ClassStudent, label: tCatechesis('students.firstName'), sortable: true },
    { key: 'lastName' as keyof ClassStudent, label: tCatechesis('students.lastName'), sortable: true },
    {
      key: 'dateOfBirth' as keyof ClassStudent,
      label: tCatechesis('students.dateOfBirth'),
      sortable: false,
      render: (value: string | null) => formatDate(value),
    },
    {
      key: 'status' as keyof ClassStudent,
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
    { key: 'title' as keyof ClassLesson, label: tCatechesis('lessons.name'), sortable: true },
    {
      key: 'orderIndex' as keyof ClassLesson,
      label: tCatechesis('lessons.orderIndex'),
      sortable: true,
    },
    {
      key: 'durationMinutes' as keyof ClassLesson,
      label: tCatechesis('lessons.durationMinutes'),
      sortable: false,
      render: (value: number | null) => value ? `${value} min` : '-',
    },
    {
      key: 'isPublished' as keyof ClassLesson,
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
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tCatechesis('title'), href: `/${locale}/dashboard/catechesis` },
          { label: tCatechesis('classes.title'), href: `/${locale}/dashboard/catechesis/classes` },
          { label: classItem?.name || id },
        ]}
        title={classItem?.name || id}
      />

      {/* Class Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {classItem.description && (
                <p className="text-text-secondary">{classItem.description}</p>
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
              <div className="text-sm text-text-secondary mt-1">{tCatechesis('classes.enrolledStudents') || 'Enrolled students'}</div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">{tCatechesis('classes.lessons')}</h3>
            </CardHeader>
            <CardBody>
              <div className="text-3xl font-bold text-primary">{lessons.length}</div>
              <div className="text-sm text-text-secondary mt-1">{tCatechesis('classes.assignedLessons') || 'Assigned lessons'}</div>
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
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">{tCatechesis('classes.progress') || 'Progress'}</h3>
          </CardHeader>
          <CardBody>
            {students.length > 0 ? (
              <ProgressChart
                progress={[]}
                className="w-full"
              />
            ) : (
              <div className="text-text-secondary text-center py-8">
                {tCatechesis('classes.noProgressData') || 'No progress data available. Students must be enrolled to track progress.'}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </PageContainer>
  );
}

