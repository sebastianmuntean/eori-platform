'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { useEvents, ChurchEvent, EventStatus } from '@/hooks/useEvents';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

export default function FuneralsPage() {
  const params = useParams();
  const locale = params.locale as string;
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
  const [formData, setFormData] = useState({
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
      type: 'funeral', // Filter by funeral type
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
      alert(t('fillRequiredFields'));
      return;
    }

    const result = await createEvent({
      ...formData,
      type: 'funeral',
      eventDate: formData.eventDate || null,
      location: formData.location || null,
      priestName: formData.priestName || null,
      notes: formData.notes || null,
    });

    if (result) {
      setShowAddModal(false);
      resetForm();
    }
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
  };

  const handleDelete = async (id: string) => {
    const result = await deleteEvent(id);
    if (result) {
      setDeleteConfirm(null);
    }
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
    await confirmEvent(id);
  };

  const handleCancel = async (id: string) => {
    await cancelEvent(id);
  };

  const resetForm = () => {
    setFormData({
      parishId: '',
      status: 'pending',
      eventDate: '',
      location: '',
      priestName: '',
      notes: '',
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  };

  const columns = [
    {
      key: 'eventDate',
      label: t('date') || 'Data',
      sortable: true,
      render: (value: string | null) => formatDate(value),
    },
    { key: 'location', label: t('location') || 'Locație', sortable: false, render: (value: string | null) => value || '-' },
    { key: 'priestName', label: t('priest') || 'Preot', sortable: false, render: (value: string | null) => value || '-' },
    {
      key: 'status',
      label: t('status') || 'Status',
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
            {t(value) || value}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
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
            { label: t('edit') || 'Editează', onClick: () => handleEdit(row) },
            ...(row.status === 'pending' ? [{ label: t('confirm'), onClick: () => handleConfirm(row.id) }] : []),
            ...(row.status !== 'cancelled' && row.status !== 'completed' ? [{ label: t('cancel') || 'Anulează', onClick: () => handleCancel(row.id), variant: 'danger' as const }] : []),
            { label: t('delete') || 'Șterge', onClick: () => setDeleteConfirm(row.id), variant: 'danger' as const },
          ]}
          align="right"
        />
      ),
    },
  ];

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('events'), href: `/${locale}/dashboard/events` },
    { label: t('funerals') || 'Înmormântări' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('funerals') || 'Înmormântări'}</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)}>{t('add') || 'Adaugă'} {t('funeral') || 'Înmormântare'}</Button>
      </div>

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
              onChange={(e) => setStatusFilter(e.target.value as EventStatus | '')}
            >
              <option value="">{t('allStatuses')}</option>
              <option value="pending">{t('pending') || 'În așteptare'}</option>
              <option value="confirmed">{t('confirmed') || 'Confirmat'}</option>
              <option value="completed">{t('completed') || 'Finalizat'}</option>
              <option value="cancelled">{t('cancelled') || 'Anulat'}</option>
            </select>
            <div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              type="date"
              placeholder={t('dateFrom')}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              type="date"
              placeholder={t('dateTo')}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Events Table */}
      <Card variant="outlined">
        <CardBody>
          {error && (
            <div className="mb-4 p-4 bg-danger/10 text-danger rounded-md">
              {error}
            </div>
          )}
          <Table
            data={events}
            columns={columns}
            loading={loading}
            pagination={pagination ? {
              currentPage: pagination.page,
              totalPages: pagination.totalPages,
              onPageChange: setCurrentPage,
            } : undefined}
          />
        </CardBody>
      </Card>

      {/* Add/Edit Modals - same structure as other event type pages */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={`${t('add') || 'Adaugă'} ${t('funeral') || 'Înmormântare'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('parish') || 'Parohie'} *</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={formData.parishId}
              onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
              required
            >
              <option value="">{t('selectParish') || 'Selectează parohia'}</option>
              {parishes.map((parish) => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('date') || 'Data'}</label>
            <Input
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('location') || 'Locație'}</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('priest') || 'Preot'}</label>
            <Input
              value={formData.priestName}
              onChange={(e) => setFormData({ ...formData, priestName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('notes') || 'Observații'}</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowAddModal(false); resetForm(); }}>
              {t('cancel') || 'Anulează'}
            </Button>
            <Button onClick={handleCreate}>{t('create')}</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEvent(null);
        }}
        title={`${t('edit') || 'Editează'} ${t('funeral') || 'Înmormântare'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('parish') || 'Parohie'} *</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={formData.parishId}
              onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
              required
            >
              <option value="">{t('selectParish') || 'Selectează parohia'}</option>
              {parishes.map((parish) => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('status') || 'Status'}</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
            >
              <option value="pending">{t('pending') || 'În așteptare'}</option>
              <option value="confirmed">{t('confirmed') || 'Confirmat'}</option>
              <option value="completed">{t('completed') || 'Finalizat'}</option>
              <option value="cancelled">{t('cancelled') || 'Anulat'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('date') || 'Data'}</label>
            <Input
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('location') || 'Locație'}</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('priest') || 'Preot'}</label>
            <Input
              value={formData.priestName}
              onChange={(e) => setFormData({ ...formData, priestName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('notes') || 'Observații'}</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowEditModal(false); setSelectedEvent(null); }}>
              {t('cancel') || 'Anulează'}
            </Button>
            <Button onClick={handleUpdate}>{t('save')}</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('confirmDelete')}
      >
        <div className="space-y-4">
          <p>{t('confirmDeleteEvent')}</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              {t('cancel') || 'Anulează'}
            </Button>
            <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              {t('delete') || 'Șterge'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

