'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Select } from '@/components/ui/Select';
import { ToastContainer } from '@/components/ui/Toast';
import { useCatechesisLessons, CatechesisLesson } from '@/hooks/useCatechesisLessons';
import { useCatechesisClasses } from '@/hooks/useCatechesisClasses';
import { useToast } from '@/hooks/useToast';
import { useTranslations } from 'next-intl';
import { formatDate as formatDateUtil } from '@/utils/date';

interface LessonsPageContentProps {
  locale: string;
}

/**
 * Lessons page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function LessonsPageContent({ locale }: LessonsPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');
  const { toasts, success, error: showError, removeToast } = useToast();

  const { lessons, loading, error, pagination, fetchLessons, deleteLesson } = useCatechesisLessons();
  const { classes, fetchClasses } = useCatechesisClasses();

  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState(searchParams.get('classId') || '');
  const [isPublishedFilter, setIsPublishedFilter] = useState<boolean | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync URL query params with filter state
  const updateUrlParams = useCallback((updates: { classId?: string; page?: number }) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (updates.classId !== undefined) {
      if (updates.classId) {
        newParams.set('classId', updates.classId);
      } else {
        newParams.delete('classId');
      }
    }
    
    if (updates.page !== undefined && updates.page > 1) {
      newParams.set('page', updates.page.toString());
    } else {
      newParams.delete('page');
    }

    const newUrl = newParams.toString() ? `?${newParams.toString()}` : '';
    router.replace(`/${locale}/dashboard/catechesis/lessons${newUrl}`, { scroll: false });
  }, [searchParams, router, locale]);

  useEffect(() => {
    fetchClasses({ pageSize: 1000 });
  }, [fetchClasses]);

  // Build fetch parameters
  const fetchParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      classId: classFilter || undefined,
      isPublished: isPublishedFilter !== '' ? isPublishedFilter : undefined,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    }),
    [currentPage, searchTerm, classFilter, isPublishedFilter]
  );

  // Fetch lessons when filters or page changes
  useEffect(() => {
    fetchLessons(fetchParams);
  }, [fetchParams, fetchLessons]);

  const formatDate = useCallback((date: string | null) => formatDateUtil(date, locale), [locale]);

  const columns = useMemo(() => [
    { key: 'title' as keyof CatechesisLesson, label: tCatechesis('lessons.name'), sortable: true },
    {
      key: 'className' as keyof CatechesisLesson,
      label: tCatechesis('classes.title'),
      sortable: false,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'orderIndex' as keyof CatechesisLesson,
      label: tCatechesis('lessons.orderIndex'),
      sortable: true,
    },
    {
      key: 'durationMinutes' as keyof CatechesisLesson,
      label: tCatechesis('lessons.durationMinutes'),
      sortable: false,
      render: (value: number | null) => (value ? `${value} min` : '-'),
    },
    {
      key: 'isPublished' as keyof CatechesisLesson,
      label: t('status'),
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'}>
          {value ? tCatechesis('status.published') : tCatechesis('status.unpublished')}
        </Badge>
      ),
    },
    {
      key: 'createdAt' as keyof CatechesisLesson,
      label: t('createdAt'),
      sortable: false,
      render: (value: string | null) => formatDate(value),
    },
    {
      key: 'actions' as keyof CatechesisLesson,
      label: t('actions'),
      sortable: false,
      render: (_value: unknown, row: CatechesisLesson) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/${locale}/dashboard/catechesis/lessons/${row.id}`)}
          >
            {tCatechesis('actions.edit')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/${locale}/dashboard/catechesis/lessons/${row.id}/view`)}
          >
            {tCatechesis('lessons.view')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteConfirm(row.id)}
          >
            {tCatechesis('actions.delete')}
          </Button>
        </div>
      ),
    },
  ], [tCatechesis, t, formatDate, router, locale, setDeleteConfirm]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteLesson(id);
      
      if (result) {
        setDeleteConfirm(null);
        success(tCatechesis('actions.delete') + ' ' + t('success') || 'Lesson deleted successfully');
        // Refresh the list to ensure UI is in sync
        fetchLessons(fetchParams);
      } else {
        showError(tCatechesis('errors.failedToDelete') || 'Failed to delete lesson');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : tCatechesis('errors.failedToDelete') || 'Failed to delete lesson');
    } finally {
      setDeletingId(null);
    }
  }, [deleteLesson, success, showError, fetchLessons, fetchParams, t, tCatechesis]);

  const handleClassFilterChange = (value: string) => {
    setClassFilter(value);
    setCurrentPage(1);
    updateUrlParams({ classId: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams({ page: newPage });
  };

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tCatechesis('title'), href: `/${locale}/dashboard/catechesis` },
          { label: tCatechesis('lessons.title') },
        ]}
        title={tCatechesis('lessons.title')}
        description={tCatechesis('lessons.description') || tCatechesis('manageLessons') || 'Manage lessons'}
        action={
          <Button onClick={() => router.push(`/${locale}/dashboard/catechesis/lessons/new`)}>
            {tCatechesis('actions.create')} {tCatechesis('lessons.title')}
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Select
              value={classFilter}
              onChange={(e) => handleClassFilterChange(e.target.value)}
              options={[
                { value: '', label: tCatechesis('filters.allClasses') || 'All Classes' },
                ...classes.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Select
              value={isPublishedFilter.toString()}
              onChange={(e) => {
                setIsPublishedFilter(e.target.value === '' ? '' : e.target.value === 'true');
                setCurrentPage(1);
              }}
              options={[
                { value: '', label: tCatechesis('filters.allStatus') || 'All Status' },
                { value: 'true', label: tCatechesis('status.published') },
                { value: 'false', label: tCatechesis('status.unpublished') },
              ]}
            />
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardBody>
          {loading && !lessons.length ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-text-secondary">{t('loading')}</div>
            </div>
          ) : error ? (
            <div className="p-4 bg-danger/10 text-danger rounded-md">{error}</div>
          ) : (
            <>
              <Table
                data={lessons}
                columns={columns}
                emptyMessage={t('noData')}
              />
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-text-secondary">
                    {t('page')} {pagination.page} {t('of')} {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      {t('previous')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(Math.min(pagination.totalPages, currentPage + 1))}
                      disabled={currentPage === pagination.totalPages}
                    >
                      {t('next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title={t('confirm')}
        message={tCatechesis('confirmations.deleteLesson') || 'Are you sure you want to delete this lesson?'}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        variant="danger"
        isLoading={deletingId === deleteConfirm}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </PageContainer>
  );
}

