'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { useEvents, ChurchEvent, EventType, EventStatus } from '@/hooks/useEvents';
import { useParishes } from '@/hooks/useParishes';
import { useEventStatistics } from '@/hooks/useEventStatistics';
import { useTranslations } from 'next-intl';
import { EventsTableCard } from '@/components/events/EventsTableCard';
import { EventsStatisticsCards } from '@/components/events/EventsStatisticsCards';
import { EventFormFields } from '@/components/events/EventFormFields';
import { EventsFiltersCardWithType } from '@/components/events/EventsFiltersCardWithType';
import { formatEventDate } from '@/lib/utils/events';
import { STATUS_VARIANT_MAP, EVENT_PAGE_SIZE, EVENT_TYPES } from '@/components/events/constants';

interface EventsPageContentProps {
  locale: string;
}

interface EventFormData {
  parishId: string;
  type: EventType;
  status: EventStatus;
  eventDate: string;
  location: string;
  priestName: string;
  notes: string;
}

interface EventFetchParams {
  page: number;
  pageSize: number;
  search?: string;
  parishId?: string;
  type?: EventType;
  status?: EventStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const INITIAL_FORM_DATA: EventFormData = {
  parishId: '',
  type: EVENT_TYPES.WEDDING,
  status: 'pending',
  eventDate: '',
  location: '',
  priestName: '',
  notes: '',
};

/**
 * Events page content component
 * Contains all the JSX/HTML and business logic that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function EventsPageContent({ locale }: EventsPageContentProps) {
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
  const { statistics, fetchStatistics } = useEventStatistics();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventType | ''>('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>(INITIAL_FORM_DATA);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch parishes and statistics on mount
  useEffect(() => {
    fetchParishes({ all: true });
    fetchStatistics();
  }, [fetchParishes, fetchStatistics]);

  // Build fetch parameters with proper typing
  const fetchParams = useMemo<EventFetchParams>(() => ({
    page: currentPage,
    pageSize: EVENT_PAGE_SIZE,
    search: searchTerm || undefined,
    parishId: parishFilter || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy: 'eventDate',
    sortOrder: 'desc',
  }), [currentPage, searchTerm, parishFilter, typeFilter, statusFilter, dateFrom, dateTo]);

  // Fetch events when filters or page changes
  useEffect(() => {
    fetchEvents(fetchParams);
  }, [fetchParams, fetchEvents]);

  // Normalize form data for API (convert empty strings to null)
  const normalizeFormData = useCallback((data: EventFormData) => ({
    ...data,
    eventDate: data.eventDate || null,
    location: data.location || null,
    priestName: data.priestName || null,
    notes: data.notes || null,
  }), []);

  // Memoized handlers to prevent unnecessary re-renders
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setValidationError(null);
  }, []);

  const handleFormDataChange = useCallback((updates: Partial<EventFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleValidationErrorClear = useCallback(() => {
    setValidationError(null);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!formData.parishId || !formData.type) {
      setValidationError(t('fillRequiredFields') || 'Please fill in all required fields');
      return;
    }

    setValidationError(null);
    try {
      const result = await createEvent(normalizeFormData(formData));
      if (result) {
        setShowAddModal(false);
        resetForm();
        fetchStatistics();
      }
    } catch (error) {
      setValidationError(t('errorCreatingEvent') || 'Failed to create event');
    }
  }, [formData, createEvent, fetchStatistics, resetForm, normalizeFormData, t]);

  const handleUpdate = useCallback(async () => {
    if (!selectedEvent) return;

    setValidationError(null);
    try {
      const result = await updateEvent(selectedEvent.id, normalizeFormData(formData));
      if (result) {
        setShowEditModal(false);
        setSelectedEvent(null);
        fetchStatistics();
      }
    } catch (error) {
      setValidationError(t('errorUpdatingEvent') || 'Failed to update event');
    }
  }, [selectedEvent, formData, updateEvent, fetchStatistics, normalizeFormData, t]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const result = await deleteEvent(id);
      if (result) {
        setDeleteConfirm(null);
        fetchStatistics();
      }
    } catch (error) {
      // Error handling could show a toast notification here
      console.error('Failed to delete event:', error);
    }
  }, [deleteEvent, fetchStatistics]);

  const handleEdit = useCallback((event: ChurchEvent) => {
    setSelectedEvent(event);
    setFormData({
      parishId: event.parishId,
      type: event.type,
      status: event.status,
      eventDate: event.eventDate || '',
      location: event.location || '',
      priestName: event.priestName || '',
      notes: event.notes || '',
    });
    setShowEditModal(true);
    setValidationError(null);
  }, []);

  const handleConfirm = useCallback(async (id: string) => {
    try {
      await confirmEvent(id);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to confirm event:', error);
    }
  }, [confirmEvent, fetchStatistics]);

  const handleCancel = useCallback(async (id: string) => {
    try {
      await cancelEvent(id);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to cancel event:', error);
    }
  }, [cancelEvent, fetchStatistics]);

  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    resetForm();
  }, [resetForm]);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedEvent(null);
    setValidationError(null);
  }, []);

  // Memoized utility functions
  const formatDate = useCallback((date: string | null) => formatEventDate(date, locale), [locale]);

  const getTypeLabel = useCallback((type: EventType) => {
    const typeMap: Record<EventType, string> = {
      wedding: t('wedding'),
      baptism: t('baptism'),
      funeral: t('funeral'),
    };
    return typeMap[type] || type;
  }, [t]);

  // Memoized table columns with all dependencies
  const columns = useMemo(() => [
    { 
      key: 'type' as keyof ChurchEvent, 
      label: t('type'), 
      sortable: true, 
      render: (value: EventType) => getTypeLabel(value) 
    },
    {
      key: 'eventDate' as keyof ChurchEvent,
      label: t('date'),
      sortable: true,
      render: (value: string | null) => formatDate(value),
    },
    { 
      key: 'location' as keyof ChurchEvent, 
      label: t('location'), 
      sortable: false, 
      render: (value: string | null) => value || '-' 
    },
    { 
      key: 'priestName' as keyof ChurchEvent, 
      label: t('priest'), 
      sortable: false, 
      render: (value: string | null) => value || '-' 
    },
    {
      key: 'status' as keyof ChurchEvent,
      label: t('status'),
      sortable: false,
      render: (value: EventStatus) => (
        <Badge variant={STATUS_VARIANT_MAP[value] || 'secondary'} size="sm">
          {t(value)}
        </Badge>
      ),
    },
    {
      key: 'actions' as keyof ChurchEvent,
      label: t('actions'),
      sortable: false,
      render: (_: unknown, row: ChurchEvent) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          }
          items={[
            { label: t('edit'), onClick: () => handleEdit(row) },
            ...(row.status === 'pending' ? [{ label: t('confirm'), onClick: () => handleConfirm(row.id) }] : []),
            ...(row.status !== 'cancelled' && row.status !== 'completed' ? [{ label: t('cancel'), onClick: () => handleCancel(row.id), variant: 'danger' as const }] : []),
            { label: t('delete'), onClick: () => setDeleteConfirm(row.id), variant: 'danger' as const },
          ]}
          align="right"
        />
      ),
    },
  ], [t, formatDate, getTypeLabel, handleEdit, handleConfirm, handleCancel]);

  // Memoized breadcrumbs
  const breadcrumbs = useMemo(
    () => [
      { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
      { label: t('events') },
    ],
    [t, locale]
  );

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('events')}
        action={<Button onClick={() => setShowAddModal(true)}>{t('add')} {t('event')}</Button>}
      />

      {/* Statistics Cards */}
      <EventsStatisticsCards statistics={statistics} />

      {/* Filters */}
      <EventsFiltersCardWithType
        searchTerm={searchTerm}
        parishFilter={parishFilter}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        parishes={parishes}
        onSearchChange={setSearchTerm}
        onParishFilterChange={setParishFilter}
        onTypeFilterChange={setTypeFilter}
        onStatusFilterChange={setStatusFilter}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      {/* Events Table */}
      <EventsTableCard
        data={events}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData') || 'No events available'}
      />

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title={`${t('add')} ${t('event')}`}
      >
        <EventFormFields
          formData={formData}
          parishes={parishes}
          showStatusField={false}
          showTypeField={true}
          validationError={validationError}
          onFormDataChange={handleFormDataChange}
          onValidationErrorClear={handleValidationErrorClear}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={handleCloseAddModal}>
            {t('cancel')}
          </Button>
          <Button onClick={handleCreate}>{t('create')}</Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title={`${t('edit')} ${t('event')}`}
      >
        <EventFormFields
          formData={formData}
          parishes={parishes}
          showStatusField={true}
          showTypeField={true}
          validationError={validationError}
          onFormDataChange={handleFormDataChange}
          onValidationErrorClear={handleValidationErrorClear}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={handleCloseEditModal}>
            {t('cancel')}
          </Button>
          <Button onClick={handleUpdate}>{t('save')}</Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('confirmDelete')}
      >
        <div className="space-y-4">
          <p>{t('confirmDeleteEvent')}</p>
          <div className="flex justify-end gap-2">
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
