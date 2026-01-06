'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useMappingDatasets, MappingDataset } from '@/hooks/useMappingDatasets';
import { useTranslations } from 'next-intl';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ONLINE_FORMS_PERMISSIONS } from '@/lib/permissions/onlineForms';

export default function MappingDatasetsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tForms = useTranslations('online-forms');

  // Check permission to view mapping datasets
  const { loading: permissionLoading } = useRequirePermission(ONLINE_FORMS_PERMISSIONS.MAPPING_DATASETS_VIEW);

  // All hooks must be called before any conditional returns
  const {
    datasets,
    loading,
    error,
    pagination,
    fetchDatasets,
    deleteDataset,
  } = useMappingDatasets();

  const [searchTerm, setSearchTerm] = useState('');
  const [targetModuleFilter, setTargetModuleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (permissionLoading) return;
    fetchDatasets({
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
      targetModule: targetModuleFilter || undefined,
    });
  }, [permissionLoading, currentPage, searchTerm, targetModuleFilter, fetchDatasets]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const handleCreate = () => {
    router.push(`/${locale}/dashboard/online-forms/mapping-datasets/new`);
  };

  const handleEdit = (dataset: MappingDataset) => {
    router.push(`/${locale}/dashboard/online-forms/mapping-datasets/${dataset.id}`);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteDataset(id);
    if (result) {
      setDeleteConfirm(null);
      fetchDatasets({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        targetModule: targetModuleFilter || undefined,
      });
    }
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

  const getStatusBadge = (isDefault: boolean) => {
    return isDefault ? (
      <Badge variant="success">{tForms('isDefault')}</Badge>
    ) : (
      <Badge variant="secondary">{t('no')}</Badge>
    );
  };

  const tableColumns = [
    { key: 'name' as keyof MappingDataset, label: tForms('datasetName') },
    { key: 'targetModule' as keyof MappingDataset, label: tForms('targetModule') },
    { key: 'parishName' as keyof MappingDataset, label: t('parish') },
    {
      key: 'isDefault' as keyof MappingDataset,
      label: tForms('isDefault'),
      render: (value: any, dataset: MappingDataset) => getStatusBadge(dataset.isDefault),
    },
    {
      key: 'mappingsCount' as keyof MappingDataset,
      label: tForms('mappingsCount'),
      render: (value: any, dataset: MappingDataset) => {
        const mappings = dataset.mappings || [];
        return <span>{Array.isArray(mappings) ? mappings.length : 0}</span>;
      },
    },
    { key: 'createdAt' as keyof MappingDataset, label: t('createdAt') },
    {
      key: 'actions' as keyof MappingDataset,
      label: t('actions'),
      render: (value: any, dataset: MappingDataset) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleEdit(dataset)}>
            {t('edit')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteConfirm(dataset.id)}
          >
            {t('delete')}
          </Button>
        </div>
      ),
    },
  ];

  const tableData = datasets.map((dataset) => ({
    ...dataset,
    targetModule: getTargetModuleLabel(dataset.targetModule),
    parishName: dataset.parishName || tForms('globalTemplate'),
    mappingsCount: Array.isArray(dataset.mappings) ? dataset.mappings.length : 0,
    createdAt: new Date(dataset.createdAt).toLocaleDateString(locale),
    actions: null, // Rendered by render function
  })) as MappingDataset[];

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tForms('onlineForms'), href: `/${locale}/dashboard/online-forms` },
          { label: tForms('mappingDatasets') },
        ]}
        title={tForms('mappingDatasets') || 'Mapping Datasets'}
        action={<Button onClick={handleCreate}>{tForms('createDataset')}</Button>}
      />

      <Card>
        <CardBody>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Select
              value={targetModuleFilter}
              onChange={(e) => {
                setTargetModuleFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: '', label: tForms('targetModule') + ' - ' + t('all') },
                { value: 'registratura', label: tForms('targetModuleRegistratura') },
                { value: 'general_register', label: tForms('targetModuleGeneralRegister') },
                { value: 'events', label: tForms('targetModuleEvents') },
                { value: 'clients', label: tForms('targetModuleClients') },
              ]}
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">{t('loading')}</div>
          ) : error ? (
            <div className="text-center py-8 text-danger">{error}</div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-8">{tForms('noDatasets')}</div>
          ) : (
            <>
              <Table columns={tableColumns} data={tableData} />

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-text-secondary">
                    {t('showing')} {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('of')}{' '}
                    {pagination.total}
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
        <div className="space-y-4">
          <p>{t('confirmDelete')}</p>
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


