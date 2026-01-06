import { useState, useRef, useEffect } from 'react';
import { InvoiceItem } from '@/hooks/useInvoices';
import { Product } from '@/hooks/useProducts';
import { ExtendedInvoiceItem, calculateItemTotal } from '@/lib/utils/invoiceUtils';

export interface InvoiceFormState {
  parishId: string;
  warehouseId: string;
  series: string;
  number: number | undefined;
  invoiceNumber: string;
  type: 'issued' | 'received';
  date: string;
  dueDate: string;
  clientId: string;
  currency: string;
  description: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
}

const getInitialFormData = (): InvoiceFormState => ({
  parishId: '',
  warehouseId: '',
  series: 'INV',
  number: undefined,
  invoiceNumber: '',
  type: 'issued',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date().toISOString().split('T')[0],
  clientId: '',
  currency: 'RON',
  description: '',
  status: 'draft',
  items: [],
});

export function useInvoiceForm() {
  const [formData, setFormData] = useState<InvoiceFormState>(getInitialFormData());
  const [newProductInput, setNewProductInput] = useState('');
  const previousItemsCountRef = useRef(0);

  // Reset product input when a new product is added
  useEffect(() => {
    if (formData.type === 'received' && formData.items.length > previousItemsCountRef.current) {
      setTimeout(() => {
        setNewProductInput('');
      }, 100);
    }
    previousItemsCountRef.current = formData.items.length;
  }, [formData.items.length, formData.type]);

  const resetForm = () => {
    setFormData(getInitialFormData());
    setNewProductInput('');
  };

  const updateFormData = (updates: Partial<InvoiceFormState>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const addLineItem = () => {
    if (formData.type === 'received') {
      const newItem: ExtendedInvoiceItem = {
        description: '',
        quantity: 1,
        unitPrice: 0,
        unitCost: 0,
        vat: 0,
        total: 0,
        productId: null,
        warehouseId: formData.warehouseId || null,
      };
      updateFormData({ items: [...formData.items, newItem] });
    } else {
      const newItem: InvoiceItem = {
        description: '',
        quantity: 1,
        unitPrice: 0,
        vat: 0,
        total: 0,
      };
      updateFormData({ items: [...formData.items, newItem] });
    }
  };

  const addProductItem = (product: Product, warehouseId?: string | null) => {
    const purchasePrice = parseFloat(product.purchasePrice || '0');
    const salePrice = parseFloat(product.salePrice || '0');
    const vatRate = parseFloat(product.vatRate || '19');

    const newItem: ExtendedInvoiceItem = {
      description: product.name,
      quantity: 1,
      unitPrice: salePrice,
      unitCost: purchasePrice,
      vat: (salePrice * vatRate) / 100,
      total: salePrice + (salePrice * vatRate) / 100,
      productId: product.id,
      warehouseId: warehouseId || null,
    };

    updateFormData({ items: [...formData.items, newItem] });
  };

  const removeLineItem = (index: number) => {
    updateFormData({
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateLineItem = (
    index: number,
    field: keyof ExtendedInvoiceItem,
    value: any,
    products?: Product[]
  ) => {
    const newItems = [...formData.items] as ExtendedInvoiceItem[];
    newItems[index] = { ...newItems[index], [field]: value };

    // If product is selected, update description
    if (field === 'productId' && value && products) {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].description = product.name;
        newItems[index].unitPrice = parseFloat(product.salePrice || '0');
        newItems[index].unitCost = parseFloat(product.purchasePrice || '0');
        const vatRate = parseFloat(product.vatRate || '19');
        newItems[index].vat = (newItems[index].unitPrice * vatRate) / 100;
      }
    }

    // Recalculate total when quantity, price, or cost changes
    if (field === 'quantity' || field === 'unitPrice' || field === 'unitCost') {
      const subtotal = newItems[index].quantity * newItems[index].unitPrice;
      const vatAmount = newItems[index].vat || 0;
      newItems[index].total = subtotal + vatAmount;
    }

    updateFormData({ items: newItems });
  };

  return {
    formData,
    newProductInput,
    setNewProductInput,
    resetForm,
    updateFormData,
    addLineItem,
    addProductItem,
    removeLineItem,
    updateLineItem,
  };
}





