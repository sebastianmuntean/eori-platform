'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useOnlineForms, OnlineForm, FormTargetModule } from '@/hooks/useOnlineForms';
import { useParishes } from '@/hooks/useParishes';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { useTranslations } from 'next-intl';
import { getTargetModuleLabel, buildFetchParams } from '@/lib/utils/online-forms';

const PAGE_SIZE = 10;

interface OnlineFormsPageContentProps {
  locale: string;
}

/**
 * Online Forms page content component
 * Contains all the JSX/HTML and business logic that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function OnlineFormsPageContent({ locale }: OnlineFormsPageContentProps) {
  const router = useRouter();
  const t = useTranslations('common');
  const tForms = useTranslations('online-forms');

  const {
    forms,
    loading,
    error,
    pagination,
    fetchForms,
    deleteForm,
  } = useOnlineForms();

  const { parishes, fetchParishes } = useParishes();
  const { toasts, success, removeToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [targetModuleFilter, setTargetModuleFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Build fetch parameters with useMemo to avoid unnecessary recalculations
  const fetchParams = useMemo(
    () =>
      buildFetchParams({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchTerm,
        parishId: parishFilter,
        targetModule: targetModuleFilter,
        isActive: isActiveFilter === '' ? undefined : isActiveFilter === 'true',
      }),
    [currentPage, searchTerm, parishFilter, targetModuleFilter, isActiveFilter]
  );

  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  useEffect(() => {
    fetchForms({
      ...fetchParams,
      targetModule: (fetchParams.targetModule as FormTargetModule) || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }, [fetchParams, fetchForms]);

  const handleCreate = useCallback(() => {
    router.push(`/${locale}/dashboard/registry/online-forms/new`);
  }, [router, locale]);

  const handleEdit = useCallback(
    (form: OnlineForm) => {
      router.push(`/${locale}/dashboard/registry/online-forms/${form.id}`);
    },
    [router, locale]
  );

  const handleTest = useCallback(
    (form: OnlineForm) => {
      router.push(`/${locale}/dashboard/registry/online-forms/${form.id}/test`);
    },
    [router, locale]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteForm(id);
      if (result) {
        setDeleteConfirm(null);
        fetchForms({
          ...fetchParams,
          targetModule: (fetchParams.targetModule as FormTargetModule) || undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
      }
    },
    [deleteForm, fetchForms, fetchParams]
  );

  const copyWidgetCode = useCallback(
    async (code: string) => {
      try {
        await navigator.clipboard.writeText(code);
        success(tForms('widgetCodeCopied'));
      } catch (err) {
        // Fallback for older browsers that don't support Clipboard API
        // Note: document.execCommand is deprecated but still needed for legacy browser support
        try {
          const textArea = document.createElement('textarea');
          textArea.value = code;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          const copied = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (copied) {
            success(tForms('widgetCodeCopied'));
          } else {
            throw new Error('execCommand copy failed');
          }
        } catch (fallbackErr) {
          console.error('Failed to copy widget code:', fallbackErr);
          // Could show an error toast here if needed
        }
      }
    },
    [success, tForms]
  );

  const getStatusBadge = useCallback(
    (isActive: boolean) => {
      return (
        <Badge variant={isActive ? 'success' : 'secondary'}>
          {isActive ? t('active') : t('inactive')}
        </Badge>
      );
    },
    [t]
  );

  type TableDataItem = {
    id: string;
    name: string;
    parishName: string;
    targetModule: string;
    widgetCode: React.ReactElement;
    isActive: React.ReactElement;
    createdAt: string;
    actions: React.ReactElement;
  };

  const tableColumns = useMemo(
    () => [
      { key: 'name' as keyof TableDataItem, label: tForms('formName') },
      { key: 'parishName' as keyof TableDataItem, label: t('parish') },
      { key: 'targetModule' as keyof TableDataItem, label: tForms('targetModule') },
      {
        key: 'widgetCode' as keyof TableDataItem,
        label: tForms('widgetCode'),
        render: (value: any) => value,
      },
      {
        key: 'isActive' as keyof TableDataItem,
        label: t('status'),
        render: (value: any) => value,
      },
      { key: 'createdAt' as keyof TableDataItem, label: t('createdAt') },
      {
        key: 'actions' as keyof TableDataItem,
        label: t('actions'),
        render: (value: any) => value,
      },
    ],
    [t, tForms]
  );

  const tableData: TableDataItem[] = useMemo(
    () =>
      forms.map((form) => ({
        id: form.id,
        name: form.name,
        parishName: form.parishName || '-',
        targetModule: getTargetModuleLabel(form.targetModule, tForms),
        widgetCode: (
          <div className="flex items-center gap-2">
            <code className="text-xs bg-bg-secondary px-2 py-1 rounded">{form.widgetCode}</code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyWidgetCode(form.widgetCode)}
              title={tForms('copyWidgetCode')}
            >
              📋
            </Button>
          </div>
        ),
        isActive: getStatusBadge(form.isActive),
        createdAt: new Date(form.createdAt).toLocaleDateString('ro-RO'),
        actions: (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => handleEdit(form)}>
              {t('edit')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleTest(form)}>
              {tForms('testForm')}
            </Button>
            <Button size="sm" variant="danger" onClick={() => setDeleteConfirm(form.id)}>
              {t('delete')}
            </Button>
          </div>
        ),
      })),
    [forms, t, tForms, copyWidgetCode, getStatusBadge, handleEdit, handleTest]
  );

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tForms('onlineForms') },
        ]}
        title={tForms('onlineForms') || 'Online Forms'}
        action={<Button onClick={handleCreate}>{tForms('createForm')}</Button>}
        className="mb-6"
      />

      <Card>
        <CardBody>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Select
              value={parishFilter}
              onChange={(e) => {
                setParishFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: '', label: t('allParishes') },
                ...parishes.map((parish) => ({
                  value: parish.id,
                  label: parish.name,
                })),
              ]}
            />
            <Select
              value={targetModuleFilter}
              onChange={(e) => {
                setTargetModuleFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: '', label: `Toate ${tForms('targetModule').toLowerCase()}` },
                { value: 'registratura', label: tForms('targetModuleRegistratura') },
                { value: 'general_register', label: tForms('targetModuleGeneralRegister') },
                { value: 'events', label: tForms('targetModuleEvents') },
                { value: 'clients', label: tForms('targetModuleClients') },
              ]}
            />
            <Select
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: '', label: t('allStatuses') },
                { value: 'true', label: t('active') },
                { value: 'false', label: t('inactive') },
              ]}
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">{t('loading')}</div>
          ) : error ? (
            <div className="text-center py-8 text-danger">{error}</div>
          ) : forms.length === 0 ? (
            <div className="text-center py-8">{tForms('noForms')}</div>
          ) : (
            <>
              <Table columns={tableColumns} data={tableData} />
              
              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-text-secondary">
                    {t('showing')} {(pagination.page - 1) * pagination.pageSize + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('of')} {pagination.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      {t('previous')}
                    </Button>
                    <span className="px-4 py-2">
                      {t('page')} {currentPage} {t('of')} {pagination.totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={currentPage === pagination.totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
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

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('confirmDelete')}
      >
        <div className="space-y-4">
          <p>{t('confirmDeleteMessage')}</p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              {t('cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              {t('delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}

