'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { useProducts, Product } from '@/hooks/useProducts';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PANGARE_PERMISSIONS } from '@/lib/permissions/pangare';
import { ProductAddModal, ProductFormData } from '@/components/pangare/ProductAddModal';
import { createEmptyProductFormData } from '@/components/pangare/ProductFormData';
import { ProductEditModal } from '@/components/pangare/ProductEditModal';
import { DeleteProductDialog } from '@/components/pangare/DeleteProductDialog';
import { ProductsFiltersCard } from '@/components/pangare/ProductsFiltersCard';
import { ProductsTableCard } from '@/components/pangare/ProductsTableCard';

export default function ProdusePangarPage() {
  const { loading: permissionLoading } = useRequirePermission(PANGARE_PERMISSIONS.VIEW);
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
  const [formData, setFormData] = useState<ProductFormData>(createEmptyProductFormData());

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
  }, [permissionLoading, fetchParishes]);

  const refreshProducts = useCallback(() => {
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

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const handleAdd = useCallback(() => {
    resetForm();
    setShowAddModal(true);
  }, []);

  const handleEdit = useCallback((product: Product) => {
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
  }, []);

  const handleCreate = useCallback(async () => {
    const result = await createProduct(formData);
    if (result) {
      setShowAddModal(false);
      resetForm();
      refreshProducts();
    }
  }, [formData, createProduct, refreshProducts]);

  const handleUpdate = useCallback(async () => {
    if (!selectedProduct) return;
    const result = await updateProduct(selectedProduct.id, formData);
    if (result) {
      setShowEditModal(false);
      setSelectedProduct(null);
      refreshProducts();
    }
  }, [selectedProduct, formData, updateProduct, refreshProducts]);

  const handleDelete = useCallback(async (id: string) => {
    const success = await deleteProduct(id);
    if (success) {
      setDeleteConfirm(null);
      refreshProducts();
    }
  }, [deleteProduct, refreshProducts]);

  const resetForm = useCallback(() => {
    setFormData(createEmptyProductFormData());
    setSelectedProduct(null);
  }, []);

  const columns = useMemo(() => [
    { key: 'code' as keyof Product, label: t('code') || 'Code', sortable: true },
    { key: 'name' as keyof Product, label: t('name') || 'Name', sortable: true },
    { key: 'category' as keyof Product, label: t('category') || 'Category', sortable: true },
    { key: 'unit' as keyof Product, label: t('unit') || 'Unit', sortable: false },
    {
      key: 'salePrice' as keyof Product,
      label: t('salePrice') || 'Sale Price',
      sortable: true,
      render: (value: string) => value ? `${parseFloat(value).toFixed(2)} RON` : '-',
    },
    {
      key: 'trackStock' as keyof Product,
      label: t('trackStock') || 'Track Stock',
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'info' : 'secondary'} size="sm">
          {value ? t('yes') || 'Yes' : t('no') || 'No'}
        </Badge>
      ),
    },
    {
      key: 'isActive' as keyof Product,
      label: t('status') || 'Status',
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? t('active') || 'Active' : t('inactive') || 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions' as keyof Product,
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
  ], [t, handleEdit]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setParishFilter('');
    setCategoryFilter('');
    setIsActiveFilter('');
    setCurrentPage(1);
  }, []);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tMenu('pangare') || 'Pangare', href: `/${locale}/dashboard/pangare` },
          { label: t('products') || 'Produse' },
        ]}
        title={t('products') || 'Produse'}
        action={<Button onClick={handleAdd}>{t('add') || 'Adaugă'}</Button>}
      />

      {/* Filters */}
      <ProductsFiltersCard
        searchTerm={searchTerm}
        parishFilter={parishFilter}
        categoryFilter={categoryFilter}
        isActiveFilter={isActiveFilter}
        parishes={parishes}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        onParishFilterChange={(value) => {
          setParishFilter(value);
          setCurrentPage(1);
        }}
        onCategoryFilterChange={(value) => {
          setCategoryFilter(value);
          setCurrentPage(1);
        }}
        onIsActiveFilterChange={(value) => {
          setIsActiveFilter(value);
          setCurrentPage(1);
        }}
        onClearFilters={handleClearFilters}
      />

      {/* Products Table */}
      <ProductsTableCard
        data={products}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData') || 'No products available'}
      />

      {/* Add Modal */}
      <ProductAddModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onCancel={() => {
          setShowAddModal(false);
          resetForm();
        }}
        formData={formData}
        onFormDataChange={setFormData}
        parishes={parishes}
        onSubmit={handleCreate}
        isSubmitting={loading}
      />

      {/* Edit Modal */}
      <ProductEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        formData={formData}
        onFormDataChange={setFormData}
        parishes={parishes}
        onSubmit={handleUpdate}
        isSubmitting={loading}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteProductDialog
        isOpen={!!deleteConfirm}
        productId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        isLoading={loading}
      />
    </PageContainer>
  );
}


