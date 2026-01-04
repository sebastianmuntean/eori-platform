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
import { useStockLevels } from '@/hooks/useStockLevels';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useProducts } from '@/hooks/useProducts';
import { useParishes } from '@/hooks/useParishes';
import { useClients } from '@/hooks/useClients';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useTranslations } from 'next-intl';
import { FilterGrid, ParishFilter, FilterSelect } from '@/components/ui/FilterGrid';

interface CartItem {
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export default function PangarPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

  const { stockLevels, fetchStockLevels } = useStockLevels();
  const { warehouses, fetchWarehouses } = useWarehouses();
  const { products, fetchProducts } = useProducts();
  const { parishes, fetchParishes } = useParishes();
  const { clients, fetchClients } = useClients();
  const { createStockMovement } = useStockMovements();

  const [parishFilter, setParishFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [saleNotes, setSaleNotes] = useState('');

  useEffect(() => {
    fetchParishes({ all: true });
    fetchWarehouses({ pageSize: 1000 });
    fetchProducts({ pageSize: 1000, trackStock: true });
    fetchClients({ pageSize: 1000 });
  }, [fetchParishes, fetchWarehouses, fetchProducts, fetchClients]);

  useEffect(() => {
    if (parishFilter || warehouseFilter) {
      fetchStockLevels({
        parishId: parishFilter || undefined,
        warehouseId: warehouseFilter || undefined,
      });
    }
  }, [parishFilter, warehouseFilter, fetchStockLevels]);

  const handleAddToCart = (stockLevel: any) => {
    const existingItem = cart.find(
      item => item.productId === stockLevel.productId && item.warehouseId === stockLevel.warehouseId
    );

    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === stockLevel.productId && item.warehouseId === stockLevel.warehouseId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const product = products.find(p => p.id === stockLevel.productId);
      const warehouse = warehouses.find(w => w.id === stockLevel.warehouseId);
      
      if (product && warehouse) {
        const unitPrice = parseFloat(product.salePrice || '0');
        const vatRate = parseFloat(product.vatRate || '19');
        const quantity = 1;
        const subtotal = unitPrice * quantity;
        const vatAmount = subtotal * (vatRate / 100);
        const total = subtotal + vatAmount;

        setCart([...cart, {
          productId: product.id,
          productName: product.name,
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          quantity,
          unitPrice,
          vatRate,
          total,
        }]);
      }
    }
  };

