'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { useCatechesisStudents, CatechesisStudent } from '@/hooks/useCatechesisStudents';
import { CatechesisEnrollment, EnrollmentStatus } from '@/hooks/useCatechesisEnrollments';
import { CatechesisProgress, ProgressStatus } from '@/hooks/useCatechesisProgress';
import { ProgressChart } from '@/components/catechesis/ProgressChart';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CATECHESIS_PERMISSIONS } from '@/lib/permissions/catechesis';

interface EnrollmentWithClass extends CatechesisEnrollment {
  className: string;
  classGrade: string | null;
}

interface ProgressWithLesson extends CatechesisProgress {
  lessonTitle: string;
}

export default function CatechesisStudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');

  // Check permission to view students
  const { loading: permissionLoading } = useRequirePermission(CATECHESIS_PERMISSIONS.STUDENTS_VIEW);

  // All hooks must be called before any conditional returns
  const { students, fetchStudents, fetchStudentEnrollments, fetchStudentProgress } = useCatechesisStudents();
  const [student, setStudent] = useState<CatechesisStudent | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentWithClass[]>([]);
  const [progress, setProgress] = useState<ProgressWithLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'enrollments' | 'progress'>('overview');
  const hasLoadedRef = useRef(false);

  usePageTitle(student ? `${student.firstName} ${student.lastName} - ${tCatechesis('students.title')}` : tCatechesis('students.title'));

  // Define loadStudentData before useEffect (must be before conditional return)
  const loadStudentData = useCallback(async (studentId: string) => {
    setLoading(true);
    try {
      const [enrollmentsData, progressData] = await Promise.all([
        fetchStudentEnrollments(studentId),
        fetchStudentProgress(studentId),
      ]);
      setEnrollments(enrollmentsData as EnrollmentWithClass[]);
      setProgress(progressData as ProgressWithLesson[]);
    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchStudentEnrollments, fetchStudentProgress]);

  // Load students when component mounts or id changes
  useEffect(() => {
    if (permissionLoading || !id || hasLoadedRef.current) return;
    
    const loadStudents = async () => {
      await fetchStudents({ pageSize: 1000 });
    };
    
    loadStudents();
  }, [permissionLoading, id, fetchStudents]);

  // Find and set student after students are fetched
  useEffect(() => {
    if (!id || student || !students.length || hasLoadedRef.current) return;
    
    const found = students.find((s) => s.id === id);
    if (found) {
      setStudent(found);
      hasLoadedRef.current = true;
      loadStudentData(id);
    }
  }, [students, id, student, loadStudentData]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  };

  if (loading && !student) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">{t('loading')}</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
            { label: tCatechesis('title'), href: `/${locale}/dashboard/catechesis` },
            { label: tCatechesis('students.title'), href: `/${locale}/dashboard/catechesis/students` },
            { label: id },
          ]}
          title={id}
        />
        <div className="p-4 bg-danger/10 text-danger rounded-md">
          {tCatechesis('errors.studentNotFound')}
        </div>
      </div>
    );
  }

  const enrollmentColumns = [
    { key: 'className' as keyof EnrollmentWithClass, label: tCatechesis('enrollments.class'), sortable: true },
    { key: 'classGrade' as keyof EnrollmentWithClass, label: tCatechesis('classes.grade'), sortable: false },
    {
      key: 'status' as keyof EnrollmentWithClass,
      label: t('status'),
      sortable: false,
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'success' : 'secondary'}>
          {tCatechesis(`enrollments.${value}`)}
        </Badge>
      ),
    },
    {
      key: 'enrolledAt' as keyof EnrollmentWithClass,
      label: tCatechesis('enrollments.enrolledAt'),
      sortable: false,
      render: (value: string | null) => formatDate(value),
    },
  ];

  const progressColumns = [
    { key: 'lessonTitle' as keyof ProgressWithLesson, label: tCatechesis('progress.lesson'), sortable: true },
    {
      key: 'status' as keyof ProgressWithLesson,
      label: t('status'),
      sortable: false,
      render: (value: string) => (
        <Badge variant={value === 'completed' ? 'success' : value === 'in_progress' ? 'warning' : 'secondary'}>
          {tCatechesis(`progress.${value}`)}
        </Badge>
      ),
    },
    {
      key: 'timeSpentMinutes' as keyof ProgressWithLesson,
      label: tCatechesis('progress.timeSpentMinutes'),
      sortable: false,
      render: (value: number | null) => value ? `${value} min` : '-',
    },
    {
      key: 'score' as keyof ProgressWithLesson,
      label: tCatechesis('progress.score'),
      sortable: false,
      render: (value: string | null) => value ? `${value}%` : '-',
    },
    {
      key: 'completedAt' as keyof ProgressWithLesson,
      label: tCatechesis('progress.completedAt'),
      sortable: false,
      render: (value: string | null) => formatDate(value),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tCatechesis('title'), href: `/${locale}/dashboard/catechesis` },
          { label: tCatechesis('students.title'), href: `/${locale}/dashboard/catechesis/students` },
          { label: student ? `${student.firstName} ${student.lastName}` : id },
        ]}
        title={student ? `${student.firstName} ${student.lastName}` : id}
      />

      {/* Student Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {student.dateOfBirth && (
                <p className="text-text-secondary">
                  {tCatechesis('students.born') || 'Born'}: {formatDate(student.dateOfBirth)}
                </p>
              )}
            </div>
            <Badge variant={student.isActive ? 'success' : 'secondary'}>
              {student.isActive ? tCatechesis('status.active') : tCatechesis('status.inactive')}
            </Badge>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {student.parentName && (
              <div>
                <div className="text-sm text-text-secondary">{tCatechesis('students.parentName')}</div>
                <div className="font-medium">{student.parentName}</div>
              </div>
            )}
            {student.parentEmail && (
              <div>
                <div className="text-sm text-text-secondary">{tCatechesis('students.parentEmail')}</div>
                <div className="font-medium">{student.parentEmail}</div>
              </div>
            )}
            {student.parentPhone && (
              <div>
                <div className="text-sm text-text-secondary">{tCatechesis('students.parentPhone')}</div>
                <div className="font-medium">{student.parentPhone}</div>
              </div>
            )}
            {student.address && (
              <div>
                <div className="text-sm text-text-secondary">{tCatechesis('students.address')}</div>
                <div className="font-medium">{student.address}</div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          {(['overview', 'enrollments', 'progress'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tCatechesis(`students.${tab === 'overview' ? 'title' : tab}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">{tCatechesis('students.enrollments')}</h3>
            </CardHeader>
            <CardBody>
              <div className="text-3xl font-bold text-primary">{enrollments.length}</div>
              <div className="text-sm text-text-secondary mt-1">{tCatechesis('students.classEnrollments') || 'Class enrollments'}</div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">{tCatechesis('students.progress')}</h3>
            </CardHeader>
            <CardBody>
              <div className="text-3xl font-bold text-primary">
                {progress.filter((p) => p.status === 'completed').length}
              </div>
              <div className="text-sm text-text-secondary mt-1">{tCatechesis('students.completedLessons') || 'Completed lessons'}</div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'enrollments' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">{tCatechesis('students.enrollments')}</h3>
          </CardHeader>
          <CardBody>
            <Table
              data={enrollments}
              columns={enrollmentColumns}
              emptyMessage="No enrollments"
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'progress' && (
        <div className="space-y-6">
          <ProgressChart progress={progress.map(p => ({
            ...p,
            completedAt: p.completedAt instanceof Date ? p.completedAt.toISOString() : p.completedAt
          }))} />
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">{tCatechesis('progress.title')}</h3>
            </CardHeader>
            <CardBody>
              <Table
                data={progress}
                columns={progressColumns}
                emptyMessage="No progress records"
              />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

