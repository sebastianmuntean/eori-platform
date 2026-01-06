'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';
import { SpotCheckModal } from '@/components/inventory/SpotCheckModal';
import { InventorySessionModal } from '@/components/inventory/InventorySessionModal';
import { DeleteSessionDialog } from '@/components/inventory/DeleteSessionDialog';
import { CompleteSessionDialog } from '@/components/inventory/CompleteSessionDialog';
import { BookInventoryCard } from '@/components/inventory/BookInventoryCard';
import { InventorySessionsCard } from '@/components/inventory/InventorySessionsCard';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useInventory, BookInventoryItem, InventorySession } from '@/hooks/useInventory';
import { useParishes } from '@/hooks/useParishes';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useTranslations } from 'next-intl';
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

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
    fetchWarehouses({ pageSize: 1000 });
  }, [permissionLoading, fetchParishes, fetchWarehouses]);

  useEffect(() => {
    if (permissionLoading) return;
    if (parishFilter || warehouseFilter) {
      fetchBookInventory({
        parishId: parishFilter || undefined,
        warehouseId: warehouseFilter || undefined,
        type: (typeFilter === 'product' || typeFilter === 'fixed_asset') ? typeFilter : undefined,
      }).then(setBookInventory);
    }
  }, [permissionLoading, parishFilter, warehouseFilter, typeFilter, fetchBookInventory]);

  useEffect(() => {
    if (permissionLoading) return;
    fetchSessions({
      page: currentPage,
      pageSize: 10,
      parishId: parishFilter || undefined,
      warehouseId: warehouseFilter || undefined,
    });
  }, [permissionLoading, currentPage, parishFilter, warehouseFilter, fetchSessions]);

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

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

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
      key: 'code' as keyof BookInventoryItem,
      label: t('code') || 'Cod',
      sortable: true,
    },
    {
      key: 'name' as keyof BookInventoryItem,
      label: t('name') || 'Denumire',
      sortable: true,
    },
    {
      key: 'type' as keyof BookInventoryItem,
      label: t('type') || 'Tip',
      sortable: false,
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          {value === 'product' ? (t('product') || 'Produs') : (t('fixedAsset') || 'Mijloc fix')}
        </Badge>
      ),
    },
    {
      key: 'category' as keyof BookInventoryItem,
      label: t('category') || 'Categorie',
      sortable: false,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'quantity' as keyof BookInventoryItem,
      label: t('quantity') || 'Cantitate',
      sortable: true,
      render: (value: number, row: BookInventoryItem) => `${value.toFixed(3)} ${row.unit}`,
    },
    {
      key: 'value' as keyof BookInventoryItem,
      label: t('value') || 'Valoare',
      sortable: true,
      render: (value: number) => `${value.toFixed(2)} ${t('currency') || 'RON'}`,
    },
    {
      key: 'actions' as keyof BookInventoryItem,
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
      key: 'date' as keyof InventorySession,
      label: t('date') || 'Data',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'parish' as keyof InventorySession,
      label: t('parish') || 'Parohie',
      sortable: false,
      render: (value: any) => value?.name || '-',
    },
    {
      key: 'warehouse' as keyof InventorySession,
      label: t('warehouse') || 'Gestiune',
      sortable: false,
      render: (value: any) => value?.name || '-',
    },
    {
      key: 'status' as keyof InventorySession,
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
      key: 'itemCount' as keyof InventorySession,
      label: t('items') || 'Itemi',
      sortable: false,
      render: (value: number) => value || 0,
    },
    {
      key: 'actions' as keyof InventorySession,
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
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tMenu('pangare') || 'Pangare', href: `/${locale}/dashboard/pangare` },
          { label: tMenu('inventar') || 'Inventar' },
        ]}
        title={tMenu('inventar') || 'Inventar'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Book Inventory */}
        <BookInventoryCard
          title={t('bookInventory') || 'Inventar Scriptic'}
          data={bookInventory}
          columns={bookInventoryColumns}
          loading={loading}
          emptyMessage={t('noData') || 'No inventory items available'}
          parishes={parishes}
          warehouses={warehouses}
          parishFilter={parishFilter}
          warehouseFilter={warehouseFilter}
          typeFilter={typeFilter}
          onParishFilterChange={(value) => {
            setParishFilter(value);
            setCurrentPage(1);
          }}
          onWarehouseFilterChange={(value) => {
            setWarehouseFilter(value);
            setCurrentPage(1);
          }}
          onTypeFilterChange={(value) => {
            setTypeFilter(value);
            setCurrentPage(1);
          }}
          onClearFilters={() => {
            setParishFilter('');
            setWarehouseFilter('');
            setTypeFilter('');
            setCurrentPage(1);
          }}
          onStartInventory={handleStartInventory}
          onSpotCheck={handleSpotCheck}
        />

        {/* Inventory Sessions */}
        <InventorySessionsCard
          title={t('inventorySessions') || 'Sesiuni Inventar'}
          data={sessions}
          columns={sessionsColumns}
          loading={loading}
          error={error}
          pagination={pagination}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          emptyMessage={t('noData') || 'No inventory sessions available'}
        />
      </div>

      {/* Spot Check Modal */}
      <SpotCheckModal
        isOpen={showSpotCheckModal}
        onClose={handleCloseSpotCheckModal}
        onCancel={handleCloseSpotCheckModal}
        item={spotCheckItem}
        physicalQuantity={spotCheckPhysicalQuantity}
        notes={spotCheckNotes}
        onPhysicalQuantityChange={setSpotCheckPhysicalQuantity}
        onNotesChange={setSpotCheckNotes}
        onSubmit={handleSaveSpotCheck}
        isSubmitting={isSubmitting}
      />

      {/* Inventory Session Modal */}
      <InventorySessionModal
        isOpen={showInventoryForm}
        onClose={handleCloseInventoryForm}
        onCancel={handleCloseInventoryForm}
        session={selectedSession}
        formData={sessionFormData}
        onFormDataChange={setSessionFormData}
        parishes={parishes}
        warehouses={warehouses}
        filteredWarehouses={filteredWarehouses}
        onSubmit={handleSaveInventory}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteSessionDialog
        isOpen={!!deleteConfirm}
        session={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteSession}
        isLoading={isSubmitting}
      />

      {/* Complete Confirmation Dialog */}
      <CompleteSessionDialog
        isOpen={!!completeConfirm}
        session={completeConfirm}
        onClose={() => setCompleteConfirm(null)}
        onConfirm={handleCompleteSession}
        isLoading={isSubmitting}
      />
    </div>
  );
}

