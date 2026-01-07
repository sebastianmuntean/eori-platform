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
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { usePilgrimage } from '@/hooks/usePilgrimage';
import { usePilgrimageParticipants, PilgrimageParticipant, ParticipantStatus, PaymentStatus } from '@/hooks/usePilgrimageParticipants';
import { useParishes } from '@/hooks/useParishes';
import { useClients } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { formatDate } from '@/utils/date';
import { ParticipantForm } from '@/components/pilgrimages/ParticipantForm';
import {
  PARTICIPANT_STATUS_VARIANTS,
  PARTICIPANT_PAYMENT_STATUS_VARIANTS,
  transformParticipantFormData,
  getInitialParticipantFormData,
} from '@/lib/utils/pilgrimage-participants';

interface PilgrimageParticipantsPageContentProps {
  locale: string;
  id: string;
}

/**
 * Pilgrimage participants page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function PilgrimageParticipantsPageContent({ locale, id }: PilgrimageParticipantsPageContentProps) {
  const router = useRouter();
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();

  const { pilgrimage, fetchPilgrimage } = usePilgrimage();
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

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ParticipantStatus | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<PilgrimageParticipant | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState(getInitialParticipantFormData());

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

  const resetForm = useCallback(() => {
    setFormData(getInitialParticipantFormData());
  }, []);

  // Transform clients to match ParticipantForm expected type (null -> undefined)
  const transformedClients = useMemo(
    () =>
      clients.map((client) => ({
        id: client.id,
        firstName: client.firstName ?? undefined,
        lastName: client.lastName ?? undefined,
        companyName: client.companyName ?? undefined,
      })),
    [clients]
  );

  const handleCreate = useCallback(async () => {
    if (!formData.firstName) {
      showError(t('fillRequiredFields') || 'Please fill in all required fields');
      return;
    }

    try {
      const result = await addParticipant(id, transformParticipantFormData(formData));
      if (result) {
        setShowAddModal(false);
        resetForm();
        showSuccess(tPilgrimages('participantCreated') || 'Participant created successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errorOccurred') || 'An error occurred';
      showError(errorMessage);
    }
  }, [formData, id, addParticipant, resetForm, t, tPilgrimages, showError, showSuccess]);

  const handleUpdate = useCallback(async () => {
    if (!selectedParticipant) return;

    if (!formData.firstName) {
      showError(t('fillRequiredFields') || 'Please fill in all required fields');
      return;
    }

    try {
      const result = await updateParticipant(id, selectedParticipant.id, transformParticipantFormData(formData));
      if (result) {
        setShowEditModal(false);
        setSelectedParticipant(null);
        showSuccess(tPilgrimages('participantUpdated') || 'Participant updated successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errorOccurred') || 'An error occurred';
      showError(errorMessage);
    }
  }, [selectedParticipant, formData, id, updateParticipant, t, tPilgrimages, showError, showSuccess]);

  const handleDelete = useCallback(
    async (participantId: string) => {
      try {
        const result = await deleteParticipant(id, participantId);
        if (result) {
          setDeleteConfirm(null);
          showSuccess(tPilgrimages('participantDeleted') || 'Participant deleted successfully');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('errorOccurred') || 'An error occurred';
        showError(errorMessage);
      }
    },
    [id, deleteParticipant, t, tPilgrimages, showError, showSuccess]
  );

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

  const formatDateLocalized = useCallback(
    (date: string | null) => formatDate(date, locale),
    [locale]
  );

  const getStatusLabel = useCallback(
    (status: ParticipantStatus) => {
      const statusMap: Record<ParticipantStatus, string> = {
        registered: tPilgrimages('participantStatuses.registered'),
        confirmed: tPilgrimages('participantStatuses.confirmed'),
        paid: tPilgrimages('participantStatuses.paid'),
        cancelled: tPilgrimages('participantStatuses.cancelled'),
        waitlisted: tPilgrimages('participantStatuses.waitlisted'),
      };
      return statusMap[status] || status;
    },
    [tPilgrimages]
  );

  const getPaymentStatusLabel = useCallback(
    (status: PaymentStatus) => {
      const statusMap: Record<PaymentStatus, string> = {
        pending: tPilgrimages('participantPaymentStatuses.pending'),
        partial: tPilgrimages('participantPaymentStatuses.partial'),
        paid: tPilgrimages('participantPaymentStatuses.paid'),
        refunded: tPilgrimages('participantPaymentStatuses.refunded'),
      };
      return statusMap[status] || status;
    },
    [tPilgrimages]
  );

  const columns = useMemo(
    () => [
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
      render: (value: ParticipantStatus) => (
        <Badge variant={PARTICIPANT_STATUS_VARIANTS[value] || 'secondary'} size="sm">
          {getStatusLabel(value)}
        </Badge>
      ),
    },
    {
      key: 'paymentStatus' as keyof PilgrimageParticipant,
      label: tPilgrimages('paymentStatus'),
      sortable: false,
      render: (value: PaymentStatus) => (
        <Badge variant={PARTICIPANT_PAYMENT_STATUS_VARIANTS[value] || 'secondary'} size="sm">
          {getPaymentStatusLabel(value)}
        </Badge>
      ),
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
    ],
    [
      tPilgrimages,
      getStatusLabel,
      getPaymentStatusLabel,
      pilgrimage?.currency,
      handleEdit,
      confirmParticipant,
      cancelParticipant,
      id,
      t,
    ]
  );

  const breadcrumbs = useMemo(
    () => [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: tPilgrimages('pilgrimages'), href: `/${locale}/dashboard/pilgrimages` },
      { label: pilgrimage?.title || tPilgrimages('pilgrimage'), href: `/${locale}/dashboard/pilgrimages/${id}` },
      { label: tPilgrimages('participants') },
    ],
    [t, tPilgrimages, locale, pilgrimage?.title, id]
  );

  return (
    <PageContainer>
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
          clients={transformedClients}
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
          clients={transformedClients}
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

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </PageContainer>
  );
}

