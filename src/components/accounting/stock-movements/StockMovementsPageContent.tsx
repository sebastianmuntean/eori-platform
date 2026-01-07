'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { StockMovementAddModal, StockMovementFormData } from '@/components/accounting/StockMovementAddModal';
import { StockMovementEditModal } from '@/components/accounting/StockMovementEditModal';
import { DeleteStockMovementDialog } from '@/components/accounting/DeleteStockMovementDialog';
import { StockMovementsFiltersCard } from '@/components/accounting/StockMovementsFiltersCard';
import { StockMovementsTableCard } from '@/components/accounting/StockMovementsTableCard';
import { useStockMovements, StockMovement } from '@/hooks/useStockMovements';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useProducts } from '@/hooks/useProducts';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

interface StockMovementsPageContentProps {
  locale: string;
}

const PAGE_SIZE = 10;

// Helper function to create empty form data
const createEmptyFormData = (): StockMovementFormData => ({
  warehouseId: '',
  productId: '',
  parishId: '',
  type: 'in',
  movementDate: new Date().toISOString().split('T')[0],
  quantity: '',
  unitCost: '',
  notes: '',
  destinationWarehouseId: '',
});

// Helper function to safely parse and format numbers
const formatQuantity = (value: string): string => {
  const num = parseFloat(value);
  return isNaN(num) ? '-' : num.toFixed(3);
};

const formatValue = (value: string | null): string => {
  if (!value) return '-';
  const num = parseFloat(value);
  return isNaN(num) ? '-' : num.toFixed(2);
};

