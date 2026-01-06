'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { useEvents, ChurchEvent, EventStatus } from '@/hooks/useEvents';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { EVENTS_PERMISSIONS } from '@/lib/permissions/events';
import { WeddingAddModal, WeddingFormData } from '@/components/events/WeddingAddModal';
import { WeddingEditModal } from '@/components/events/WeddingEditModal';
import { DeleteEventDialog } from '@/components/events/DeleteEventDialog';
import { WeddingsFiltersCard } from '@/components/events/WeddingsFiltersCard';
import { WeddingsTableCard } from '@/components/events/WeddingsTableCard';

export default function WeddingsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('weddings'));

  // Check permission to access Weddings
  const { loading: permissionLoading } = useRequirePermission(EVENTS_PERMISSIONS.VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return null;
  }

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
  const [formData, setFormData] = useState<WeddingFormData>({
    parishId: '',
    status: 'pending' as EventStatus,
    eventDate: '',
    location: '',
    priestName: '',
    notes: '',
  });

  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  useEffect(() => {
    const params: any = {
      page: currentPage,
      pageSize: 10,
      type: 'wedding', // Filter by wedding type
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      status: statusFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy: 'eventDate',
      sortOrder: 'desc',
    };
    fetchEvents(params);
  }, [currentPage, searchTerm, parishFilter, statusFilter, dateFrom, dateTo, fetchEvents]);

  const handleCreate = async () => {
    if (!formData.parishId) {
      // Validation error is handled by required field in modal
      return;
    }

    const result = await createEvent({
      ...formData,
      type: 'wedding',
      eventDate: formData.eventDate || null,
      location: formData.location || null,
      priestName: formData.priestName || null,
      notes: formData.notes || null,
    });

    if (result) {
      setShowAddModal(false);
      resetForm();
    }
    // Error handling is done by the hook - error state is displayed in table card
  };

  const handleUpdate = async () => {
    if (!selectedEvent) return;

    const result = await updateEvent(selectedEvent.id, {
      ...formData,
      eventDate: formData.eventDate || null,
      location: formData.location || null,
      priestName: formData.priestName || null,
      notes: formData.notes || null,
    });

    if (result) {
      setShowEditModal(false);
      setSelectedEvent(null);
    }
    // Error handling is done by the hook - error state is displayed in table card
  };

  const handleDelete = async (id: string) => {
    const result = await deleteEvent(id);
    if (result) {
      setDeleteConfirm(null);
    }
    // Error handling is done by the hook - error state is displayed in table card
    // Dialog remains open if deletion fails so user can see the error
  };

  const handleEdit = (event: ChurchEvent) => {
    setSelectedEvent(event);
    setFormData({
      parishId: event.parishId,
      status: event.status,
      eventDate: event.eventDate || '',
      location: event.location || '',
      priestName: event.priestName || '',
      notes: event.notes || '',
    });
    setShowEditModal(true);
  };

  const handleConfirm = async (id: string) => {
    const result = await confirmEvent(id);
    if (!result) {
      // Error is handled by the hook and displayed via error state
      console.error('Failed to confirm wedding event');
    }
  };

  const handleCancel = async (id: string) => {
    const result = await cancelEvent(id);
    if (!result) {
      // Error is handled by the hook and displayed via error state
      console.error('Failed to cancel wedding event');
    }
  };

  const resetForm = () => {
    setFormData({
      parishId: '',
      status: 'pending' as EventStatus,
      eventDate: '',
      location: '',
      priestName: '',
      notes: '',
    });
  };

  const formatDate = useCallback((date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  }, [locale]);

  const columns = useMemo(() => [
    {
      key: 'eventDate' as keyof ChurchEvent,
      label: t('date'),
      sortable: true,
      render: (value: string | null) => formatDate(value),
    },
    { key: 'location' as keyof ChurchEvent, label: t('location'), sortable: false, render: (value: string | null) => value || '-' },
    { key: 'priestName' as keyof ChurchEvent, label: t('priest'), sortable: false, render: (value: string | null) => value || '-' },
    {
      key: 'status' as keyof ChurchEvent,
      label: t('status'),
      sortable: false,
      render: (value: EventStatus) => {
        const variantMap: Record<EventStatus, 'warning' | 'success' | 'danger' | 'secondary'> = {
          pending: 'warning',
          confirmed: 'success',
          completed: 'success',
          cancelled: 'danger',
        };
        return (
          <Badge variant={variantMap[value] || 'secondary'} size="sm">
            {t(value)}
          </Badge>
        );
      },
    },
    {
      key: 'actions' as keyof ChurchEvent,
      label: t('actions'),
      sortable: false,
      render: (_: any, row: ChurchEvent) => (
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
  ], [t, formatDate]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('events'), href: `/${locale}/dashboard/events` },
          { label: t('weddings') },
        ]}
        title={t('weddings')}
        action={<Button onClick={() => setShowAddModal(true)}>{t('add')} {t('wedding')}</Button>}
      />

      <WeddingsFiltersCard
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

      <WeddingsTableCard
        data={events}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData') || 'No weddings available'}
      />

      <WeddingAddModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onCancel={() => {
          setShowAddModal(false);
          resetForm();
        }}
        formData={formData}
        onFormDataChange={setFormData}
        parishes={parishes}
        onSubmit={handleCreate}
        isSubmitting={loading}
        error={error}
      />

      <WeddingEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEvent(null);
        }}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedEvent(null);
        }}
        formData={formData}
        onFormDataChange={setFormData}
        parishes={parishes}
        onSubmit={handleUpdate}
        isSubmitting={loading}
        error={error}
      />

      <DeleteEventDialog
        isOpen={!!deleteConfirm}
        eventId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

