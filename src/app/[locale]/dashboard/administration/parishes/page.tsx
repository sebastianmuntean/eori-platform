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
import { useParishes, Parish } from '@/hooks/useParishes';
import { useDioceses } from '@/hooks/useDioceses';
import { useDeaneries } from '@/hooks/useDeaneries';
import { useTranslations } from 'next-intl';

export default function ParishesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');

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

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('administration'), href: `/${locale}/dashboard/administration` },
    { label: 'Parishes' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('parohii')}</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)}>{t('add')} {t('parohii')}</Button>
      </div>

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
            <div>{t('loading')}</div>
          ) : (
            <>
              <Table
                data={parishes}
                columns={columns}
                loading={loading}
              />
              {pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div>
                    {t('page')} {pagination.page} {t('of')} {pagination.totalPages} ({pagination.total} {t('total')})
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      {t('previous')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage === pagination.totalPages}
                    >
                      {t('next')}
                    </Button>
                  </div>
                </div>
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

