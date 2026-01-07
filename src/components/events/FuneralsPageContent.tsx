'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { ToastContainer } from '@/components/ui/Toast';
import { MenuIcon } from '@/components/ui/icons/MenuIcon';
import { FuneralAddModal } from '@/components/events/FuneralAddModal';
import { FuneralFormData } from '@/components/events/types';
import { FuneralEditModal } from '@/components/events/FuneralEditModal';
import { DeleteEventDialog } from '@/components/events/DeleteEventDialog';
import { FuneralsFiltersCard } from '@/components/events/FuneralsFiltersCard';
import { FuneralsTableCard } from '@/components/events/FuneralsTableCard';
import { STATUS_VARIANT_MAP, EVENT_PAGE_SIZE, EVENT_TYPES } from '@/components/events/constants';
import { useEvents, ChurchEvent, EventStatus } from '@/hooks/useEvents';
import { useParishes } from '@/hooks/useParishes';
import { useToast } from '@/hooks/useToast';
import { useTranslations } from 'next-intl';
import {
  formatEventDate,
  mapEventToFormData,
  getInitialEventFormData,
  buildEventFetchParams,
} from '@/lib/utils/events';
import { buildEventActionItems } from '@/lib/utils/eventActions';

interface FuneralsPageContentProps {
  locale: string;
}