  const handleUpdateQuantity = (productId: string, warehouseId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => !(item.productId === productId && item.warehouseId === warehouseId)));
    } else {
      setCart(cart.map(item => {
        if (item.productId === productId && item.warehouseId === warehouseId) {
          const subtotal = item.unitPrice * quantity;
          const vatAmount = subtotal * (item.vatRate / 100);
          const total = subtotal + vatAmount;
          return { ...item, quantity, total };
        }
        return item;
      }));
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const saleDate = new Date().toISOString().split('T')[0];
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const vatTotal = cart.reduce((sum, item) => sum + ((item.unitPrice * item.quantity) * (item.vatRate / 100)), 0);
    const total = subtotal + vatTotal;

    // Create stock movements for each item
    for (const item of cart) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;

      const stockLevel = stockLevels.find(
        sl => sl.productId === item.productId && sl.warehouseId === item.warehouseId
      );

      if (!stockLevel || stockLevel.quantity < item.quantity) {
        alert(`Stoc insuficient pentru ${item.productName}`);
        return;
      }

      // Create out movement
      await createStockMovement({
        warehouseId: item.warehouseId,
        productId: item.productId,
        parishId: parishFilter,
        type: 'out',
        movementDate: saleDate,
        quantity: item.quantity.toString(),
        unitCost: item.unitPrice.toString(),
        totalValue: (item.unitPrice * item.quantity).toString(),
        documentType: 'sale',
        documentNumber: `SALE-${Date.now()}`,
        documentDate: saleDate,
        clientId: selectedClient || null,
        notes: saleNotes || `Vânzare - ${item.productName}`,
      });
    }

    // Create invoice for the sale
    try {
      const response = await fetch('/api/accounting/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parishId: parishFilter,
          type: 'issued',
          date: saleDate,
          dueDate: saleDate,
          clientId: selectedClient || null,
          items: cart.map(item => ({
            description: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vat: (item.unitPrice * item.quantity) * (item.vatRate / 100),
            total: item.total,
            productId: item.productId,
            warehouseId: item.warehouseId,
            unitCost: item.unitPrice,
          })),
          currency: 'RON',
          description: saleNotes || 'Vânzare din pangar',
          status: 'paid',
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(t('saleCompleted') || 'Vânzare completată cu succes!');
        setCart([]);
        setShowCheckoutModal(false);
        setSelectedClient('');
        setSaleNotes('');
        fetchStockLevels({
          parishId: parishFilter || undefined,
          warehouseId: warehouseFilter || undefined,
        });
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert(t('error') || 'Eroare la crearea facturii');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

  const columns: any[] = [
    {
      key: 'product',
      label: t('product') || 'Produs',
      sortable: false,
      render: (value: any) => value?.name || '-',
    },
    {
      key: 'warehouse',
      label: t('warehouse') || 'Gestiune',
      sortable: false,
      render: (value: any) => value?.name || '-',
    },
    {
      key: 'quantity',
      label: t('quantity') || 'Cantitate',
      sortable: true,
      render: (value: number, row: any) => `${value.toFixed(3)} ${row.product?.unit || ''}`,
    },
    {
      key: 'totalValue',
      label: t('value') || 'Valoare',
      sortable: true,
      render: (value: number) => `${value.toFixed(2)} RON`,
    },
    {
      key: 'actions',
      label: t('actions') || 'Acțiuni',
      sortable: false,
      render: (_: any, row: any) => (
        <Button
          size="sm"
          onClick={() => handleAddToCart(row)}
          disabled={row.quantity <= 0}
        >
          {t('addToCart') || 'Adaugă în coș'}
        </Button>
      ),
    },
  ];

  const cartColumns: any[] = [
    { key: 'productName', label: t('product') || 'Produs', sortable: false },
    { key: 'warehouseName', label: t('warehouse') || 'Gestiune', sortable: false },
    {
      key: 'quantity',
      label: t('quantity') || 'Cantitate',
      sortable: false,
      render: (value: number, row: CartItem) => (
        <Input
          type="number"
          min="0.001"
          step="0.001"
          value={value}
          onChange={(e) => handleUpdateQuantity(row.productId, row.warehouseId, parseFloat(e.target.value) || 0)}
          className="w-20"
        />
      ),
    },
    {
      key: 'unitPrice',
      label: t('unitPrice') || 'Preț unitar',
      sortable: false,
      render: (value: number) => `${value.toFixed(2)} RON`,
    },
    {
      key: 'total',
      label: t('total') || 'Total',
      sortable: false,
      render: (value: number) => `${value.toFixed(2)} RON`,
    },
    {
      key: 'actions',
      label: t('actions') || 'Acțiuni',
      sortable: false,
      render: (_: any, row: CartItem) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => setCart(cart.filter(item => !(item.productId === row.productId && item.warehouseId === row.warehouseId)))}
        >
          {t('remove') || 'Șterge'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tMenu('pangare') || 'Pangare', href: `/${locale}/dashboard/pangare` },
          { label: tMenu('pangar') || 'Pangar', href: `/${locale}/dashboard/pangare/pangar` },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{tMenu('pangar') || 'Pangar'}</h1>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <FilterGrid>
                  <ParishFilter
                    value={parishFilter}
                    onChange={(value) => {
                      setParishFilter(value);
                    }}
                    parishes={parishes}
                  />
                  <FilterSelect
                    label={t('warehouse') || 'Gestiune'}
                    value={warehouseFilter}
                    onChange={(value) => {
                      setWarehouseFilter(value);
                    }}
                    options={[
                      { value: '', label: t('all') || 'Toate' },
                      ...warehouses.map(w => ({ value: w.id, label: w.name })),
                    ]}
                  />
                </FilterGrid>

                <Table
                  data={stockLevels}
                  columns={columns}
                  loading={false}
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Shopping Cart */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">{t('shoppingCart') || 'Coș de cumpărături'}</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-text-secondary">{t('cartEmpty') || 'Coșul este gol'}</p>
                ) : (
                  <>
                    <Table
                      data={cart}
                      columns={cartColumns}
                      loading={false}
                    />
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold">{t('total') || 'Total:'}</span>
                        <span className="text-xl font-bold">{cartTotal.toFixed(2)} RON</span>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => setShowCheckoutModal(true)}
                      >
                        {t('checkout') || 'Finalizează vânzarea'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        title={t('checkout') || 'Finalizează vânzarea'}
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label={t('client') || 'Client'}
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            options={[
              { value: '', label: t('noClient') || 'Fără client' },
              ...clients.map(c => ({ value: c.id, label: c.companyName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.code })),
            ]}
          />
          <Select
            label={t('paymentMethod') || 'Metodă de plată'}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
            options={[
              { value: 'cash', label: t('cash') || 'Numerar' },
              { value: 'card', label: t('card') || 'Card' },
              { value: 'bank_transfer', label: t('bankTransfer') || 'Transfer bancar' },
            ]}
          />
          <Input
            label={t('notes') || 'Note'}
            value={saleNotes}
            onChange={(e) => setSaleNotes(e.target.value)}
            placeholder={t('saleNotes') || 'Note despre vânzare...'}
          />
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold">{t('total') || 'Total:'}</span>
              <span className="text-xl font-bold">{cartTotal.toFixed(2)} RON</span>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowCheckoutModal(false)} className="flex-1">
                {t('cancel') || 'Anulează'}
              </Button>
              <Button onClick={handleCheckout} className="flex-1">
                {t('confirmSale') || 'Confirmă vânzarea'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

