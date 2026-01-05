'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
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

  // Don't render content while checking permissions
  if (permissionLoading) {
    return null;
  }

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
    fetchDatasets({
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
      targetModule: targetModuleFilter || undefined,
    });
  }, [currentPage, searchTerm, targetModuleFilter, fetchDatasets]);

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
      partners: tForms('targetModulePartners'),
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
    { key: 'name', label: tForms('datasetName') },
    { key: 'targetModule', label: tForms('targetModule') },
    { key: 'parishName', label: t('parish') },
    {
      key: 'isDefault',
      label: tForms('isDefault'),
      render: (value: any, dataset: MappingDataset) => getStatusBadge(dataset.isDefault),
    },
    {
      key: 'mappingsCount',
      label: tForms('mappingsCount'),
      render: (value: any, dataset: MappingDataset) => {
        const mappings = dataset.mappings || [];
        return <span>{Array.isArray(mappings) ? mappings.length : 0}</span>;
      },
    },
    { key: 'createdAt', label: t('createdAt') },
    {
      key: 'actions',
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
    id: dataset.id,
    name: dataset.name,
    targetModule: getTargetModuleLabel(dataset.targetModule),
    parishName: dataset.parishName || tForms('globalTemplate'),
    isDefault: dataset.isDefault,
    mappingsCount: Array.isArray(dataset.mappings) ? dataset.mappings.length : 0,
    createdAt: new Date(dataset.createdAt).toLocaleDateString(locale),
    actions: null, // Rendered by render function
  }));

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('dashboard'), href: `/${locale}/dashboard` },
          { label: tForms('onlineForms'), href: `/${locale}/dashboard/online-forms` },
          { label: tForms('mappingDatasets') },
        ]}
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{tForms('mappingDatasets')}</h1>
            <Button onClick={handleCreate}>{tForms('createDataset')}</Button>
          </div>
        </CardHeader>
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
                { value: 'partners', label: tForms('targetModulePartners') },
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
    </div>
  );
}


