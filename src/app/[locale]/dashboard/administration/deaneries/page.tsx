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
import { FormModal } from '@/components/accounting/FormModal';
import { useDeaneries, Deanery } from '@/hooks/useDeaneries';
import { useDioceses } from '@/hooks/useDioceses';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';

export default function DeaneriesPage() {
  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.DEANERIES_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('deaneries'));

  const {
    deaneries,
    loading,
    error,
    pagination,
    fetchDeaneries,
    createDeanery,
    updateDeanery,
    deleteDeanery,
  } = useDeaneries();

  const { dioceses, fetchDioceses } = useDioceses();

  const [searchTerm, setSearchTerm] = useState('');
  const [dioceseFilter, setDioceseFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDeanery, setSelectedDeanery] = useState<Deanery | null>(null);
  const [formData, setFormData] = useState({
    dioceseId: '',
    code: '',
    name: '',
    address: '',
    city: '',
    county: '',
    deanName: '',
    phone: '',
    email: '',
    isActive: true,
  });

  useEffect(() => {
    fetchDioceses({ all: true });
  }, [fetchDioceses]);

  useEffect(() => {
    fetchDeaneries({
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      dioceseId: dioceseFilter || undefined,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  }, [currentPage, searchTerm, dioceseFilter, fetchDeaneries]);

  const handleCreate = async () => {
    const result = await createDeanery(formData);
    if (result) {
      setShowAddModal(false);
      setFormData({
        dioceseId: '',
        code: '',
        name: '',
        address: '',
        city: '',
        county: '',
        deanName: '',
        phone: '',
        email: '',
        isActive: true,
      });
    }
  };

  const handleUpdate = async () => {
    if (selectedDeanery) {
      const result = await updateDeanery(selectedDeanery.id, formData);
      if (result) {
        setShowEditModal(false);
        setSelectedDeanery(null);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this deanery?')) {
      await deleteDeanery(id);
    }
  };

  const handleEdit = (deanery: Deanery) => {
    setSelectedDeanery(deanery);
    setFormData({
      dioceseId: deanery.dioceseId,
      code: deanery.code,
      name: deanery.name,
      address: deanery.address || '',
      city: deanery.city || '',
      county: deanery.county || '',
      deanName: deanery.deanName || '',
      phone: deanery.phone || '',
      email: deanery.email || '',
      isActive: deanery.isActive,
    });
    setShowEditModal(true);
  };

  const columns = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'city', label: 'City', sortable: true },
    { key: 'county', label: 'County', sortable: true },
    {
      key: 'isActive',
      label: 'Status',
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, row: Deanery) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          }
          items={[
            { label: 'Edit', onClick: () => handleEdit(row) },
            { label: 'Delete', onClick: () => handleDelete(row.id), variant: 'danger' },
          ]}
          align="right"
        />
      ),
    },
  ];

  if (permissionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('administration'), href: `/${locale}/dashboard/administration` },
    { label: 'Deaneries' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('protopopiate')}</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)}>{t('add')} {t('protopopiate')}</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search deaneries..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-md"
            />
            <select
              value={dioceseFilter}
              onChange={(e) => {
                setDioceseFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border rounded"
            >
              <option value="">All Dioceses</option>
              {dioceses.map((diocese) => (
                <option key={diocese.id} value={diocese.id}>
                  {diocese.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardBody>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <Table
                data={deaneries}
                columns={columns}
                loading={loading}
              />
              {pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div>
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <FormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCancel={() => setShowAddModal(false)}
        title="Add Deanery"
        onSubmit={handleCreate}
        isSubmitting={false}
        submitLabel="Create"
        cancelLabel="Cancel"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Diocese *</label>
            <select
              value={formData.dioceseId}
              onChange={(e) => setFormData({ ...formData, dioceseId: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Select Diocese</option>
              {dioceses.map((diocese) => (
                <option key={diocese.id} value={diocese.id}>
                  {diocese.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <Input
            label="County"
            value={formData.county}
            onChange={(e) => setFormData({ ...formData, county: e.target.value })}
          />
          <Input
            label="Dean Name"
            value={formData.deanName}
            onChange={(e) => setFormData({ ...formData, deanName: e.target.value })}
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </FormModal>

      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onCancel={() => setShowEditModal(false)}
        title="Edit Deanery"
        onSubmit={handleUpdate}
        isSubmitting={false}
        submitLabel="Update"
        cancelLabel="Cancel"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Diocese *</label>
            <select
              value={formData.dioceseId}
              onChange={(e) => setFormData({ ...formData, dioceseId: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Select Diocese</option>
              {dioceses.map((diocese) => (
                <option key={diocese.id} value={diocese.id}>
                  {diocese.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <Input
            label="County"
            value={formData.county}
            onChange={(e) => setFormData({ ...formData, county: e.target.value })}
          />
          <Input
            label="Dean Name"
            value={formData.deanName}
            onChange={(e) => setFormData({ ...formData, deanName: e.target.value })}
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </FormModal>
    </div>
  );
}

