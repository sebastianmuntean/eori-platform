'use client';

import { useParams } from 'next/navigation';
import { useState, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ToastContainer } from '@/components/ui/Toast';
import { PilgrimageAddModal } from '@/components/pilgrimages/PilgrimageAddModal';
import { PilgrimageEditModal } from '@/components/pilgrimages/PilgrimageEditModal';
import { PilgrimageFormData } from '@/components/pilgrimages/PilgrimageForm';
import { usePilgrimages, Pilgrimage, PilgrimageStatus } from '@/hooks/usePilgrimages';
import { useParishes } from '@/hooks/useParishes';
import { usePilgrimageStatistics } from '@/hooks/usePilgrimageStatistics';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { useToast } from '@/hooks/useToast';
import { usePermissionAwareFetch } from '@/hooks/usePermissionAwareFetch';
import { PILGRIMAGES_PERMISSIONS } from '@/lib/permissions/pilgrimages';
import {
  transformFormDataToApi,
  transformPilgrimageToFormData,
  getInitialPilgrimageFormData,
  PILGRIMAGE_STATUS_VARIANTS,
  calculateStatusCounts,
} from '@/lib/utils/pilgrimages';
import { getPilgrimageActionItems } from '@/lib/utils/pilgrimage-actions';

export default function PilgrimagesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');
  usePageTitle(tPilgrimages('pilgrimages'));

  // Check permission to view pilgrimages
  const { loading: permissionLoading } = useRequirePermission(PILGRIMAGES_PERMISSIONS.VIEW);
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();

  // All hooks must be called before any conditional returns
  const {
    pilgrimages,
    loading,
    error,
    pagination,
    fetchPilgrimages,
    createPilgrimage,
    updatePilgrimage,
    deletePilgrimage,
    approvePilgrimage,
    publishPilgrimage,
    closePilgrimage,
    cancelPilgrimage,
  } = usePilgrimages();

  const { parishes, fetchParishes } = useParishes();
  const { statistics, fetchGlobalStatistics } = usePilgrimageStatistics();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<PilgrimageStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPilgrimage, setSelectedPilgrimage] = useState<Pilgrimage | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<PilgrimageFormData>(getInitialPilgrimageFormData());

  // Permission-aware data fetching
  usePermissionAwareFetch(
    permissionLoading,
    () => {
      fetchParishes({ all: true });
      fetchGlobalStatistics();
    },
    [fetchParishes, fetchGlobalStatistics]
  );

  usePermissionAwareFetch(
    permissionLoading,
    () => {
      const params = {
        page: currentPage,
        pageSize: 10,
        search: searchTerm || undefined,
        parishId: parishFilter || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };
      fetchPilgrimages(params);
    },
    [currentPage, searchTerm, parishFilter, statusFilter, dateFrom, dateTo, fetchPilgrimages]
  );

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(getInitialPilgrimageFormData());
  }, []);

  // Handlers
  const handleCreate = useCallback(async () => {
    if (!formData.parishId || !formData.title) {
      showError(t('fillRequiredFields') || 'Please fill in all required fields');
      return;
    }

    try {
      const result = await createPilgrimage(transformFormDataToApi(formData));
      if (result) {
        setShowAddModal(false);
        resetForm();
        fetchGlobalStatistics();
        showSuccess(tPilgrimages('pilgrimageCreated') || 'Pilgrimage created successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errorOccurred') || 'An error occurred';
      showError(errorMessage);
    }
  }, [formData, createPilgrimage, resetForm, fetchGlobalStatistics, t, tPilgrimages, showError, showSuccess]);

  const handleAddModalClose = useCallback(() => {
    setShowAddModal(false);
    resetForm();
  }, [resetForm]);

  const handleUpdate = useCallback(async () => {
    if (!selectedPilgrimage) return;

    try {
      const result = await updatePilgrimage(selectedPilgrimage.id, transformFormDataToApi(formData));
      if (result) {
        setShowEditModal(false);
        setSelectedPilgrimage(null);
        fetchGlobalStatistics();
        showSuccess(tPilgrimages('pilgrimageUpdated') || 'Pilgrimage updated successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errorOccurred') || 'An error occurred';
      showError(errorMessage);
    }
  }, [selectedPilgrimage, formData, updatePilgrimage, fetchGlobalStatistics, t, tPilgrimages, showError, showSuccess]);

  const handleEditModalClose = useCallback(() => {
    setShowEditModal(false);
    setSelectedPilgrimage(null);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const result = await deletePilgrimage(id);
        if (result) {
          setDeleteConfirm(null);
          fetchGlobalStatistics();
          showSuccess(tPilgrimages('pilgrimageDeleted') || 'Pilgrimage deleted successfully');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('errorOccurred') || 'An error occurred';
        showError(errorMessage);
      }
    },
    [deletePilgrimage, fetchGlobalStatistics, t, tPilgrimages, showError, showSuccess]
  );

  const handleEdit = useCallback((pilgrimage: Pilgrimage) => {
    setSelectedPilgrimage(pilgrimage);
    setFormData(transformPilgrimageToFormData(pilgrimage));
    setShowEditModal(true);
  }, []);

  // Helper functions
  const getParishName = useCallback(
    (parishId: string) => {
      const parish = parishes.find((p) => p.id === parishId);
      return parish ? parish.name : parishId;
    },
    [parishes]
  );

  const formatDate = useCallback(
    (date: string | null) => {
      if (!date) return '-';
      return new Date(date).toLocaleDateString(locale);
    },
    [locale]
  );

  const getStatusLabel = useCallback(
    (status: PilgrimageStatus) => {
      const statusMap: Record<PilgrimageStatus, string> = {
        draft: tPilgrimages('statuses.draft'),
        open: tPilgrimages('statuses.open'),
        closed: tPilgrimages('statuses.closed'),
        in_progress: tPilgrimages('statuses.in_progress'),
        completed: tPilgrimages('statuses.completed'),
        cancelled: tPilgrimages('statuses.cancelled'),
      };
      return statusMap[status] || status;
    },
    [tPilgrimages]
  );


  // Memoized columns definition
  const columns = useMemo(
    () => [
      { key: 'title', label: tPilgrimages('titleField'), sortable: true },
      {
        key: 'destination',
        label: tPilgrimages('destination'),
        sortable: false,
        render: (value: string | null) => value || '-',
      },
      {
        key: 'startDate',
        label: tPilgrimages('startDate'),
        sortable: true,
        render: (value: string | null) => formatDate(value),
      },
      {
        key: 'status',
        label: tPilgrimages('status'),
        sortable: false,
        render: (value: PilgrimageStatus) => (
          <Badge variant={PILGRIMAGE_STATUS_VARIANTS[value] || 'secondary'} size="sm">
            {getStatusLabel(value)}
          </Badge>
        ),
      },
      {
        key: 'actions',
        label: t('actions'),
        sortable: false,
        render: (_: any, row: Pilgrimage) => {
          const actionItems = getPilgrimageActionItems(row, {
            onView: (id) => router.push(`/${locale}/dashboard/pilgrimages/${id}`),
            onEdit: handleEdit,
            onApprove: approvePilgrimage,
            onPublish: publishPilgrimage,
            onClose: closePilgrimage,
            onCancel: cancelPilgrimage,
            onDelete: (id) => setDeleteConfirm(id),
            translations: {
              view: t('view'),
              edit: t('edit'),
              approve: tPilgrimages('approve'),
              publish: tPilgrimages('publish'),
              close: tPilgrimages('close'),
              cancel: tPilgrimages('cancel'),
              delete: t('delete'),
            },
          });

          return (
            <Dropdown
              trigger={
                <Button variant="ghost" size="sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </Button>
              }
              items={actionItems}
              align="right"
            />
          );
        },
      },
    ],
    [tPilgrimages, formatDate, getStatusLabel, t, locale, router, handleEdit, approvePilgrimage, publishPilgrimage, closePilgrimage, cancelPilgrimage]
  );

  const breadcrumbs = useMemo(
    () => [
      { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
      { label: tPilgrimages('pilgrimages') },
    ],
    [t, tPilgrimages, locale]
  );

  // Memoized statistics calculations - optimized with reduce
  const statusCounts = useMemo(() => calculateStatusCounts(pilgrimages), [pilgrimages]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{tPilgrimages('pilgrimages')}</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)}>{t('add')} {tPilgrimages('pilgrimage')}</Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card variant="elevated">
            <CardBody>
              <div className="text-sm text-text-secondary">{tPilgrimages('totalParticipants')}</div>
              <div className="text-2xl font-bold text-text-primary">{statistics.participants?.total || 0}</div>
            </CardBody>
          </Card>
          <Card variant="elevated">
            <CardBody>
              <div className="text-sm text-text-secondary">{tPilgrimages('statuses.open')}</div>
              <div className="text-2xl font-bold text-text-primary">{statusCounts.open}</div>
            </CardBody>
          </Card>
          <Card variant="elevated">
            <CardBody>
              <div className="text-sm text-text-secondary">{tPilgrimages('statuses.in_progress')}</div>
              <div className="text-2xl font-bold text-text-primary">{statusCounts.in_progress}</div>
            </CardBody>
          </Card>
          <Card variant="elevated">
            <CardBody>
              <div className="text-sm text-text-secondary">{tPilgrimages('statuses.completed')}</div>
              <div className="text-2xl font-bold text-text-primary">{statusCounts.completed}</div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card variant="outlined" className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={parishFilter}
              onChange={(e) => setParishFilter(e.target.value)}
            >
              <option value="">{t('allParishes')}</option>
              {parishes.map((parish) => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PilgrimageStatus | '')}
            >
              <option value="">{t('allStatuses')}</option>
              <option value="draft">{tPilgrimages('statuses.draft')}</option>
              <option value="open">{tPilgrimages('statuses.open')}</option>
              <option value="closed">{tPilgrimages('statuses.closed')}</option>
              <option value="in_progress">{tPilgrimages('statuses.in_progress')}</option>
              <option value="completed">{tPilgrimages('statuses.completed')}</option>
              <option value="cancelled">{tPilgrimages('statuses.cancelled')}</option>
            </select>
            <Input
              type="date"
              placeholder={tPilgrimages('startDate')}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              type="date"
              placeholder={tPilgrimages('endDate')}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Pilgrimages Table */}
      <Card variant="outlined">
        <CardBody>
          {error && (
            <div className="mb-4 p-4 bg-danger/10 text-danger rounded-md">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-center py-8 text-text-secondary">{t('loading') || 'Loading...'}</div>
          ) : (
            <>
              <Table
                data={pilgrimages}
                columns={columns}
              />
              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="text-sm text-text-secondary">
                    {t('showing') || 'Showing'} {((pagination.page - 1) * pagination.pageSize) + 1} -{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('of') || 'of'}{' '}
                    {pagination.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      {t('previous') || 'Previous'}
                    </Button>
                    <span className="text-sm text-text-secondary">
                      {t('page') || 'Page'} {pagination.page} {t('of') || 'of'} {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= pagination.totalPages || loading}
                    >
                      {t('next') || 'Next'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Add Modal */}
      <PilgrimageAddModal
        isOpen={showAddModal}
        onClose={handleAddModalClose}
        onCancel={handleAddModalClose}
        formData={formData}
        setFormData={setFormData}
        parishes={parishes}
        onSubmit={handleCreate}
        loading={loading}
      />

      {/* Edit Modal */}
      <PilgrimageEditModal
        isOpen={showEditModal}
        onClose={handleEditModalClose}
        formData={formData}
        setFormData={setFormData}
        parishes={parishes}
        onSubmit={handleUpdate}
        loading={loading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title={t('confirmDelete')}
        message={tPilgrimages('confirmDeletePilgrimage')}
        variant="danger"
        isLoading={loading}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}


