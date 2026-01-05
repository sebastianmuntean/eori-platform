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
import { useDioceses, Diocese } from '@/hooks/useDioceses';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';

export default function DiocesesPage() {
  const { loading: permissionLoading } = useRequirePermission(ADMINISTRATION_PERMISSIONS.DIOCESES_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('dioceses'));

  const {
    dioceses,
    loading,
    error,
    pagination,
    fetchDioceses,
    createDiocese,
    updateDiocese,
    deleteDiocese,
  } = useDioceses();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDiocese, setSelectedDiocese] = useState<Diocese | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    county: '',
    country: 'România',
    phone: '',
    email: '',
    website: '',
    bishopName: '',
    isActive: true,
  });

  useEffect(() => {
    fetchDioceses({
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  }, [currentPage, searchTerm, fetchDioceses]);

  const handleCreate = async () => {
    const result = await createDiocese(formData);
    if (result) {
      setShowAddModal(false);
      setFormData({
        code: '',
        name: '',
        address: '',
        city: '',
        county: '',
        country: 'România',
        phone: '',
        email: '',
        website: '',
        bishopName: '',
        isActive: true,
      });
    }
  };

  const handleUpdate = async () => {
    if (selectedDiocese) {
      const result = await updateDiocese(selectedDiocese.id, formData);
      if (result) {
        setShowEditModal(false);
        setSelectedDiocese(null);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this diocese?')) {
      await deleteDiocese(id);
    }
  };

  const handleEdit = (diocese: Diocese) => {
    setSelectedDiocese(diocese);
    setFormData({
      code: diocese.code,
      name: diocese.name,
      address: diocese.address || '',
      city: diocese.city || '',
      county: diocese.county || '',
      country: diocese.country || 'România',
      phone: diocese.phone || '',
      email: diocese.email || '',
      website: diocese.website || '',
      bishopName: diocese.bishopName || '',
      isActive: diocese.isActive,
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
      render: (_: any, row: Diocese) => (
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
    { label: 'Dioceses' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">Dioceses</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Add Diocese</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Input
              placeholder="Search dioceses..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardBody>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <Table
                data={dioceses}
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

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Diocese"
      >
        <div className="space-y-4">
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Diocese"
      >
        <div className="space-y-4">
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

