'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
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
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';

export default function StockMovementsPage() {
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.STOCK_MOVEMENTS_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('stockMovements'));

  // All hooks must be called before any conditional returns
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
  const [formData, setFormData] = useState<StockMovementFormData>({
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

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
    fetchWarehouses({ pageSize: 1000 });
    fetchProducts({ pageSize: 1000 });
  }, [permissionLoading, fetchParishes, fetchWarehouses, fetchProducts]);

  useEffect(() => {
    if (permissionLoading) return;
    const params: any = {
      page: currentPage,
      pageSize: 10,
      parishId: parishFilter || undefined,
      warehouseId: warehouseFilter || undefined,
      productId: productFilter || undefined,
      type: typeFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    };
    fetchStockMovements(params);
  }, [permissionLoading, currentPage, parishFilter, warehouseFilter, productFilter, typeFilter, dateFrom, dateTo, fetchStockMovements]);

  const handleCreate = async () => {
    // Validate transfer type requires destination warehouse
    if (formData.type === 'transfer' && !formData.destinationWarehouseId) {
      alert(t('destinationWarehouseRequired') || 'Destination warehouse is required for transfer type');
      return;
    }

    const result = await createStockMovement(formData);
    if (result) {
      setShowAddModal(false);
      resetForm();
      const params: any = {
        page: currentPage,
        pageSize: 10,
        parishId: parishFilter || undefined,
        warehouseId: warehouseFilter || undefined,
        productId: productFilter || undefined,
        type: typeFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };
      fetchStockMovements(params);
    }
  };

  const handleUpdate = async () => {
    if (!selectedStockMovement) return;

    // Validate transfer type requires destination warehouse
    if (formData.type === 'transfer' && !formData.destinationWarehouseId) {
      alert(t('destinationWarehouseRequired') || 'Destination warehouse is required for transfer type');
      return;
    }

    const result = await updateStockMovement(selectedStockMovement.id, formData);
    if (result) {
      setShowEditModal(false);
      setSelectedStockMovement(null);
      const params: any = {
        page: currentPage,
        pageSize: 10,
        parishId: parishFilter || undefined,
        warehouseId: warehouseFilter || undefined,
        productId: productFilter || undefined,
        type: typeFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };
      fetchStockMovements(params);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteStockMovement(id);
    if (result) {
      setDeleteConfirm(null);
      const params: any = {
        page: currentPage,
        pageSize: 10,
        parishId: parishFilter || undefined,
        warehouseId: warehouseFilter || undefined,
        productId: productFilter || undefined,
        type: typeFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };
      fetchStockMovements(params);
    }
  };

  const handleEdit = (stockMovement: StockMovement) => {
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
  };

  const resetForm = () => {
    setFormData({
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
  };

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
      render: (value: string) => parseFloat(value).toFixed(3),
    },
    {
      key: 'totalValue',
      label: t('value') || 'Value',
      sortable: true,
      render: (value: string | null) => value ? parseFloat(value).toFixed(2) : '-',
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
  ], [t, getWarehouseName, getProductName]);

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
        onParishFilterChange={(value) => {
          setParishFilter(value);
          setCurrentPage(1);
        }}
        onWarehouseFilterChange={(value) => {
          setWarehouseFilter(value);
          setCurrentPage(1);
        }}
        onProductFilterChange={(value) => {
          setProductFilter(value);
          setCurrentPage(1);
        }}
        onTypeFilterChange={(value) => {
          setTypeFilter(value);
          setCurrentPage(1);
        }}
        onDateFromChange={(value) => {
          setDateFrom(value);
          setCurrentPage(1);
        }}
        onDateToChange={(value) => {
          setDateTo(value);
          setCurrentPage(1);
        }}
        onClear={() => {
          setParishFilter('');
          setWarehouseFilter('');
          setProductFilter('');
          setTypeFilter('');
          setDateFrom('');
          setDateTo('');
          setCurrentPage(1);
        }}
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
        warehouses={warehouses}
        products={products}
        onSubmit={handleCreate}
        isSubmitting={loading}
      />

      {/* Edit Modal */}
      <StockMovementEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStockMovement(null);
        }}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedStockMovement(null);
        }}
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
    </div>
  );
}

