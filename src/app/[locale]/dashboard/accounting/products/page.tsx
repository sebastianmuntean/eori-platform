'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { ProductAddModal } from '@/components/accounting/ProductAddModal';
import { ProductEditModal } from '@/components/accounting/ProductEditModal';
import { DeleteProductDialog } from '@/components/accounting/DeleteProductDialog';
import { ProductsFiltersCard } from '@/components/accounting/ProductsFiltersCard';
import { ProductsTableCard } from '@/components/accounting/ProductsTableCard';
import { useProducts, Product } from '@/hooks/useProducts';
import { Column } from '@/components/ui/Table';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { useProductForm } from '@/hooks/useProductForm';

// Utility function to convert string boolean filter to boolean | undefined
const parseBooleanFilter = (value: string): boolean | undefined => {
  if (value === '') return undefined;
  return value === 'true';
};

export default function ProductsPage() {
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.PRODUCTS_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('products'));

  // All hooks must be called before any conditional returns
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    formData,
    resetForm,
    updateFormData,
    loadProduct,
    validateForm,
    toApiData,
  } = useProductForm();

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
  }, [permissionLoading, fetchParishes]);

  // Build fetch parameters, converting empty strings to undefined
  // to avoid sending empty query parameters
  const getFetchParams = useCallback(() => ({
    page: currentPage,
    pageSize: 10,
    search: searchTerm || undefined,
    parishId: parishFilter || undefined,
    category: categoryFilter || undefined,
    isActive: parseBooleanFilter(isActiveFilter),
  }), [currentPage, searchTerm, parishFilter, categoryFilter, isActiveFilter]);

  useEffect(() => {
    if (permissionLoading) return;
    fetchProducts(getFetchParams());
  }, [permissionLoading, getFetchParams, fetchProducts]);

  // Generic form submission handler that works for both create and update
  const handleFormSubmit = useCallback(async (
    operation: 'create' | 'update',
    productId?: string
  ) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const validation = validateForm(t);
      if (!validation.valid) {
        setSubmitError(validation.error || t('fillRequiredFields') || 'Please fill all required fields');
        return;
      }

      const productData = toApiData();
      const result = operation === 'create'
        ? await createProduct(productData)
        : await updateProduct(productId!, productData);
      
      if (result) {
        if (operation === 'create') {
          setShowAddModal(false);
          resetForm();
        } else {
          setShowEditModal(false);
          setSelectedProduct(null);
        }
        fetchProducts(getFetchParams());
      } else {
        const errorKey = operation === 'create' ? 'createProductError' : 'updateProductError';
        setSubmitError(t(errorKey) || `Failed to ${operation} product. Please try again.`);
      }
    } catch (error) {
      const errorKey = operation === 'create' ? 'createProductError' : 'updateProductError';
      const errorMessage = error instanceof Error 
        ? error.message 
        : t(errorKey) || `An error occurred while ${operation === 'create' ? 'creating' : 'updating'} the product.`;
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, toApiData, createProduct, updateProduct, getFetchParams, fetchProducts, resetForm, t]);

  const handleAdd = useCallback(() => {
    resetForm();
    setSubmitError(null);
    setShowAddModal(true);
  }, [resetForm]);

  const handleEdit = useCallback(
    (product: Product) => {
      setSelectedProduct(product);
      loadProduct(product);
      setSubmitError(null);
      setShowEditModal(true);
    },
    [loadProduct]
  );

  const handleCreate = useCallback(() => handleFormSubmit('create'), [handleFormSubmit]);
  const handleUpdate = useCallback(() => {
    if (!selectedProduct) return;
    handleFormSubmit('update', selectedProduct.id);
  }, [selectedProduct, handleFormSubmit]);

  const handleDelete = useCallback(
    async (id: string) => {
      const success = await deleteProduct(id);
      if (success) {
        setDeleteConfirm(null);
        fetchProducts(getFetchParams());
      }
    },
    [deleteProduct, getFetchParams, fetchProducts]
  );

  // Filter change handlers that reset page to 1
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleParishFilterChange = useCallback((value: string) => {
    setParishFilter(value);
    setCurrentPage(1);
  }, []);

  const handleCategoryFilterChange = useCallback((value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  }, []);

  const handleIsActiveFilterChange = useCallback((value: string) => {
    setIsActiveFilter(value);
    setCurrentPage(1);
  }, []);

  const handleFilterClear = useCallback(() => {
    setSearchTerm('');
    setParishFilter('');
    setCategoryFilter('');
    setIsActiveFilter('');
    setCurrentPage(1);
  }, []);

  // Modal close handlers
  const handleAddModalClose = useCallback(() => {
    setShowAddModal(false);
    resetForm();
    setSubmitError(null);
  }, [resetForm]);

  const handleEditModalClose = useCallback(() => {
    setShowEditModal(false);
    setSelectedProduct(null);
    resetForm();
    setSubmitError(null);
  }, [resetForm]);

  const columns: Column<Product>[] = useMemo(() => [
    { key: 'code' as keyof Product, label: t('code') || 'Code', sortable: true },
    { key: 'name' as keyof Product, label: t('name') || 'Name', sortable: true },
    { key: 'category' as keyof Product, label: t('category') || 'Category', sortable: true },
    { key: 'unit' as keyof Product, label: t('unit') || 'Unit', sortable: false },
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
      key: 'id' as keyof Product,
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

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('accounting') || 'Accounting', href: `/${locale}/dashboard/accounting` },
          { label: t('products') || 'Products' },
        ]}
        title={t('products') || 'Products'}
        action={<Button onClick={handleAdd}>{t('add') || 'Add'}</Button>}
      />

      {/* Filters */}
      <ProductsFiltersCard
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        parishFilter={parishFilter}
        onParishFilterChange={handleParishFilterChange}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={handleCategoryFilterChange}
        isActiveFilter={isActiveFilter}
        onIsActiveFilterChange={handleIsActiveFilterChange}
        onClear={handleFilterClear}
        parishes={parishes}
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
        emptyMessage={t('noData') || 'No data available'}
      />

      {/* Add Modal */}
      <ProductAddModal
        isOpen={showAddModal}
        onClose={handleAddModalClose}
        onCancel={handleAddModalClose}
        formData={formData}
        onFormDataChange={updateFormData}
        parishes={parishes}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        error={submitError}
      />

      {/* Edit Modal */}
      <ProductEditModal
        isOpen={showEditModal}
        onClose={handleEditModalClose}
        onCancel={handleEditModalClose}
        formData={formData}
        onFormDataChange={updateFormData}
        parishes={parishes}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        error={submitError}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteProductDialog
        isOpen={!!deleteConfirm}
        productId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

