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
import { Modal } from '@/components/ui/Modal';
import { useStockMovements, StockMovement } from '@/hooks/useStockMovements';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useProducts } from '@/hooks/useProducts';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { FilterGrid, FilterClear, ParishFilter, FilterSelect, FilterDate } from '@/components/ui/FilterGrid';

export default function StockMovementsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');

  const {
    stockMovements,
    loading,
    error,
    pagination,
    fetchStockMovements,
    createStockMovement,
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
  const [formData, setFormData] = useState({
    warehouseId: '',
    productId: '',
    parishId: '',
    type: 'in' as 'in' | 'out' | 'transfer' | 'adjustment' | 'return',
    movementDate: new Date().toISOString().split('T')[0],
    quantity: '',
    unitCost: '',
    notes: '',
    destinationWarehouseId: '',
  });

  useEffect(() => {
    fetchParishes({ all: true });
    fetchWarehouses({ pageSize: 1000 });
    fetchProducts({ pageSize: 1000 });
  }, [fetchParishes, fetchWarehouses, fetchProducts]);

  useEffect(() => {
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
  }, [currentPage, parishFilter, warehouseFilter, productFilter, typeFilter, dateFrom, dateTo, fetchStockMovements]);

  const handleSave = async () => {
    const result = await createStockMovement(formData);
    if (result) {
      setShowAddModal(false);
      resetForm();
      fetchStockMovements({ page: currentPage, pageSize: 10 });
    }
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

  const getWarehouseName = (id: string) => {
    const warehouse = warehouses.find(w => w.id === id);
    return warehouse ? warehouse.name : id;
  };

  const getProductName = (id: string) => {
    const product = products.find(p => p.id === id);
    return product ? product.name : id;
  };

  const columns: any[] = [
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
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('accounting') || 'Accounting', href: `/${locale}/dashboard/accounting` },
          { label: t('stockMovements') || 'Stock Movements', href: `/${locale}/dashboard/accounting/stock-movements` },
        ]}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t('stockMovements') || 'Stock Movements'}</h1>
            <Button onClick={() => setShowAddModal(true)}>{t('add') || 'Add'}</Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <FilterGrid>
              <ParishFilter
                value={parishFilter}
                onChange={(value) => {
                  setParishFilter(value);
                  setCurrentPage(1);
                }}
                parishes={parishes}
              />
              <FilterSelect
                label={t('warehouse') || 'Warehouse'}
                value={warehouseFilter}
                onChange={(value) => {
                  setWarehouseFilter(value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: t('all') || 'All' },
                  ...warehouses.map(w => ({ value: w.id, label: w.name })),
                ]}
              />
              <FilterSelect
                label={t('product') || 'Product'}
                value={productFilter}
                onChange={(value) => {
                  setProductFilter(value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: t('all') || 'All' },
                  ...products.map(p => ({ value: p.id, label: p.name })),
                ]}
              />
              <FilterSelect
                label={t('type') || 'Type'}
                value={typeFilter}
                onChange={(value) => {
                  setTypeFilter(value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: t('all') || 'All' },
                  { value: 'in', label: 'IN' },
                  { value: 'out', label: 'OUT' },
                  { value: 'transfer', label: 'TRANSFER' },
                  { value: 'adjustment', label: 'ADJUSTMENT' },
                  { value: 'return', label: 'RETURN' },
                ]}
              />
              <FilterDate
                label={t('dateFrom') || 'Date From'}
                value={dateFrom}
                onChange={(value) => {
                  setDateFrom(value);
                  setCurrentPage(1);
                }}
              />
              <FilterDate
                label={t('dateTo') || 'Date To'}
                value={dateTo}
                onChange={(value) => {
                  setDateTo(value);
                  setCurrentPage(1);
                }}
              />
              <FilterClear
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
            </FilterGrid>

            {error && (
              <div className="p-4 bg-danger/10 text-danger rounded">
                {error}
              </div>
            )}

            <Table
              data={stockMovements}
              columns={columns}
              loading={loading}
              pagination={pagination}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardBody>
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={t('addStockMovement') || 'Add Stock Movement'}
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label={t('parish') || 'Parish'}
            value={formData.parishId}
            onChange={(e) => setFormData({ ...formData, parishId: e.target.value })}
            options={parishes.map(p => ({ value: p.id, label: p.name }))}
            required
          />
          <Select
            label={t('warehouse') || 'Warehouse'}
            value={formData.warehouseId}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
            options={warehouses.map(w => ({ value: w.id, label: w.name }))}
            required
          />
          <Select
            label={t('product') || 'Product'}
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            options={products.filter(p => p.trackStock).map(p => ({ value: p.id, label: p.name }))}
            required
          />
          <Select
            label={t('type') || 'Type'}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            options={[
              { value: 'in', label: 'IN' },
              { value: 'out', label: 'OUT' },
              { value: 'transfer', label: 'TRANSFER' },
              { value: 'adjustment', label: 'ADJUSTMENT' },
              { value: 'return', label: 'RETURN' },
            ]}
            required
          />
          {formData.type === 'transfer' && (
            <Select
              label={t('destinationWarehouse') || 'Destination Warehouse'}
              value={formData.destinationWarehouseId}
              onChange={(e) => setFormData({ ...formData, destinationWarehouseId: e.target.value })}
              options={warehouses.filter(w => w.id !== formData.warehouseId).map(w => ({ value: w.id, label: w.name }))}
              required
            />
          )}
          <Input
            label={t('date') || 'Date'}
            type="date"
            value={formData.movementDate}
            onChange={(e) => setFormData({ ...formData, movementDate: e.target.value })}
            required
          />
          <Input
            label={t('quantity') || 'Quantity'}
            type="number"
            step="0.001"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
          <Input
            label={t('unitCost') || 'Unit Cost'}
            type="number"
            step="0.0001"
            value={formData.unitCost}
            onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
          />
          <Input
            label={t('notes') || 'Notes'}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => {
              setShowAddModal(false);
              resetForm();
            }}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSave}>{t('save') || 'Save'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

