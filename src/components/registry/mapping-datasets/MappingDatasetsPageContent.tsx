'use client';

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
import { useMappingDatasets, MappingDataset } from '@/hooks/useMappingDatasets';
import { useTranslations } from 'next-intl';
import { getTargetModuleLabel, buildFetchParams } from '@/lib/utils/online-forms';

const PAGE_SIZE = 10;

interface MappingDatasetsPageContentProps {
  locale: string;
}

/**
 * Mapping Datasets page content component
 * Contains all the JSX/HTML and business logic that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function MappingDatasetsPageContent({ locale }: MappingDatasetsPageContentProps) {
  const router = useRouter();
  const t = useTranslations('common');
  const tForms = useTranslations('online-forms');

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

  // Build fetch parameters with useMemo to avoid unnecessary recalculations
  const fetchParams = useMemo(
    () =>
      buildFetchParams({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchTerm,
        targetModule: targetModuleFilter,
      }),
    [currentPage, searchTerm, targetModuleFilter]
  );

  useEffect(() => {
    fetchDatasets(fetchParams);
  }, [fetchParams, fetchDatasets]);

  const handleCreate = useCallback(() => {
    router.push(`/${locale}/dashboard/registry/online-forms/mapping-datasets/new`);
  }, [router, locale]);

  const handleEdit = useCallback(
    (dataset: MappingDataset) => {
      router.push(`/${locale}/dashboard/registry/online-forms/mapping-datasets/${dataset.id}`);
    },
    [router, locale]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteDataset(id);
      if (result) {
        setDeleteConfirm(null);
        fetchDatasets(fetchParams);
      }
    },
    [deleteDataset, fetchDatasets, fetchParams]
  );

  const getStatusBadge = useCallback(
    (isDefault: boolean) => {
      return isDefault ? (
        <Badge variant="success">{tForms('isDefault')}</Badge>
      ) : (
        <Badge variant="secondary">{t('no')}</Badge>
      );
    },
    [t, tForms]
  );

  const tableColumns = useMemo(
    () => [
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
            <Button size="sm" variant="danger" onClick={() => setDeleteConfirm(dataset.id)}>
              {t('delete')}
            </Button>
          </div>
        ),
      },
    ],
    [t, tForms, getStatusBadge, handleEdit]
  );

  const tableData = useMemo(
    () =>
      datasets.map((dataset) => ({
        ...dataset,
        targetModule: getTargetModuleLabel(dataset.targetModule, tForms),
        parishName: dataset.parishName || tForms('globalTemplate'),
        mappingsCount: Array.isArray(dataset.mappings) ? dataset.mappings.length : 0,
        createdAt: new Date(dataset.createdAt).toLocaleDateString(locale),
        actions: null, // Rendered by render function
      })) as MappingDataset[],
    [datasets, locale, tForms]
  );

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tForms('onlineForms'), href: `/${locale}/dashboard/registry/online-forms` },
          { label: tForms('mappingDatasets') },
        ]}
        title={tForms('mappingDatasets') || 'Mapping Datasets'}
        action={<Button onClick={handleCreate}>{tForms('createDataset')}</Button>}
        className="mb-6"
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

