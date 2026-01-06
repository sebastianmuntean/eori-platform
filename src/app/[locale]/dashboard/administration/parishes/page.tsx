'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { useParishes, Parish } from '@/hooks/useParishes';
import { useDioceses } from '@/hooks/useDioceses';
import { useDeaneries } from '@/hooks/useDeaneries';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';
import { TablePagination } from '@/components/ui/TablePagination';

export default function ParishesPage() {
  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.PARISHES_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('parishes'));

  const {
    parishes,
    loading,
    error,
    pagination,
    fetchParishes,
    createParish,
    updateParish,
    deleteParish,
  } = useParishes();

  const { dioceses, fetchDioceses } = useDioceses();
  const { deaneries, fetchDeaneries } = useDeaneries();

  const [searchTerm, setSearchTerm] = useState('');
  const [dioceseFilter, setDioceseFilter] = useState('');
  const [deaneryFilter, setDeaneryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedParish, setSelectedParish] = useState<Parish | null>(null);
  const [formData, setFormData] = useState({
    deaneryId: '',
    dioceseId: '',
    code: '',
    name: '',
    patronSaintDay: '',
    address: '',
    city: '',
    county: '',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    priestName: '',
    vicarName: '',
    parishionerCount: '',
    foundedYear: '',
    notes: '',
    isActive: true,
  });

  useEffect(() => {
    fetchDioceses({ all: true });
  }, [fetchDioceses]);

  useEffect(() => {
    if (formData.dioceseId) {
      fetchDeaneries({ dioceseId: formData.dioceseId, all: true });
    }
  }, [formData.dioceseId, fetchDeaneries]);

  useEffect(() => {
    fetchParishes({
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      dioceseId: dioceseFilter || undefined,
      deaneryId: deaneryFilter || undefined,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  }, [currentPage, searchTerm, dioceseFilter, deaneryFilter, fetchParishes]);

  const handleCreate = async () => {
    const result = await createParish({
      ...formData,
      deaneryId: formData.deaneryId || null,
      parishionerCount: formData.parishionerCount ? parseInt(formData.parishionerCount) : null,
      foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : null,
      patronSaintDay: formData.patronSaintDay || null,
    });
    if (result) {
      setShowAddModal(false);
      setFormData({
        deaneryId: '',
        dioceseId: '',
        code: '',
        name: '',
        patronSaintDay: '',
        address: '',
        city: '',
        county: '',
        postalCode: '',
        phone: '',
        email: '',
        website: '',
        priestName: '',
        vicarName: '',
        parishionerCount: '',
        foundedYear: '',
        notes: '',
        isActive: true,
      });
    }
  };

  const handleUpdate = async () => {
    if (selectedParish) {
      const result = await updateParish(selectedParish.id, {
        ...formData,
        deaneryId: formData.deaneryId || null,
        parishionerCount: formData.parishionerCount ? parseInt(formData.parishionerCount) : null,
        foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : null,
        patronSaintDay: formData.patronSaintDay || null,
      });
      if (result) {
        setShowEditModal(false);
        setSelectedParish(null);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this parish?')) {
      await deleteParish(id);
    }
  };

  const handleEdit = (parish: Parish) => {
    setSelectedParish(parish);
    setFormData({
      deaneryId: parish.deaneryId || '',
      dioceseId: parish.dioceseId,
      code: parish.code,
      name: parish.name,
      patronSaintDay: parish.patronSaintDay || '',
      address: parish.address || '',
      city: parish.city || '',
      county: parish.county || '',
      postalCode: parish.postalCode || '',
      phone: parish.phone || '',
      email: parish.email || '',
      website: parish.website || '',
      priestName: parish.priestName || '',
      vicarName: parish.vicarName || '',
      parishionerCount: parish.parishionerCount?.toString() || '',
      foundedYear: parish.foundedYear?.toString() || '',
      notes: parish.notes || '',
      isActive: parish.isActive,
    });
    setShowEditModal(true);
  };

  const columns = [
    { key: 'code' as keyof Parish, label: 'Code', sortable: true },
    { key: 'name' as keyof Parish, label: 'Name', sortable: true },
    { key: 'city' as keyof Parish, label: 'City', sortable: true },
    { key: 'county' as keyof Parish, label: 'County', sortable: true },
    {
      key: 'isActive' as keyof Parish,
      label: 'Status',
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions' as keyof Parish,
      label: 'Actions',
      sortable: false,
      render: (_: any, row: Parish) => (
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

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('administration'), href: `/${locale}/dashboard/administration` },
          { label: t('parohii') || 'Parishes' },
        ]}
        title={t('parohii') || 'Parishes'}
        action={<Button onClick={() => setShowAddModal(true)}>{t('add')} {t('parohii')}</Button>}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Input
              placeholder={t('search') + '...'}
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
            <select
              value={deaneryFilter}
              onChange={(e) => {
                setDeaneryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border rounded"
            >
              <option value="">All Deaneries</option>
              {deaneries.map((deanery) => (
                <option key={deanery.id} value={deanery.id}>
                  {deanery.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardBody>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div className="text-center py-8 text-text-secondary">{t('loading') || 'Loading...'}</div>
          ) : (
            <>
              <Table
                data={parishes}
                columns={columns}
                emptyMessage={t('noData') || 'No parishes available'}
              />
              {pagination && pagination.totalPages > 1 && (
                <TablePagination
                  pagination={pagination}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  loading={loading}
                  t={t}
                />
              )}
            </>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`${t('add')} ${t('parohii')}`}
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1">Diocese *</label>
            <select
              value={formData.dioceseId}
              onChange={(e) => setFormData({ ...formData, dioceseId: e.target.value, deaneryId: '' })}
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
          <div>
            <label className="block text-sm font-medium mb-1">Deanery</label>
            <select
              value={formData.deaneryId}
              onChange={(e) => setFormData({ ...formData, deaneryId: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              disabled={!formData.dioceseId}
            >
              <option value="">Select Deanery</option>
              {deaneries
                .filter((d) => d.dioceseId === formData.dioceseId)
                .map((deanery) => (
                  <option key={deanery.id} value={deanery.id}>
                    {deanery.name}
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
            label="Patron Saint Day"
            type="date"
            value={formData.patronSaintDay}
            onChange={(e) => setFormData({ ...formData, patronSaintDay: e.target.value })}
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
            label="Postal Code"
            value={formData.postalCode}
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
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
          <Input
            label="Website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
          <Input
            label="Priest Name"
            value={formData.priestName}
            onChange={(e) => setFormData({ ...formData, priestName: e.target.value })}
          />
          <Input
            label="Vicar Name"
            value={formData.vicarName}
            onChange={(e) => setFormData({ ...formData, vicarName: e.target.value })}
          />
          <Input
            label="Parishioner Count"
            type="number"
            value={formData.parishionerCount}
            onChange={(e) => setFormData({ ...formData, parishionerCount: e.target.value })}
          />
          <Input
            label="Founded Year"
            type="number"
            value={formData.foundedYear}
            onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCreate}>{t('create')}</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`${t('edit')} ${t('parohii')}`}
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1">Diocese *</label>
            <select
              value={formData.dioceseId}
              onChange={(e) => setFormData({ ...formData, dioceseId: e.target.value, deaneryId: '' })}
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
          <div>
            <label className="block text-sm font-medium mb-1">Deanery</label>
            <select
              value={formData.deaneryId}
              onChange={(e) => setFormData({ ...formData, deaneryId: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              disabled={!formData.dioceseId}
            >
              <option value="">Select Deanery</option>
              {deaneries
                .filter((d) => d.dioceseId === formData.dioceseId)
                .map((deanery) => (
                  <option key={deanery.id} value={deanery.id}>
                    {deanery.name}
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
            label="Patron Saint Day"
            type="date"
            value={formData.patronSaintDay}
            onChange={(e) => setFormData({ ...formData, patronSaintDay: e.target.value })}
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
            label="Postal Code"
            value={formData.postalCode}
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
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
          <Input
            label="Website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
          <Input
            label="Priest Name"
            value={formData.priestName}
            onChange={(e) => setFormData({ ...formData, priestName: e.target.value })}
          />
          <Input
            label="Vicar Name"
            value={formData.vicarName}
            onChange={(e) => setFormData({ ...formData, vicarName: e.target.value })}
          />
          <Input
            label="Parishioner Count"
            type="number"
            value={formData.parishionerCount}
            onChange={(e) => setFormData({ ...formData, parishionerCount: e.target.value })}
          />
          <Input
            label="Founded Year"
            type="number"
            value={formData.foundedYear}
            onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleUpdate}>{t('update')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

