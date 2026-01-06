'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { usePilgrimage } from '@/hooks/usePilgrimage';
import { usePilgrimagePayments, PilgrimagePayment, PaymentMethod, PaymentStatus } from '@/hooks/usePilgrimagePayments';
import { usePilgrimageParticipants } from '@/hooks/usePilgrimageParticipants';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PILGRIMAGES_PERMISSIONS } from '@/lib/permissions/pilgrimages';

export default function PilgrimagePaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');
  
  // Check permission to view pilgrimages
  const { loading: permissionLoading } = useRequirePermission(PILGRIMAGES_PERMISSIONS.VIEW);

  const { pilgrimage, fetchPilgrimage } = usePilgrimage();
  usePageTitle(pilgrimage?.title ? `${tPilgrimages('payments')} - ${pilgrimage.title}` : tPilgrimages('payments'));
  const {
    payments,
    summary,
    loading,
    error,
    fetchPayments,
    addPayment,
    updatePayment,
    deletePayment,
    getPaymentSummary,
  } = usePilgrimagePayments();
  const { participants, fetchParticipants } = usePilgrimageParticipants();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PilgrimagePayment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    participantId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash' as PaymentMethod,
    paymentReference: '',
    status: 'pending' as PaymentStatus,
    notes: '',
  });

  useEffect(() => {
    if (permissionLoading) return;
    if (id) {
      fetchPilgrimage(id);
      fetchPayments(id, {});
      fetchParticipants(id, {});
      getPaymentSummary(id);
    }
  }, [permissionLoading, id, fetchPilgrimage, fetchPayments, fetchParticipants, getPaymentSummary]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const handleCreate = async () => {
    if (!formData.participantId || !formData.amount || !formData.paymentDate) {
      alert(t('fillRequiredFields'));
      return;
    }

    const result = await addPayment(id, {
      ...formData,
      amount: formData.amount,
      paymentReference: formData.paymentReference || null,
      notes: formData.notes || null,
    });

    if (result) {
      setShowAddModal(false);
      resetForm();
      getPaymentSummary(id);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPayment) return;

    const result = await updatePayment(id, selectedPayment.id, {
      ...formData,
      amount: formData.amount,
      paymentReference: formData.paymentReference || null,
      notes: formData.notes || null,
    });

    if (result) {
      setShowEditModal(false);
      setSelectedPayment(null);
      getPaymentSummary(id);
    }
  };

  const handleDelete = async (paymentId: string) => {
    const result = await deletePayment(id, paymentId);
    if (result) {
      setDeleteConfirm(null);
      getPaymentSummary(id);
    }
  };

  const handleEdit = (payment: PilgrimagePayment) => {
    setSelectedPayment(payment);
    setFormData({
      participantId: payment.participantId,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.paymentReference || '',
      status: payment.status,
      notes: payment.notes || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      participantId: '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      paymentReference: '',
      status: 'pending',
      notes: '',
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  };

  const formatAmount = (amount: string) => {
    return `${amount} ${pilgrimage?.currency || 'RON'}`;
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    return tPilgrimages(`paymentMethods.${method}` as any) || method;
  };

  const getPaymentStatusLabel = (status: PaymentStatus) => {
    return tPilgrimages(`paymentStatuses.${status}` as any) || status;
  };

  const getParticipantName = (participantId: string) => {
    const participant = participants.find((p) => p.id === participantId);
    return participant ? `${participant.firstName} ${participant.lastName || ''}`.trim() : participantId;
  };

  const columns = [
    {
      key: 'participantId' as keyof PilgrimagePayment,
      label: tPilgrimages('participant'),
      sortable: false,
      render: (value: string) => getParticipantName(value),
    },
    {
      key: 'amount' as keyof PilgrimagePayment,
      label: tPilgrimages('amount'),
      sortable: true,
      render: (value: string) => formatAmount(value),
    },
    {
      key: 'paymentDate' as keyof PilgrimagePayment,
      label: tPilgrimages('paymentDate'),
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'paymentMethod' as keyof PilgrimagePayment,
      label: tPilgrimages('paymentMethod'),
      sortable: false,
      render: (value: PaymentMethod) => (
        <Badge variant="secondary" size="sm">
          {getPaymentMethodLabel(value)}
        </Badge>
      ),
    },
    {
      key: 'status' as keyof PilgrimagePayment,
      label: tPilgrimages('paymentStatus'),
      sortable: false,
      render: (value: PaymentStatus) => {
        const variantMap: Record<PaymentStatus, 'warning' | 'success' | 'danger' | 'secondary'> = {
          pending: 'secondary',
          completed: 'success',
          failed: 'danger',
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
      key: 'paymentReference' as keyof PilgrimagePayment,
      label: tPilgrimages('paymentReference'),
      sortable: false,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'actions' as keyof PilgrimagePayment,
      label: t('actions'),
      sortable: false,
      render: (_: any, row: PilgrimagePayment) => (
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
    { label: tPilgrimages('payments') },
  ];

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={tPilgrimages('payments') || 'Payments'}
        action={
          <Button onClick={() => setShowAddModal(true)}>
            {tPilgrimages('addPayment')}
          </Button>
        }
      />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card variant="elevated">
            <CardBody>
              <div className="text-sm text-text-secondary">{t('total')}</div>
              <div className="text-2xl font-bold text-text-primary">
                {summary.payments?.totalAmount || 0} {pilgrimage?.currency || 'RON'}
              </div>
            </CardBody>
          </Card>
          <Card variant="elevated">
            <CardBody>
              <div className="text-sm text-text-secondary">{tPilgrimages('paymentStatuses.completed')}</div>
              <div className="text-2xl font-bold text-text-primary">{summary.payments?.totalPayments || 0}</div>
            </CardBody>
          </Card>
          <Card variant="elevated">
            <CardBody>
              <div className="text-sm text-text-secondary">{tPilgrimages('revenue.total')}</div>
              <div className="text-2xl font-bold text-text-primary">
                {summary.revenue?.total || 0} {pilgrimage?.currency || 'RON'}
              </div>
            </CardBody>
          </Card>
          <Card variant="elevated">
            <CardBody>
              <div className="text-sm text-text-secondary">{tPilgrimages('revenue.outstanding')}</div>
              <div className="text-2xl font-bold text-text-primary">
                {summary.revenue?.outstanding || 0} {pilgrimage?.currency || 'RON'}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Payments Table */}
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
              data={payments}
              columns={columns}
              emptyMessage={tPilgrimages('noPayments') || 'No payments available'}
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
        title={tPilgrimages('addPayment')}
      >
        <PaymentForm
          formData={formData}
          setFormData={setFormData}
          participants={participants}
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
          setSelectedPayment(null);
        }}
        title={tPilgrimages('editPayment')}
      >
        <PaymentForm
          formData={formData}
          setFormData={setFormData}
          participants={participants}
          onSave={handleUpdate}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedPayment(null);
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
          <p>{tPilgrimages('confirmDeletePayment') || 'Are you sure you want to delete this payment?'}</p>
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
    </PageContainer>
  );
}

function PaymentForm({
  formData,
  setFormData,
  participants,
  onSave,
  onCancel,
  loading,
  t,
  tPilgrimages,
}: {
  formData: any;
  setFormData: (data: any) => void;
  participants: any[];
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  t: any;
  tPilgrimages: any;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{tPilgrimages('participant')} *</label>
        <select
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
          value={formData.participantId}
          onChange={(e) => setFormData({ ...formData, participantId: e.target.value })}
          required
        >
          <option value="">{t('selectParticipant') || 'Select Participant'}</option>
          {participants.map((participant) => (
            <option key={participant.id} value={participant.id}>
              {participant.firstName} {participant.lastName || ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{tPilgrimages('amount')} *</label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{tPilgrimages('paymentDate')} *</label>
          <Input
            type="date"
            value={formData.paymentDate}
            onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{tPilgrimages('paymentMethod')} *</label>
          <select
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            required
          >
            <option value="cash">{tPilgrimages('paymentMethods.cash')}</option>
            <option value="card">{tPilgrimages('paymentMethods.card')}</option>
            <option value="bank_transfer">{tPilgrimages('paymentMethods.bank_transfer')}</option>
            <option value="other">{tPilgrimages('paymentMethods.other')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{tPilgrimages('paymentStatus')}</label>
          <select
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="pending">{tPilgrimages('paymentStatuses.pending')}</option>
            <option value="completed">{tPilgrimages('paymentStatuses.completed')}</option>
            <option value="failed">{tPilgrimages('paymentStatuses.failed')}</option>
            <option value="refunded">{tPilgrimages('paymentStatuses.refunded')}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{tPilgrimages('paymentReference')}</label>
        <Input
          value={formData.paymentReference}
          onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
        />
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

      <div className="flex justify-end gap-2 pt-4 border-t border-border">
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
