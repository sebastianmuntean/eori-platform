'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { ProductAddModal } from '@/components/accounting/ProductAddModal';
import { ProductEditModal } from '@/components/accounting/ProductEditModal';
import { DeleteProductDialog } from '@/components/accounting/DeleteProductDialog';
import { ProductsFiltersCard } from '@/components/accounting/ProductsFiltersCard';
import { ProductsTableCard } from '@/components/accounting/ProductsTableCard';
import { useProducts, Product } from '@/hooks/useProducts';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { useProductForm } from '@/hooks/useProductForm';
import { useProductsTableColumns } from './ProductsTableColumns';

const PAGE_SIZE = 10;

// Utility function to convert string boolean filter to boolean | undefined
const parseBooleanFilter = (value: string): boolean | undefined => {
  if (value === '') return undefined;
  return value === 'true';
};

interface ProductsPageContentProps {
  locale: string;
}

/**
 * Products page content component
 * Contains all the JSX/HTML and business logic that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function ProductsPageContent({ locale }: ProductsPageContentProps) {
  const t = useTranslations('common');

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
    fetchParishes({ all: true });
  }, [fetchParishes]);

  // Build fetch parameters, converting empty strings to undefined
  // to avoid sending empty query parameters
  const fetchParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      category: categoryFilter || undefined,
      isActive: parseBooleanFilter(isActiveFilter),
    }),
    [currentPage, searchTerm, parishFilter, categoryFilter, isActiveFilter]
  );

  // Refresh products list
  const refreshProducts = useCallback(() => {
    fetchProducts(fetchParams);
  }, [fetchParams, fetchProducts]);

  useEffect(() => {
    fetchProducts(fetchParams);
  }, [fetchParams, fetchProducts]);

  // Generic form submission handler that works for both create and update
  const handleFormSubmit = useCallback(
    async (operation: 'create' | 'update', productId?: string) => {
      setSubmitError(null);
      setIsSubmitting(true);

      try {
        const validation = validateForm(t);
        if (!validation.valid) {
          setSubmitError(validation.error || t('fillRequiredFields') || 'Please fill all required fields');
          return;
        }

        // Validate productId for update operations
        if (operation === 'update' && !productId) {
          setSubmitError(t('updateProductError') || 'Product ID is required for update');
          return;
        }

        const productData = toApiData();
        const result =
          operation === 'create'
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
          refreshProducts();
        } else {
          const errorKey = operation === 'create' ? 'createProductError' : 'updateProductError';
          setSubmitError(t(errorKey) || `Failed to ${operation} product. Please try again.`);
        }
      } catch (error) {
        const errorKey = operation === 'create' ? 'createProductError' : 'updateProductError';
        const errorMessage =
          error instanceof Error
            ? error.message
            : t(errorKey) ||
              `An error occurred while ${operation === 'create' ? 'creating' : 'updating'} the product.`;
        setSubmitError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateForm, toApiData, createProduct, updateProduct, refreshProducts, resetForm, t]
  );

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
        refreshProducts();
      }
    },
    [deleteProduct, refreshProducts]
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

  // Table columns
  const columns = useProductsTableColumns({
    onEdit: handleEdit,
    onDelete: (productId) => setDeleteConfirm(productId),
  });

  return (
    <PageContainer>
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
    </PageContainer>
  );
}

