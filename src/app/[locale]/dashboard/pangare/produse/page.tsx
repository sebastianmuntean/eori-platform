'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { useProducts, Product } from '@/hooks/useProducts';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear, ParishFilter, FilterSelect } from '@/components/ui/FilterGrid';

export default function ProdusePangarPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

  const {
    products,
    loading,
    error,
    pagination,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProducts();

  const { parishes, fetchParishes } = useParishes();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    parishId: '',
    code: '',
    name: '',
    description: '',
    category: '',
    unit: 'buc',
    purchasePrice: '',
    salePrice: '',
    vatRate: '19',
    barcode: '',
    trackStock: true,
    minStock: '',
    isActive: true,
  });

  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  useEffect(() => {
    const params: any = {
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      category: categoryFilter || undefined,
      isActive: isActiveFilter === '' ? undefined : isActiveFilter === 'true',
    };
    fetchProducts(params);
  }, [currentPage, searchTerm, parishFilter, categoryFilter, isActiveFilter, fetchProducts]);

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      parishId: product.parishId,
      code: product.code,
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      unit: product.unit,
      purchasePrice: product.purchasePrice || '',
      salePrice: product.salePrice || '',
      vatRate: product.vatRate,
      barcode: product.barcode || '',
      trackStock: product.trackStock,
      minStock: product.minStock || '',
      isActive: product.isActive,
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (selectedProduct) {
      const result = await updateProduct(selectedProduct.id, formData);
      if (result) {
        setShowEditModal(false);
        setSelectedProduct(null);
        fetchProducts({ page: currentPage, pageSize: 10 });
      }
    } else {
      const result = await createProduct(formData);
      if (result) {
        setShowAddModal(false);
        resetForm();
        fetchProducts({ page: currentPage, pageSize: 10 });
      }
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteProduct(id);
    if (success) {
      setDeleteConfirm(null);
      fetchProducts({ page: currentPage, pageSize: 10 });
    }
  };

  const resetForm = () => {
    setFormData({
      parishId: '',
      code: '',
      name: '',
      description: '',
      category: '',
      unit: 'buc',
      purchasePrice: '',
      salePrice: '',
      vatRate: '19',
      barcode: '',
      trackStock: true,
      minStock: '',
      isActive: true,
    });
    setSelectedProduct(null);
  };

  const columns: any[] = [
    { key: 'code', label: t('code') || 'Code', sortable: true },
    { key: 'name', label: t('name') || 'Name', sortable: true },
    { key: 'category', label: t('category') || 'Category', sortable: true },
    { key: 'unit', label: t('unit') || 'Unit', sortable: false },
    {
      key: 'salePrice',
      label: t('salePrice') || 'Sale Price',
      sortable: true,
      render: (value: string) => value ? `${parseFloat(value).toFixed(2)} RON` : '-',
    },
    {
      key: 'trackStock',
      label: t('trackStock') || 'Track Stock',
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'info' : 'secondary'} size="sm">
          {value ? t('yes') || 'Yes' : t('no') || 'No'}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      label: t('status') || 'Status',
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? t('active') || 'Active' : t('inactive') || 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: t('actions') || 'Actions',
      sortable: false,
      render: (_: any, row: Product) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          }
          items={[
            { label: t('edit') || 'Edit', onClick: () => handleEdit(row) },
            { label: t('delete') || 'Delete', onClick: () => setDeleteConfirm(row.id), variant: 'danger' },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tMenu('pangare') || 'Pangare', href: `/${locale}/dashboard/pangare` },
          { label: t('products') || 'Produse', href: `/${locale}/dashboard/pangare/produse` },
        ]}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t('products') || 'Produse'}</h1>
            <Button onClick={handleAdd}>{t('add') || 'Adaugă'}</Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex gap-4">
              <SearchInput
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t('search') || 'Căutare...'}
              />
            </div>

            <FilterGrid>
              <ParishFilter
                value={parishFilter}
                onChange={(value) => {
                  setParishFilter(value);
                  setCurrentPage(1);
                }}
                parishes={parishes}
              />
              <Input
                label={t('category') || 'Categorie'}
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t('filterByCategory') || 'Filtrează după categorie...'}
              />
              <FilterSelect
                label={t('status') || 'Status'}
                value={isActiveFilter}
                onChange={(value) => {
                  setIsActiveFilter(value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: t('all') || 'Toate' },
                  { value: 'true', label: t('active') || 'Active' },
                  { value: 'false', label: t('inactive') || 'Inactive' },
                ]}
              />
              <FilterClear
                onClear={() => {
                  setSearchTerm('');
                  setParishFilter('');
                  setCategoryFilter('');
                  setIsActiveFilter('');
                  setCurrentPage(1);
                }}
              />
            </FilterGrid>

            {error && (
              <div className="p-4 bg-danger/10 text-danger rounded">
                {error}
              </div>
            )}

            <Table
              data={products}
              columns={columns}
              loading={loading}
              pagination={pagination}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        title={selectedProduct ? (t('editProduct') || 'Editează Produs') : (t('addProduct') || 'Adaugă Produs')}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Select
            label={t('parish') || 'Parohie'}
            value={formData.parishId}
            onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
            options={parishes.map(p => ({ value: p.id, label: p.name }))}
            required
          />
          <Input
            label={t('code') || 'Cod'}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <Input
            label={t('name') || 'Nume'}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={t('description') || 'Descriere'}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Input
            label={t('category') || 'Categorie'}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
          <Input
            label={t('unit') || 'Unitate'}
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            required
          />
          <Input
            label={t('purchasePrice') || 'Preț de cumpărare'}
            type="number"
            step="0.01"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
          />
          <Input
            label={t('salePrice') || 'Preț de vânzare'}
            type="number"
            step="0.01"
            value={formData.salePrice}
            onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
          />
          <Input
            label={t('vatRate') || 'Cota TVA (%)'}
            type="number"
            step="0.01"
            value={formData.vatRate}
            onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
          />
          <Input
            label={t('barcode') || 'Cod de bare'}
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
          />
          <Input
            label={t('minStock') || 'Stoc minim'}
            type="number"
            step="0.001"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="trackStock"
              checked={formData.trackStock}
              onChange={(e) => setFormData({ ...formData, trackStock: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="trackStock" className="text-sm">{t('trackStock') || 'Urmărire stoc'}</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-sm">{t('active') || 'Activ'}</label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              resetForm();
            }}>
              {t('cancel') || 'Anulează'}
            </Button>
            <Button onClick={handleSave}>{t('save') || 'Salvează'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('confirmDelete') || 'Confirmă ștergerea'}
      >
        <div className="space-y-4">
          <p>{t('confirmDeleteMessage') || 'Sigur doriți să ștergeți acest produs?'}</p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
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

