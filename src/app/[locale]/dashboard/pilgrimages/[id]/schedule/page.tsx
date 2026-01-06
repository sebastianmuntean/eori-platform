'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { usePilgrimage } from '@/hooks/usePilgrimage';
import { usePilgrimageSchedule, PilgrimageScheduleItem, ActivityType } from '@/hooks/usePilgrimageSchedule';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PILGRIMAGES_PERMISSIONS } from '@/lib/permissions/pilgrimages';

export default function PilgrimageSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');

  // Check permission to view pilgrimages
  const { loading: permissionLoading } = useRequirePermission(PILGRIMAGES_PERMISSIONS.VIEW);

  const { pilgrimage, fetchPilgrimage } = usePilgrimage();
  usePageTitle(pilgrimage?.title ? `${tPilgrimages('schedule') || 'Schedule'} - ${pilgrimage.title}` : (tPilgrimages('schedule') || 'Schedule'));
  const {
    schedule,
    loading,
    error,
    fetchSchedule,
    addActivity,
    updateActivity,
    deleteActivity,
  } = usePilgrimageSchedule();

  // Don't render content while checking permissions
  if (permissionLoading) {
    return null;
  }

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<PilgrimageScheduleItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    dayNumber: '',
    date: '',
    time: '',
    title: '',
    description: '',
    location: '',
    activityType: 'visit' as ActivityType,
    durationMinutes: '',
    isOptional: false,
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchPilgrimage(id);
      fetchSchedule(id);
    }
  }, [id, fetchPilgrimage, fetchSchedule]);

  const handleCreate = async () => {
    if (!formData.title) {
      alert(t('fillRequiredFields'));
      return;
    }

    const result = await addActivity(id, {
      ...formData,
      dayNumber: formData.dayNumber ? parseInt(formData.dayNumber) : null,
      date: formData.date || null,
      time: formData.time || null,
      description: formData.description || null,
      location: formData.location || null,
      durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
      notes: formData.notes || null,
    });

    if (result) {
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!selectedActivity) return;

    const result = await updateActivity(id, selectedActivity.id, {
      ...formData,
      dayNumber: formData.dayNumber ? parseInt(formData.dayNumber) : null,
      date: formData.date || null,
      time: formData.time || null,
      description: formData.description || null,
      location: formData.location || null,
      durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
      notes: formData.notes || null,
    });

    if (result) {
      setShowEditModal(false);
      setSelectedActivity(null);
    }
  };

  const handleDelete = async (activityId: string) => {
    const result = await deleteActivity(id, activityId);
    if (result) {
      setDeleteConfirm(null);
    }
  };

  const handleEdit = (activity: PilgrimageScheduleItem) => {
    setSelectedActivity(activity);
    setFormData({
      dayNumber: activity.dayNumber?.toString() || '',
      date: activity.date || '',
      time: activity.time || '',
      title: activity.title,
      description: activity.description || '',
      location: activity.location || '',
      activityType: activity.activityType,
      durationMinutes: activity.durationMinutes?.toString() || '',
      isOptional: activity.isOptional || false,
      notes: activity.notes || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      dayNumber: '',
      date: '',
      time: '',
      title: '',
      description: '',
      location: '',
      activityType: 'visit',
      durationMinutes: '',
      isOptional: false,
      notes: '',
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  };

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return time;
  };

  const getActivityTypeLabel = (type: ActivityType) => {
    return tPilgrimages(`activityTypes.${type}` as any) || type;
  };

  const columns = [
    {
      key: 'dayNumber' as keyof PilgrimageScheduleItem,
      label: tPilgrimages('dayNumber'),
      sortable: true,
      render: (value: number | null) => value || '-',
    },
    {
      key: 'date' as keyof PilgrimageScheduleItem,
      label: tPilgrimages('date'),
      sortable: true,
      render: (value: string | null) => formatDate(value),
    },
    {
      key: 'time' as keyof PilgrimageScheduleItem,
      label: tPilgrimages('time'),
      sortable: false,
      render: (value: string | null) => formatTime(value),
    },
    {
      key: 'title' as keyof PilgrimageScheduleItem,
      label: tPilgrimages('titleField'),
      sortable: true,
    },
    {
      key: 'activityType' as keyof PilgrimageScheduleItem,
      label: tPilgrimages('activityType'),
      sortable: false,
      render: (value: ActivityType) => (
        <Badge variant="secondary" size="sm">
          {getActivityTypeLabel(value)}
        </Badge>
      ),
    },
    {
      key: 'location' as keyof PilgrimageScheduleItem,
      label: tPilgrimages('location'),
      sortable: false,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'durationMinutes' as keyof PilgrimageScheduleItem,
      label: tPilgrimages('durationMinutes'),
      sortable: false,
      render: (value: number | null) => value ? `${value} min` : '-',
    },
    {
      key: 'isOptional' as keyof PilgrimageScheduleItem,
      label: tPilgrimages('isOptional'),
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'warning' : 'secondary'} size="sm">
          {value ? tPilgrimages('isOptional') : t('required')}
        </Badge>
      ),
    },
    {
      key: 'actions' as keyof PilgrimageScheduleItem,
      label: t('actions'),
      sortable: false,
      render: (_: any, row: PilgrimageScheduleItem) => (
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
            { label: t('delete'), onClick: () => setDeleteConfirm(row.id), variant: 'danger' as const },
          ]}
          align="right"
        />
      ),
    },
  ];

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: tPilgrimages('pilgrimages'), href: `/${locale}/dashboard/pilgrimages` },
    { label: pilgrimage?.title || tPilgrimages('pilgrimage'), href: `/${locale}/dashboard/pilgrimages/${id}` },
    { label: tPilgrimages('schedule') },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={tPilgrimages('schedule') || 'Schedule'}
        action={
          <Button onClick={() => setShowAddModal(true)}>
            {t('add')} {tPilgrimages('activity')}
          </Button>
        }
        className="mb-6"
      />

      {/* Schedule Table */}
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
            <Table
              data={schedule}
              columns={columns}
              emptyMessage={tPilgrimages('noSchedule') || 'No schedule items available'}
            />
          )}
        </CardBody>
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={`${t('add')} ${tPilgrimages('activity')}`}
        size="full"
      >
        <ScheduleActivityForm
          formData={formData}
          setFormData={setFormData}
          onSave={handleCreate}
          onCancel={() => {
            setShowAddModal(false);
            resetForm();
          }}
          loading={loading}
          t={t}
          tPilgrimages={tPilgrimages}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedActivity(null);
        }}
        title={`${t('edit')} ${tPilgrimages('activity')}`}
        size="full"
      >
        <ScheduleActivityForm
          formData={formData}
          setFormData={setFormData}
          onSave={handleUpdate}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedActivity(null);
          }}
          loading={loading}
          t={t}
          tPilgrimages={tPilgrimages}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('confirmDelete')}
      >
        <div className="space-y-4">
          <p>{tPilgrimages('confirmDeleteActivity') || 'Are you sure you want to delete this activity?'}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={loading}>
              {t('cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={loading}
            >
              {loading ? (t('deleting') || 'Deleting...') : t('delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ScheduleActivityForm({
  formData,
  setFormData,
  onSave,
  onCancel,
  loading,
  t,
  tPilgrimages,
}: {
  formData: any;
  setFormData: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  t: any;
  tPilgrimages: any;
}) {
  return (
    <div className="flex flex-col" style={{ height: 'calc(98vh - 80px)' }}>
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{tPilgrimages('titleField')} *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('dayNumber')}</label>
              <Input
                type="number"
                value={formData.dayNumber}
                onChange={(e) => setFormData({ ...formData, dayNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('date')}</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('time')}</label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('activityType')} *</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
                value={formData.activityType}
                onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                required
              >
                <option value="liturgy">{tPilgrimages('activityTypes.liturgy')}</option>
                <option value="prayer">{tPilgrimages('activityTypes.prayer')}</option>
                <option value="visit">{tPilgrimages('activityTypes.visit')}</option>
                <option value="meal">{tPilgrimages('activityTypes.meal')}</option>
                <option value="transport">{tPilgrimages('activityTypes.transport')}</option>
                <option value="accommodation">{tPilgrimages('activityTypes.accommodation')}</option>
                <option value="other">{tPilgrimages('activityTypes.other')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('durationMinutes')}</label>
              <Input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{tPilgrimages('location')}</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{tPilgrimages('description')}</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isOptional"
              checked={formData.isOptional}
              onChange={(e) => setFormData({ ...formData, isOptional: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isOptional" className="text-sm font-medium">
              {tPilgrimages('isOptional')}
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{tPilgrimages('notes')}</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-4 pb-2 border-t border-border flex-shrink-0 bg-bg-primary">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          {t('cancel')}
        </Button>
        <Button onClick={onSave} disabled={loading}>
          {loading ? (t('saving') || 'Saving...') : t('save')}
        </Button>
      </div>
    </div>
  );
}
