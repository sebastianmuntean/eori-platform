'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { FormModal } from '@/components/accounting/FormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useInventory, BookInventoryItem, InventorySession } from '@/hooks/useInventory';
import { useParishes } from '@/hooks/useParishes';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useTranslations } from 'next-intl';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear, ParishFilter, FilterSelect } from '@/components/ui/FilterGrid';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PANGARE_PERMISSIONS } from '@/lib/permissions/pangare';

export default function InventarPage() {
  const { loading: permissionLoading } = useRequirePermission(PANGARE_PERMISSIONS.INVENTAR_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

  const {
    sessions,
    loading,
    error,
    pagination,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    getSession,
    completeSession,
    fetchBookInventory,
  } = useInventory();

  const { parishes, fetchParishes } = useParishes();
  const { warehouses, fetchWarehouses } = useWarehouses();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [parishFilter, setParishFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [bookInventory, setBookInventory] = useState<BookInventoryItem[]>([]);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [showSpotCheckModal, setShowSpotCheckModal] = useState(false);
  const [spotCheckItem, setSpotCheckItem] = useState<BookInventoryItem | null>(null);
  const [spotCheckPhysicalQuantity, setSpotCheckPhysicalQuantity] = useState<string>('');
  const [spotCheckNotes, setSpotCheckNotes] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<InventorySession | null>(null);
  const [sessionFormData, setSessionFormData] = useState({
    parishId: '',
    warehouseId: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<InventorySession | null>(null);
  const [completeConfirm, setCompleteConfirm] = useState<InventorySession | null>(null);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return null;
  }

  useEffect(() => {
    fetchParishes({ all: true });
    fetchWarehouses({ pageSize: 1000 });
  }, [fetchParishes, fetchWarehouses]);

  useEffect(() => {
    if (parishFilter || warehouseFilter) {
      fetchBookInventory({
        parishId: parishFilter || undefined,
        warehouseId: warehouseFilter || undefined,
        type: typeFilter || undefined,
      }).then(setBookInventory);
    }
  }, [parishFilter, warehouseFilter, typeFilter, fetchBookInventory]);

  useEffect(() => {
    fetchSessions({
      page: currentPage,
      pageSize: 10,
      parishId: parishFilter || undefined,
      warehouseId: warehouseFilter || undefined,
    });
  }, [currentPage, parishFilter, warehouseFilter, fetchSessions]);

  // Refresh sessions list
  const refreshSessions = useCallback(() => {
    fetchSessions({
      page: currentPage,
      pageSize: 10,
      parishId: parishFilter || undefined,
      warehouseId: warehouseFilter || undefined,
    });
  }, [currentPage, parishFilter, warehouseFilter, fetchSessions]);

  const handleStartInventory = useCallback(() => {
    setSessionFormData({
      parishId: parishFilter || '',
      warehouseId: warehouseFilter || '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setSelectedSession(null);
    setShowInventoryForm(true);
  }, [parishFilter, warehouseFilter]);

  const handleSpotCheck = useCallback((item: BookInventoryItem) => {
    setSpotCheckItem(item);
    setSpotCheckPhysicalQuantity(item.quantity.toString());
    setSpotCheckNotes('');
    setShowSpotCheckModal(true);
  }, []);

  const handleCloseSpotCheckModal = useCallback(() => {
    setShowSpotCheckModal(false);
    setSpotCheckItem(null);
    setSpotCheckPhysicalQuantity('');
    setSpotCheckNotes('');
  }, []);

  const handleSaveSpotCheck = useCallback(async () => {
    if (!spotCheckItem || !parishFilter) {
      showError(t('pleaseSelectParish') || 'Vă rugăm să selectați o parohie');
      return;
    }

    setIsSubmitting(true);
    try {
      const physicalQty = parseFloat(spotCheckPhysicalQuantity) || 0;
      const sessionData = {
        parishId: parishFilter,
        warehouseId: warehouseFilter || null,
        date: new Date().toISOString().split('T')[0],
        status: 'draft' as const,
        notes: spotCheckNotes || `Spot check for ${spotCheckItem.name}`,
      };

      const session = await createSession(sessionData);
      if (session) {
        success(t('spotCheckSaved') || 'Spot check salvat cu succes!');
        handleCloseSpotCheckModal();
        refreshSessions();
        // TODO: Create inventory item when API endpoint is available
      }
    } catch (err) {
      showError(t('errorSavingSpotCheck') || 'Eroare la salvarea spot check-ului');
    } finally {
      setIsSubmitting(false);
    }
  }, [spotCheckItem, spotCheckPhysicalQuantity, spotCheckNotes, parishFilter, warehouseFilter, createSession, refreshSessions, success, showError, t, handleCloseSpotCheckModal]);

  const handleSaveInventory = useCallback(async () => {
    if (!sessionFormData.parishId) {
      showError(t('pleaseSelectParish') || 'Vă rugăm să selectați o parohie');
      return;
    }

    setIsSubmitting(true);
    try {
      const sessionData = {
        parishId: sessionFormData.parishId,
        warehouseId: sessionFormData.warehouseId || null,
        date: sessionFormData.date,
        status: 'draft' as const,
        notes: sessionFormData.notes || null,
      };

      if (selectedSession) {
        await updateSession(selectedSession.id, sessionData);
        success(t('sessionUpdated') || 'Sesiunea a fost actualizată cu succes!');
      } else {
        await createSession(sessionData);
        success(t('sessionCreated') || 'Sesiunea a fost creată cu succes!');
      }

      setShowInventoryForm(false);
      setSelectedSession(null);
      refreshSessions();
    } catch (err) {
      showError(t('errorSavingSession') || 'Eroare la salvarea sesiunii');
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionFormData, selectedSession, updateSession, createSession, refreshSessions, success, showError, t]);

  const handleCompleteSession = useCallback(async (session: InventorySession) => {
    setIsSubmitting(true);
    try {
      const result = await completeSession(session.id);
      if (result) {
        success(t('completed') || 'Inventar finalizat cu succes!');
        setCompleteConfirm(null);
        refreshSessions();
      } else {
        showError(t('errorCompletingSession') || 'Eroare la finalizarea sesiunii');
      }
    } catch (err) {
      showError(t('errorCompletingSession') || 'Eroare la finalizarea sesiunii');
    } finally {
      setIsSubmitting(false);
    }
  }, [completeSession, refreshSessions, success, showError, t]);

  const handleDeleteSession = useCallback(async (session: InventorySession) => {
    setIsSubmitting(true);
    try {
      const result = await deleteSession(session.id);
      if (result) {
        success(t('sessionDeleted') || 'Sesiunea a fost ștearsă cu succes!');
        setDeleteConfirm(null);
        refreshSessions();
      } else {
        showError(t('errorDeletingSession') || 'Eroare la ștergerea sesiunii');
      }
    } catch (err) {
      showError(t('errorDeletingSession') || 'Eroare la ștergerea sesiunii');
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteSession, refreshSessions, success, showError, t]);

  const handleEditSession = useCallback((session: InventorySession) => {
    setSelectedSession(session);
    setSessionFormData({
      parishId: session.parishId,
      warehouseId: session.warehouseId || '',
      date: session.date,
      notes: session.notes || '',
    });
    setShowInventoryForm(true);
  }, []);

  const handleCloseInventoryForm = useCallback(() => {
    setShowInventoryForm(false);
    setSelectedSession(null);
    setSessionFormData({
      parishId: parishFilter || '',
      warehouseId: warehouseFilter || '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  }, [parishFilter, warehouseFilter]);

  const bookInventoryColumns = useMemo(() => [
    {
      key: 'code',
      label: t('code') || 'Cod',
      sortable: true,
    },
    {
      key: 'name',
      label: t('name') || 'Denumire',
      sortable: true,
    },
    {
      key: 'type',
      label: t('type') || 'Tip',
      sortable: false,
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          {value === 'product' ? (t('product') || 'Produs') : (t('fixedAsset') || 'Mijloc fix')}
        </Badge>
      ),
    },
    {
      key: 'category',
      label: t('category') || 'Categorie',
      sortable: false,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'quantity',
      label: t('quantity') || 'Cantitate',
      sortable: true,
      render: (value: number, row: BookInventoryItem) => `${value.toFixed(3)} ${row.unit}`,
    },
    {
      key: 'value',
      label: t('value') || 'Valoare',
      sortable: true,
      render: (value: number) => `${value.toFixed(2)} ${t('currency') || 'RON'}`,
    },
    {
      key: 'actions',
      label: t('actions') || 'Acțiuni',
      sortable: false,
      render: (_: any, row: BookInventoryItem) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSpotCheck(row)}
        >
          {t('spotCheck') || 'Spot Check'}
        </Button>
      ),
    },
  ], [t, handleSpotCheck]);

  const sessionsColumns = useMemo(() => [
    {
      key: 'date',
      label: t('date') || 'Data',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'parish',
      label: t('parish') || 'Parohie',
      sortable: false,
      render: (value: any) => value?.name || '-',
    },
    {
      key: 'warehouse',
      label: t('warehouse') || 'Gestiune',
      sortable: false,
      render: (value: any) => value?.name || '-',
    },
    {
      key: 'status',
      label: t('status') || 'Status',
      sortable: false,
      render: (value: string) => {
        const variants: Record<string, 'success' | 'warning' | 'secondary' | 'danger'> = {
          completed: 'success',
          in_progress: 'warning',
          draft: 'secondary',
          cancelled: 'danger',
        };
        return (
          <Badge variant={variants[value] || 'secondary'} size="sm">
            {value}
          </Badge>
        );
      },
    },
    {
      key: 'itemCount',
      label: t('items') || 'Itemi',
      sortable: false,
      render: (value: number) => value || 0,
    },
    {
      key: 'actions',
      label: t('actions') || 'Acțiuni',
      sortable: false,
      render: (_: any, row: InventorySession) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          }
          items={[
            ...(row.status !== 'completed' ? [
              { label: t('edit') || 'Edit', onClick: () => handleEditSession(row) },
              { label: t('complete') || 'Finalizează', onClick: () => setCompleteConfirm(row) },
            ] : []),
            { label: t('delete') || 'Delete', onClick: () => setDeleteConfirm(row), variant: 'danger' },
          ]}
        />
      ),
    },
  ], [t, handleEditSession]);

  const filteredWarehouses = useMemo(() => {
    if (!sessionFormData.parishId) return warehouses;
    return warehouses.filter(w => w.parishId === sessionFormData.parishId);
  }, [warehouses, sessionFormData.parishId]);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tMenu('pangare') || 'Pangare', href: `/${locale}/dashboard/pangare` },
          { label: tMenu('inventar') || 'Inventar', href: `/${locale}/dashboard/pangare/inventar` },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Book Inventory */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('bookInventory') || 'Inventar Scriptic'}</h2>
              <Button onClick={handleStartInventory}>
                {t('startInventory') || 'Începe Inventar'}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <FilterGrid>
                <ParishFilter
                  value={parishFilter}
                  onChange={(value) => {
                    setParishFilter(value);
                    setCurrentPage(1);
                  }}
                  parishes={parishes}
                />
                <FilterSelect
                  label={t('warehouse') || 'Gestiune'}
                  value={warehouseFilter}
                  onChange={(value) => {
                    setWarehouseFilter(value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: '', label: t('all') || 'Toate' },
                    ...warehouses.map(w => ({ value: w.id, label: w.name })),
                  ]}
                />
                <FilterSelect
                  label={t('type') || 'Tip'}
                  value={typeFilter}
                  onChange={(value) => {
                    setTypeFilter(value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: '', label: t('all') || 'Toate' },
                    { value: 'product', label: t('product') || 'Produse' },
                    { value: 'fixed_asset', label: t('fixedAsset') || 'Mijloace Fixe' },
                  ]}
                />
                <FilterClear
                  onClear={() => {
                    setParishFilter('');
                    setWarehouseFilter('');
                    setTypeFilter('');
                    setCurrentPage(1);
                  }}
                />
              </FilterGrid>

              <Table
                data={bookInventory}
                columns={bookInventoryColumns}
                loading={loading}
              />
            </div>
          </CardBody>
        </Card>

        {/* Inventory Sessions */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">{t('inventorySessions') || 'Sesiuni Inventar'}</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {error && (
                <div className="p-4 bg-danger/10 text-danger rounded">
                  {error}
                </div>
              )}

              <Table
                data={sessions}
                columns={sessionsColumns}
                loading={loading}
              />

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="text-sm text-text-secondary">
                    {t('showing')} {(pagination.page - 1) * pagination.pageSize + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('of')} {pagination.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      {t('previous')}
                    </Button>
                    <span className="text-sm text-text-secondary">
                      {t('page')} {pagination.page} {t('of')} {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages || loading}
                    >
                      {t('next')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Spot Check Modal */}
      {spotCheckItem && (
        <FormModal
          isOpen={showSpotCheckModal}
          onClose={handleCloseSpotCheckModal}
          onCancel={handleCloseSpotCheckModal}
          title={t('spotCheck') || 'Spot Check'}
          onSubmit={handleSaveSpotCheck}
          isSubmitting={isSubmitting}
          submitLabel={t('save') || 'Salvează'}
          cancelLabel={t('cancel') || 'Anulează'}
          size="md"
        >
          <div>
            <p className="font-semibold">{spotCheckItem.name}</p>
            <p className="text-sm text-text-secondary">Cod: {spotCheckItem.code}</p>
            <p className="text-sm text-text-secondary">
              {t('bookQuantity') || 'Cantitate scriptică'}: {spotCheckItem.quantity.toFixed(3)} {spotCheckItem.unit}
            </p>
          </div>
          <Input
            label={t('physicalQuantity') || 'Cantitate fizică'}
            type="number"
            step="0.001"
            value={spotCheckPhysicalQuantity}
            onChange={(e) => setSpotCheckPhysicalQuantity(e.target.value)}
            placeholder={spotCheckItem.quantity.toFixed(3)}
          />
          <Input
            label={t('notes') || 'Note'}
            type="text"
            value={spotCheckNotes}
            onChange={(e) => setSpotCheckNotes(e.target.value)}
            placeholder={t('optionalNotes') || 'Note opționale...'}
          />
        </FormModal>
      )}

      {/* Inventory Form Modal */}
      <FormModal
        isOpen={showInventoryForm}
        onClose={handleCloseInventoryForm}
        onCancel={handleCloseInventoryForm}
        title={selectedSession ? (t('editInventorySession') || 'Editează Sesiune Inventar') : (t('startInventory') || 'Începe Inventar')}
        onSubmit={handleSaveInventory}
        isSubmitting={isSubmitting}
        submitLabel={t('save') || 'Salvează'}
        cancelLabel={t('cancel') || 'Anulează'}
        size="lg"
      >
        <Select
          label={t('parish') || 'Parohie'}
          value={sessionFormData.parishId}
          onChange={(e) => setSessionFormData({ ...sessionFormData, parishId: e.target.value, warehouseId: '' })}
          options={parishes.map(p => ({ value: p.id, label: p.name }))}
          required
          disabled={isSubmitting}
        />
        <Select
          label={t('warehouse') || 'Gestiune'}
          value={sessionFormData.warehouseId}
          onChange={(e) => setSessionFormData({ ...sessionFormData, warehouseId: e.target.value })}
          options={[
            { value: '', label: t('all') || 'Toate' },
            ...filteredWarehouses.map(w => ({ value: w.id, label: w.name })),
          ]}
          disabled={isSubmitting}
        />
        <Input
          label={t('date') || 'Data'}
          type="date"
          value={sessionFormData.date}
          onChange={(e) => setSessionFormData({ ...sessionFormData, date: e.target.value })}
          required
          disabled={isSubmitting}
        />
        <Input
          label={t('notes') || 'Note'}
          value={sessionFormData.notes}
          onChange={(e) => setSessionFormData({ ...sessionFormData, notes: e.target.value })}
          placeholder={t('optionalNotes') || 'Note opționale...'}
          disabled={isSubmitting}
        />
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDeleteSession(deleteConfirm)}
        title={t('confirmDelete') || 'Confirmă ștergerea'}
        message={t('confirmDeleteMessage') || 'Sunteți sigur că doriți să ștergeți această sesiune?'}
        confirmLabel={t('delete') || 'Șterge'}
        cancelLabel={t('cancel') || 'Anulează'}
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* Complete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!completeConfirm}
        onClose={() => setCompleteConfirm(null)}
        onConfirm={() => completeConfirm && handleCompleteSession(completeConfirm)}
        title={t('confirmComplete') || 'Confirmă finalizarea'}
        message={t('confirmComplete') || 'Sunteți sigur că doriți să finalizați această sesiune de inventar? Ajustările vor fi generate automat.'}
        confirmLabel={t('complete') || 'Finalizează'}
        cancelLabel={t('cancel') || 'Anulează'}
        variant="warning"
        isLoading={isSubmitting}
      />
    </div>
  );
}

