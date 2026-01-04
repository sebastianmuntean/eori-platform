'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { useOnlineForms, OnlineForm } from '@/hooks/useOnlineForms';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

export default function OnlineFormsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
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

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [targetModuleFilter, setTargetModuleFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  useEffect(() => {
    fetchForms({
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      targetModule: targetModuleFilter || undefined,
      isActive: isActiveFilter === '' ? undefined : isActiveFilter === 'true',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }, [currentPage, searchTerm, parishFilter, targetModuleFilter, isActiveFilter, fetchForms]);

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
        targetModule: targetModuleFilter || undefined,
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
      partners: tForms('targetModulePartners'),
    };
    return labels[module] || module;
  };

  const tableColumns = [
    { key: 'name', label: tForms('formName') },
    { key: 'parishName', label: t('parish') },
    { key: 'targetModule', label: tForms('targetModule') },
    {
      key: 'widgetCode',
      label: tForms('widgetCode'),
      render: (value: any) => value,
    },
    {
      key: 'isActive',
      label: t('status'),
      render: (value: any) => value,
    },
    { key: 'createdAt', label: t('createdAt') },
    {
      key: 'actions',
      label: t('actions'),
      render: (value: any) => value,
    },
  ];

  const tableData = forms.map((form) => ({
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
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tForms('onlineForms'), href: `/${locale}/dashboard/online-forms` },
        ]}
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{tForms('onlineForms')}</h1>
            <Button onClick={handleCreate}>
              {tForms('createForm')}
            </Button>
          </div>
        </CardHeader>
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
              <option value="partners">{tForms('targetModulePartners')}</option>
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
    </div>
  );
}

