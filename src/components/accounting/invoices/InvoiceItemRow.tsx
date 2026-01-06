import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ExtendedInvoiceItem } from '@/lib/utils/invoiceUtils';
import { formatCurrency } from '@/lib/utils/invoiceUtils';

interface InvoiceItemRowProps {
  item: ExtendedInvoiceItem;
  index: number;
  invoiceType: 'issued' | 'received';
  currency: string;
  onUpdate: (index: number, field: keyof ExtendedInvoiceItem, value: any) => void;
  onRemove: (index: number) => void;
  t: (key: string) => string;
}

export function InvoiceItemRow({
  item,
  index,
  invoiceType,
  currency,
  onUpdate,
  onRemove,
  t,
}: InvoiceItemRowProps) {
  if (invoiceType === 'received') {
    return (
      <div className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
        <div className="col-span-3">
          <Input
            label={t('product') || 'Produs'}
            value={item.description || ''}
            onChange={(e) => onUpdate(index, 'description', e.target.value)}
            placeholder={t('productName') || 'Nume produs'}
          />
        </div>
        <div className="col-span-2">
          <Input
            type="number"
            step="0.001"
            label={t('quantity') || 'Cantitate'}
            value={item.quantity}
            onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="col-span-2">
          <Input
            type="number"
            step="0.01"
            label={t('purchasePrice') || 'Preț Intrare'}
            value={item.unitCost || 0}
            onChange={(e) => onUpdate(index, 'unitCost', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="col-span-2">
          <Input
            type="number"
            step="0.01"
            label={t('salePrice') || 'Preț Ieșire'}
            value={item.unitPrice}
            onChange={(e) => onUpdate(index, 'unitPrice', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="col-span-2">
          <div className="text-sm font-medium pt-6">{formatCurrency(item.total, currency)}</div>
        </div>
        <div className="col-span-1">
          <Button type="button" variant="danger" size="sm" onClick={() => onRemove(index)}>
            ×
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
      <div className="col-span-4">
        <Input
          label={t('description')}
          value={item.description}
          onChange={(e) => onUpdate(index, 'description', e.target.value)}
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          label={t('quantity')}
          value={item.quantity}
          onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          label={t('unitPrice')}
          value={item.unitPrice}
          onChange={(e) => onUpdate(index, 'unitPrice', parseFloat(e.target.value) || 0)}
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          label={t('vat')}
          value={item.vat || 0}
          onChange={(e) => onUpdate(index, 'vat', parseFloat(e.target.value) || 0)}
        />
      </div>
      <div className="col-span-1">
        <div className="text-sm font-medium pt-6">{formatCurrency(item.total, currency)}</div>
      </div>
      <div className="col-span-1">
        <Button type="button" variant="danger" size="sm" onClick={() => onRemove(index)}>
          ×
        </Button>
      </div>
    </div>
  );
}





