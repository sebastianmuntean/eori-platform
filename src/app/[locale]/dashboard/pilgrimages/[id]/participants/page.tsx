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
import { usePilgrimageParticipants, PilgrimageParticipant, ParticipantStatus, PaymentStatus } from '@/hooks/usePilgrimageParticipants';
import { useParishes } from '@/hooks/useParishes';
import { useClients } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PILGRIMAGES_PERMISSIONS } from '@/lib/permissions/pilgrimages';

export default function PilgrimageParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');
  
  // Check permission to view pilgrimages
  const { loading: permissionLoading } = useRequirePermission(PILGRIMAGES_PERMISSIONS.VIEW);

  const { pilgrimage, fetchPilgrimage } = usePilgrimage();
  usePageTitle(pilgrimage?.title ? `${tPilgrimages('participants')} - ${pilgrimage.title}` : tPilgrimages('participants'));
  const {
    participants,
    loading,
    error,
    fetchParticipants,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    confirmParticipant,
    cancelParticipant,
    exportParticipants,
  } = usePilgrimageParticipants();
  const { parishes, fetchParishes } = useParishes();
  const { clients, fetchClients } = useClients();

  // Don't render content while checking permissions
  if (permissionLoading) {
    return null;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ParticipantStatus | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<PilgrimageParticipant | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    parishionerId: '',
    firstName: '',
    lastName: '',
    cnp: '',
    birthDate: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    county: '',
    postalCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    specialNeeds: '',
    status: 'registered' as ParticipantStatus,
    totalAmount: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchPilgrimage(id);
      fetchParticipants(id, {});
    }
  }, [id, fetchPilgrimage, fetchParticipants]);

  useEffect(() => {
    fetchParishes({ all: true });
    fetchClients({ all: true });
  }, [fetchParishes, fetchClients]);

  useEffect(() => {
    fetchParticipants(id, {
      search: searchTerm || undefined,
      status: statusFilter || undefined,
    });
  }, [id, searchTerm, statusFilter, fetchParticipants]);

  const handleCreate = async () => {
    if (!formData.firstName) {
      // Validation error will be shown via form validation
      // The Input component will display error state
      return;
    }

    const result = await addParticipant(id, {
      ...formData,
      parishionerId: formData.parishionerId || null,
      lastName: formData.lastName || null,
      cnp: formData.cnp || null,
      birthDate: formData.birthDate || null,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
      city: formData.city || null,
      county: formData.county || null,
      postalCode: formData.postalCode || null,
      emergencyContactName: formData.emergencyContactName || null,
      emergencyContactPhone: formData.emergencyContactPhone || null,
      specialNeeds: formData.specialNeeds || null,
      totalAmount: formData.totalAmount || null,
      notes: formData.notes || null,
    });

    if (result) {
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!selectedParticipant) return;

    const result = await updateParticipant(id, selectedParticipant.id, {
      ...formData,
      parishionerId: formData.parishionerId || null,
      lastName: formData.lastName || null,
      cnp: formData.cnp || null,
      birthDate: formData.birthDate || null,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
      city: formData.city || null,
      county: formData.county || null,
      postalCode: formData.postalCode || null,
      emergencyContactName: formData.emergencyContactName || null,
      emergencyContactPhone: formData.emergencyContactPhone || null,
      specialNeeds: formData.specialNeeds || null,
      totalAmount: formData.totalAmount || null,
      notes: formData.notes || null,
    });

    if (result) {
      setShowEditModal(false);
      setSelectedParticipant(null);
    }
  };

  const handleDelete = async (participantId: string) => {
    const result = await deleteParticipant(id, participantId);
    if (result) {
      setDeleteConfirm(null);
    }
  };

  const handleEdit = (participant: PilgrimageParticipant) => {
    setSelectedParticipant(participant);
    setFormData({
      parishionerId: participant.parishionerId || '',
      firstName: participant.firstName,
      lastName: participant.lastName || '',
      cnp: participant.cnp || '',
      birthDate: participant.birthDate || '',
      phone: participant.phone || '',
      email: participant.email || '',
      address: participant.address || '',
      city: participant.city || '',
      county: participant.county || '',
      postalCode: participant.postalCode || '',
      emergencyContactName: participant.emergencyContactName || '',
      emergencyContactPhone: participant.emergencyContactPhone || '',
      specialNeeds: participant.specialNeeds || '',
      status: participant.status,
      totalAmount: participant.totalAmount || '',
      notes: participant.notes || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      parishionerId: '',
      firstName: '',
      lastName: '',
      cnp: '',
      birthDate: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      county: '',
      postalCode: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      specialNeeds: '',
      status: 'registered',
      totalAmount: '',
      notes: '',
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  };

  const getStatusLabel = (status: ParticipantStatus) => {
    return tPilgrimages(`participantStatuses.${status}` as any) || status;
  };

  const getPaymentStatusLabel = (status: PaymentStatus) => {
    return tPilgrimages(`participantPaymentStatuses.${status}` as any) || status;
  };

  const columns = [
    {
      key: 'firstName' as keyof PilgrimageParticipant,
      label: tPilgrimages('firstName'),
      sortable: true,
      render: (_: any, row: PilgrimageParticipant) => (
        <div>
          <div className="font-medium">{row.firstName} {row.lastName || ''}</div>
          {row.email && <div className="text-sm text-text-secondary">{row.email}</div>}
        </div>
      ),
    },
    {
      key: 'phone' as keyof PilgrimageParticipant,
      label: tPilgrimages('phone'),
      sortable: false,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'status' as keyof PilgrimageParticipant,
      label: tPilgrimages('participantStatus'),
      sortable: false,
      render: (value: ParticipantStatus) => {
        const variantMap: Record<ParticipantStatus, 'warning' | 'success' | 'danger' | 'secondary' | 'primary'> = {
          registered: 'secondary',
          confirmed: 'primary',
          paid: 'success',
          cancelled: 'danger',
          waitlisted: 'warning',
        };
        return (
          <Badge variant={variantMap[value] || 'secondary'} size="sm">
            {getStatusLabel(value)}
          </Badge>
        );
      },
    },
    {
      key: 'paymentStatus' as keyof PilgrimageParticipant,
      label: tPilgrimages('paymentStatus'),
      sortable: false,
      render: (value: PaymentStatus) => {
        const variantMap: Record<PaymentStatus, 'warning' | 'success' | 'danger' | 'secondary'> = {
          pending: 'secondary',
          partial: 'warning',
          paid: 'success',
          refunded: 'danger',
        };
        return (
          <Badge variant={variantMap[value] || 'secondary'} size="sm">
            {getPaymentStatusLabel(value)}
          </Badge>
        );
      },
    },
    {
      key: 'totalAmount' as keyof PilgrimageParticipant,
      label: tPilgrimages('totalAmount'),
      sortable: false,
      render: (_: any, row: PilgrimageParticipant) => (
        <div>
          <div>{row.totalAmount ? `${row.totalAmount} ${pilgrimage?.currency || 'RON'}` : '-'}</div>
          {row.paidAmount && parseFloat(row.paidAmount) > 0 && (
            <div className="text-sm text-text-secondary">
              {tPilgrimages('paidAmount')}: {row.paidAmount} {pilgrimage?.currency || 'RON'}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions' as keyof PilgrimageParticipant,
      label: t('actions'),
      sortable: false,
      render: (_: any, row: PilgrimageParticipant) => (
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
            ...(row.status === 'registered' ? [{ label: tPilgrimages('confirmParticipant'), onClick: () => confirmParticipant(id, row.id) }] : []),
            ...(row.status !== 'cancelled' ? [{ label: tPilgrimages('cancelParticipant'), onClick: () => cancelParticipant(id, row.id), variant: 'danger' as const }] : []),
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
    { label: tPilgrimages('participants') },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={tPilgrimages('participants') || 'Participants'}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportParticipants(id)}>
              {tPilgrimages('exportParticipants')}
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              {t('add')} {tPilgrimages('participant')}
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card variant="outlined" className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ParticipantStatus | '')}
            >
              <option value="">{t('allStatuses')}</option>
              <option value="registered">{tPilgrimages('participantStatuses.registered')}</option>
              <option value="confirmed">{tPilgrimages('participantStatuses.confirmed')}</option>
              <option value="paid">{tPilgrimages('participantStatuses.paid')}</option>
              <option value="cancelled">{tPilgrimages('participantStatuses.cancelled')}</option>
              <option value="waitlisted">{tPilgrimages('participantStatuses.waitlisted')}</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Participants Table */}
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
              data={participants}
              columns={columns}
              emptyMessage={tPilgrimages('noParticipants') || 'No participants available'}
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
        title={`${t('add')} ${tPilgrimages('participant')}`}
        size="full"
      >
        <ParticipantForm
          formData={formData}
          setFormData={setFormData}
          clients={clients}
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
          setSelectedParticipant(null);
        }}
        title={`${t('edit')} ${tPilgrimages('participant')}`}
        size="full"
      >
        <ParticipantForm
          formData={formData}
          setFormData={setFormData}
          clients={clients}
          onSave={handleUpdate}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedParticipant(null);
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
          <p>{tPilgrimages('confirmDeleteParticipant')}</p>
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

function ParticipantForm({
  formData,
  setFormData,
  clients,
  onSave,
  onCancel,
  loading,
  t,
  tPilgrimages,
}: {
  formData: any;
  setFormData: (data: any) => void;
  clients: any[];
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
            <label className="block text-sm font-medium mb-1">{tPilgrimages('participant')} ({t('optional')})</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={formData.parishionerId}
              onChange={(e) => setFormData({ ...formData, parishionerId: e.target.value })}
            >
              <option value="">{t('selectClient') || 'Select Client'}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName} {client.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('firstName')} *</label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('lastName')}</label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('cnp')}</label>
              <Input
                value={formData.cnp}
                onChange={(e) => setFormData({ ...formData, cnp: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('birthDate')}</label>
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('phone')}</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('email')}</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{tPilgrimages('address')}</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('city')}</label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('county')}</label>
              <Input
                value={formData.county}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('postalCode')}</label>
              <Input
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('emergencyContactName')}</label>
              <Input
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('emergencyContactPhone')}</label>
              <Input
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{tPilgrimages('specialNeeds')}</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={3}
              value={formData.specialNeeds}
              onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('participantStatus')}</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="registered">{tPilgrimages('participantStatuses.registered')}</option>
                <option value="confirmed">{tPilgrimages('participantStatuses.confirmed')}</option>
                <option value="paid">{tPilgrimages('participantStatuses.paid')}</option>
                <option value="cancelled">{tPilgrimages('participantStatuses.cancelled')}</option>
                <option value="waitlisted">{tPilgrimages('participantStatuses.waitlisted')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{tPilgrimages('totalAmount')}</label>
              <Input
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
              />
            </div>
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
