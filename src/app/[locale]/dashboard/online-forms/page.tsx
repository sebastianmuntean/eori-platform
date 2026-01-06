'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { useOnlineForms, OnlineForm, FormTargetModule } from '@/hooks/useOnlineForms';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ONLINE_FORMS_PERMISSIONS } from '@/lib/permissions/onlineForms';

export default function OnlineFormsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tForms = useTranslations('online-forms');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('onlineForms'));

  // Check permission to view online forms
  const { loading: permissionLoading } = useRequirePermission(ONLINE_FORMS_PERMISSIONS.VIEW);

  // All hooks must be called before any conditional returns
  const {
    forms,
    loading,
    error,
    pagination,
    fetchForms,
    deleteForm,
  } = useOnlineForms();

  const { parishes, fetchParishes } = useParishes();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [targetModuleFilter, setTargetModuleFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
  }, [permissionLoading, fetchParishes]);

  useEffect(() => {
    if (permissionLoading) return;
    fetchForms({
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      targetModule: (targetModuleFilter as FormTargetModule) || undefined,
      isActive: isActiveFilter === '' ? undefined : isActiveFilter === 'true',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }, [permissionLoading, currentPage, searchTerm, parishFilter, targetModuleFilter, isActiveFilter, fetchForms]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const handleCreate = () => {
    router.push(`/${locale}/dashboard/online-forms/new`);
  };

  const handleEdit = (form: OnlineForm) => {
    router.push(`/${locale}/dashboard/online-forms/${form.id}`);
  };

  const handleTest = (form: OnlineForm) => {
    router.push(`/${locale}/dashboard/online-forms/${form.id}/test`);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteForm(id);
    if (result) {
      setDeleteConfirm(null);
      fetchForms({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        parishId: parishFilter || undefined,
        targetModule: (targetModuleFilter as FormTargetModule) || undefined,
        isActive: isActiveFilter === '' ? undefined : isActiveFilter === 'true',
      });
    }
  };

  const copyWidgetCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(tForms('widgetCodeCopied'));
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'success' : 'secondary'}>
        {isActive ? t('active') : t('inactive')}
      </Badge>
    );
  };

  const getTargetModuleLabel = (module: string) => {
    const labels: Record<string, string> = {
      registratura: tForms('targetModuleRegistratura'),
      general_register: tForms('targetModuleGeneralRegister'),
      events: tForms('targetModuleEvents'),
      clients: tForms('targetModuleClients'),
    };
    return labels[module] || module;
  };

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

  const tableColumns = [
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
  ];

  const tableData: TableDataItem[] = forms.map((form) => ({
    id: form.id,
    name: form.name,
    parishName: form.parishName || '-',
    targetModule: getTargetModuleLabel(form.targetModule),
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
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleEdit(form)}
        >
          {t('edit')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleTest(form)}
        >
          {tForms('testForm')}
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => setDeleteConfirm(form.id)}
        >
          {t('delete')}
        </Button>
      </div>
    ),
  }));

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tForms('onlineForms') },
        ]}
        title={tForms('onlineForms') || 'Online Forms'}
        action={<Button onClick={handleCreate}>{tForms('createForm')}</Button>}
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
            <select
              className="px-4 py-2 border rounded-md bg-bg-primary text-text-primary"
              value={parishFilter}
              onChange={(e) => {
                setParishFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">{t('allParishes')}</option>
              {parishes.map((parish) => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-2 border rounded-md bg-bg-primary text-text-primary"
              value={targetModuleFilter}
              onChange={(e) => {
                setTargetModuleFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Toate {tForms('targetModule').toLowerCase()}</option>
              <option value="registratura">{tForms('targetModuleRegistratura')}</option>
              <option value="general_register">{tForms('targetModuleGeneralRegister')}</option>
              <option value="events">{tForms('targetModuleEvents')}</option>
              <option value="clients">{tForms('targetModuleClients')}</option>
            </select>
            <select
              className="px-4 py-2 border rounded-md bg-bg-primary text-text-primary"
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">{t('allStatuses')}</option>
              <option value="true">{t('active')}</option>
              <option value="false">{t('inactive')}</option>
            </select>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('confirmDelete')}
      >
        <p className="mb-4">{t('confirmDeleteMessage')}</p>
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
      </Modal>
    </PageContainer>
  );
}