/**
 * Stock Movements page content component
 * Contains all the JSX/HTML and business logic that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function StockMovementsPageContent({ locale }: StockMovementsPageContentProps) {
  const t = useTranslations('common');

  const {
    stockMovements,
    loading,
    error,
    pagination,
    fetchStockMovements,
    createStockMovement,
    updateStockMovement,
    deleteStockMovement,
  } = useStockMovements();

  const { warehouses, fetchWarehouses } = useWarehouses();
  const { products, fetchProducts } = useProducts();
  const { parishes, fetchParishes } = useParishes();

  const [parishFilter, setParishFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStockMovement, setSelectedStockMovement] = useState<StockMovement | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<StockMovementFormData>(createEmptyFormData());

  useEffect(() => {
    fetchParishes({ all: true });
    fetchWarehouses({ pageSize: 1000 });
    fetchProducts({ pageSize: 1000 });
  }, [fetchParishes, fetchWarehouses, fetchProducts]);

  // Build fetch parameters helper
  const buildFetchParams = useCallback(() => {
    const params: {
      page: number;
      pageSize: number;
      parishId?: string;
      warehouseId?: string;
      productId?: string;
      type?: 'in' | 'out' | 'transfer' | 'adjustment' | 'return';
      dateFrom?: string;
      dateTo?: string;
    } = {
      page: currentPage,
      pageSize: PAGE_SIZE,
    };

    if (parishFilter) params.parishId = parishFilter;
    if (warehouseFilter) params.warehouseId = warehouseFilter;
    if (productFilter) params.productId = productFilter;
    if (typeFilter) {
      params.type = typeFilter as 'in' | 'out' | 'transfer' | 'adjustment' | 'return';
    }
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    return params;
  }, [currentPage, parishFilter, warehouseFilter, productFilter, typeFilter, dateFrom, dateTo]);

  // Refresh stock movements list
  const refreshStockMovements = useCallback(() => {
    fetchStockMovements(buildFetchParams());
  }, [fetchStockMovements, buildFetchParams]);

  useEffect(() => {
    fetchStockMovements(buildFetchParams());
  }, [fetchStockMovements, buildFetchParams]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(createEmptyFormData());
  }, []);

  // Validate transfer type requires destination warehouse
  const validateTransferType = useCallback((data: StockMovementFormData): string | null => {
    if (data.type === 'transfer' && !data.destinationWarehouseId) {
      return t('destinationWarehouseRequired') || 'Destination warehouse is required for transfer type';
    }
    return null;
  }, [t]);

  const handleCreate = useCallback(async () => {
    const validationError = validateTransferType(formData);
    if (validationError) {
      alert(validationError);
      return;
    }

    const result = await createStockMovement(formData);
    if (result) {
      setShowAddModal(false);
      resetForm();
      refreshStockMovements();
    }
  }, [formData, createStockMovement, validateTransferType, resetForm, refreshStockMovements]);

  const handleUpdate = useCallback(async () => {
    if (!selectedStockMovement) return;

    const validationError = validateTransferType(formData);
    if (validationError) {
      alert(validationError);
      return;
    }

    const result = await updateStockMovement(selectedStockMovement.id, formData);
    if (result) {
      setShowEditModal(false);
      setSelectedStockMovement(null);
      refreshStockMovements();
    }
  }, [selectedStockMovement, formData, updateStockMovement, validateTransferType, refreshStockMovements]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteStockMovement(id);
    if (result) {
      setDeleteConfirm(null);
      refreshStockMovements();
    }
  }, [deleteStockMovement, refreshStockMovements]);

  const handleEdit = useCallback((stockMovement: StockMovement) => {
    setSelectedStockMovement(stockMovement);
    setFormData({
      warehouseId: stockMovement.warehouseId,
      productId: stockMovement.productId,
      parishId: stockMovement.parishId,
      type: stockMovement.type,
      movementDate: stockMovement.movementDate 
        ? stockMovement.movementDate.split('T')[0] 
        : new Date().toISOString().split('T')[0],
      quantity: stockMovement.quantity,
      unitCost: stockMovement.unitCost || '',
      notes: stockMovement.notes || '',
      destinationWarehouseId: stockMovement.destinationWarehouseId || '',
    });
    setShowEditModal(true);
  }, []);

  // Close add modal and reset form
  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    resetForm();
  }, [resetForm]);

  // Close edit modal
  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedStockMovement(null);
  }, []);

  const getWarehouseName = useCallback((id: string) => {
    const warehouse = warehouses.find(w => w.id === id);
    return warehouse ? warehouse.name : id;
  }, [warehouses]);

  const getProductName = useCallback((id: string) => {
    const product = products.find(p => p.id === id);
    return product ? product.name : id;
  }, [products]);

  const columns = useMemo(() => [
    {
      key: 'type',
      label: t('type') || 'Type',
      sortable: false,
      render: (value: string) => {
        const variantMap: Record<string, 'success' | 'danger' | 'info' | 'warning' | 'secondary'> = {
          in: 'success',
          out: 'danger',
          transfer: 'info',
          adjustment: 'warning',
          return: 'secondary',
        };
        return (
          <Badge variant={variantMap[value] || 'secondary'} size="sm">
            {value.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'warehouseId',
      label: t('warehouse') || 'Warehouse',
      sortable: false,
      render: (value: string) => getWarehouseName(value),
    },
    {
      key: 'productId',
      label: t('product') || 'Product',
      sortable: false,
      render: (value: string) => getProductName(value),
    },
    { key: 'movementDate', label: t('date') || 'Date', sortable: true },
    {
      key: 'quantity',
      label: t('quantity') || 'Quantity',
      sortable: true,
      render: (value: string) => formatQuantity(value),
    },
    {
      key: 'totalValue',
      label: t('value') || 'Value',
      sortable: true,
      render: (value: string | null) => formatValue(value),
    },
    {
      key: 'actions',
      label: t('actions'),
      sortable: false,
      render: (_: any, row: StockMovement) => (
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
            { label: t('delete') || 'Delete', onClick: () => setDeleteConfirm(row.id), variant: 'danger' as const },
          ]}
          align="right"
        />
      ),
    },
  ], [t, getWarehouseName, getProductName, handleEdit]);

  // Filter change handlers with page reset
  const handleParishFilterChange = useCallback((value: string) => {
    setParishFilter(value);
    setCurrentPage(1);
  }, []);

  const handleWarehouseFilterChange = useCallback((value: string) => {
    setWarehouseFilter(value);
    setCurrentPage(1);
  }, []);

  const handleProductFilterChange = useCallback((value: string) => {
    setProductFilter(value);
    setCurrentPage(1);
  }, []);

  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  }, []);

  const handleDateFromChange = useCallback((value: string) => {
    setDateFrom(value);
    setCurrentPage(1);
  }, []);

  const handleDateToChange = useCallback((value: string) => {
    setDateTo(value);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setParishFilter('');
    setWarehouseFilter('');
    setProductFilter('');
    setTypeFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  }, []);

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('accounting') || 'Accounting', href: `/${locale}/dashboard/accounting` },
          { label: t('stockMovements') || 'Stock Movements' },
        ]}
        title={t('stockMovements') || 'Stock Movements'}
        action={<Button onClick={() => setShowAddModal(true)}>{t('add') || 'Add'}</Button>}
      />

      {/* Filters */}
      <StockMovementsFiltersCard
        parishFilter={parishFilter}
        warehouseFilter={warehouseFilter}
        productFilter={productFilter}
        typeFilter={typeFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        parishes={parishes}
        warehouses={warehouses}
        products={products}
        onParishFilterChange={handleParishFilterChange}
        onWarehouseFilterChange={handleWarehouseFilterChange}
        onProductFilterChange={handleProductFilterChange}
        onTypeFilterChange={handleTypeFilterChange}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onClear={handleClearFilters}
      />

      {/* Table */}
      <StockMovementsTableCard
        data={stockMovements}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage={t('noData') || 'No stock movements available'}
      />

      {/* Add Modal */}
      <StockMovementAddModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        onCancel={handleCloseAddModal}
        formData={formData}
        onFormDataChange={setFormData}
        parishes={parishes}
        warehouses={warehouses}
        products={products}
        onSubmit={handleCreate}
        isSubmitting={loading}
      />

      {/* Edit Modal */}
      <StockMovementEditModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onCancel={handleCloseEditModal}
        formData={formData}
        onFormDataChange={setFormData}
        parishes={parishes}
        warehouses={warehouses}
        products={products}
        onSubmit={handleUpdate}
        isSubmitting={loading}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteStockMovementDialog
        isOpen={!!deleteConfirm}
        stockMovementId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}