/**
 * Funerals page content component
 * Contains all the JSX/HTML and business logic that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function FuneralsPageContent({ locale }: FuneralsPageContentProps) {
  const t = useTranslations('common');

  const {
    events,
    loading,
    error,
    pagination,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    confirmEvent,
    cancelEvent,
  } = useEvents();

  const { parishes, fetchParishes } = useParishes();
  const { toasts, success, error: showError, removeToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FuneralFormData>(getInitialEventFormData());

  // Helper function to build fetch parameters
  const buildFetchParams = useCallback(() => buildEventFetchParams({
    page: currentPage,
    pageSize: EVENT_PAGE_SIZE,
    type: EVENT_TYPES.FUNERAL,
    search: searchTerm,
    parishId: parishFilter,
    status: statusFilter,
    dateFrom: dateFrom,
    dateTo: dateTo,
    sortBy: 'eventDate',
    sortOrder: 'desc',
  }), [currentPage, searchTerm, parishFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  useEffect(() => {
    fetchEvents(buildFetchParams());
  }, [buildFetchParams, fetchEvents]);

  // Helper functions
  const formatDate = useCallback((date: string | null) => formatEventDate(date, locale), [locale]);

  const resetForm = useCallback(() => {
    setFormData(getInitialEventFormData());
  }, []);

  const refreshEvents = useCallback(() => {
    fetchEvents(buildFetchParams());
  }, [buildFetchParams, fetchEvents]);

  // Event handlers
  const handleEdit = useCallback((event: ChurchEvent) => {
    setSelectedEvent(event);
    setFormData(mapEventToFormData(event));
    setShowEditModal(true);
  }, []);

  const handleConfirm = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      const result = await confirmEvent(id);
      if (result) {
        success(t('confirmed') || 'Eveniment confirmat cu succes!');
        refreshEvents();
      } else {
        showError(t('errorConfirmingEvent') || 'Eroare la confirmarea evenimentului');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errorOccurred') || 'A apărut o eroare';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmEvent, success, showError, refreshEvents, t]);

  const handleCancel = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      const result = await cancelEvent(id);
      if (result) {
        success(t('cancelled') || 'Eveniment anulat cu succes!');
        refreshEvents();
      } else {
        showError(t('errorCancellingEvent') || 'Eroare la anularea evenimentului');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errorOccurred') || 'A apărut o eroare';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [cancelEvent, success, showError, refreshEvents, t]);

  const handleCreate = useCallback(async () => {
    if (!formData.parishId) {
      showError(t('pleaseSelectParish') || 'Vă rugăm să selectați o parohie');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createEvent({
        ...formData,
        type: EVENT_TYPES.FUNERAL,
        eventDate: formData.eventDate || null,
        location: formData.location || null,
        priestName: formData.priestName || null,
        notes: formData.notes || null,
      });

      if (result) {
        success(t('created') || 'Înmormântare creată cu succes!');
        setShowAddModal(false);
        resetForm();
        refreshEvents();
      } else {
        showError(t('errorCreatingEvent') || 'Eroare la crearea înmormântării');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errorOccurred') || 'A apărut o eroare';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, createEvent, success, showError, resetForm, refreshEvents, t]);

  const handleUpdate = useCallback(async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      const result = await updateEvent(selectedEvent.id, {
        ...formData,
        eventDate: formData.eventDate || null,
        location: formData.location || null,
        priestName: formData.priestName || null,
        notes: formData.notes || null,
      });

      if (result) {
        success(t('updated') || 'Înmormântare actualizată cu succes!');
        setShowEditModal(false);
        setSelectedEvent(null);
        refreshEvents();
      } else {
        showError(t('errorUpdatingEvent') || 'Eroare la actualizarea înmormântării');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errorOccurred') || 'A apărut o eroare';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedEvent, formData, updateEvent, success, showError, refreshEvents, t]);

  const handleDelete = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      const result = await deleteEvent(id);
      if (result) {
        success(t('deleted') || 'Înmormântare ștearsă cu succes!');
        setDeleteConfirm(null);
        refreshEvents();
      } else {
        showError(t('errorDeletingEvent') || 'Eroare la ștergerea înmormântării');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errorOccurred') || 'A apărut o eroare';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteEvent, success, showError, refreshEvents, t]);

  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    resetForm();
  }, [resetForm]);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedEvent(null);
  }, []);

  // Helper function to build action menu items based on event status
  const buildActionItems = useCallback((event: ChurchEvent) => {
    return buildEventActionItems(
      event,
      {
        onEdit: handleEdit,
        onConfirm: handleConfirm,
        onCancel: handleCancel,
        onDelete: (id: string) => setDeleteConfirm(id),
      },
      {
        edit: t('edit') || 'Editează',
        confirm: t('confirm'),
        cancel: t('cancel') || 'Anulează',
        delete: t('delete') || 'Șterge',
      }
    );
  }, [t, handleEdit, handleConfirm, handleCancel]);

  // Table columns definition
  const columns = useMemo(() => [
    {
      key: 'eventDate' as keyof ChurchEvent,
      label: t('date') || 'Data',
      sortable: true,
      render: (value: string | null) => formatDate(value),
    },
    {
      key: 'location' as keyof ChurchEvent,
      label: t('location') || 'Locație',
      sortable: false,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'priestName' as keyof ChurchEvent,
      label: t('priest') || 'Preot',
      sortable: false,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'status' as keyof ChurchEvent,
      label: t('status') || 'Status',
      sortable: false,
      render: (value: EventStatus) => (
        <Badge variant={STATUS_VARIANT_MAP[value] || 'secondary'} size="sm">
          {t(value) || value}
        </Badge>
      ),
    },
    {
      key: 'actions' as keyof ChurchEvent,
      label: t('actions'),
      sortable: false,
      render: (_: any, row: ChurchEvent) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <MenuIcon />
            </Button>
          }
          items={buildActionItems(row)}
          align="right"
        />
      ),
    },
  ], [t, formatDate, buildActionItems]);

  return (
    <PageContainer>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('events'), href: `/${locale}/dashboard/events` },
          { label: t('funerals') || 'Înmormântări' },
        ]}
        title={t('funerals') || 'Înmormântări'}
        action={<Button onClick={() => setShowAddModal(true)}>{t('add') || 'Adaugă'} {t('funeral') || 'Înmormântare'}</Button>}
      />

      {/* Filters */}
      <FuneralsFiltersCard
        searchTerm={searchTerm}
        parishFilter={parishFilter}
        statusFilter={statusFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        parishes={parishes}
        onSearchChange={setSearchTerm}
        onParishFilterChange={setParishFilter}
        onStatusFilterChange={setStatusFilter}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      {/* Events Table */}
      <FuneralsTableCard
        data={events}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData') || 'No funerals available'}
      />

      {/* Add Modal */}
      <FuneralAddModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        onCancel={handleCloseAddModal}
        formData={formData}
        onFormDataChange={setFormData}
        parishes={parishes}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        error={error}
      />

      {/* Edit Modal */}
      <FuneralEditModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onCancel={handleCloseEditModal}
        formData={formData}
        onFormDataChange={setFormData}
        parishes={parishes}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        error={error}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteEventDialog
        isOpen={!!deleteConfirm}
        eventId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </PageContainer>
  );
}

