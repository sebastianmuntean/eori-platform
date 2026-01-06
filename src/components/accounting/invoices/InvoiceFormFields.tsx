import { Input } from '@/components/ui/Input';
import { ClientSelect } from '@/components/ui/ClientSelect';
import { Parish } from '@/hooks/useParishes';
import { Client } from '@/hooks/useClients';
import { Warehouse } from '@/hooks/useWarehouses';
import { generateInvoiceNumber, calculateNextNumber } from '@/lib/utils/invoiceUtils';

export interface InvoiceFormData {
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
}

interface InvoiceFormFieldsProps {
  formData: InvoiceFormData;
  onFormDataChange: (data: Partial<InvoiceFormData>) => void;
  onWarehouseChange?: (warehouseId: string) => void;
  onTypeChange?: (type: 'issued' | 'received') => void;
  parishes: Parish[];
  warehouses: Warehouse[];
  clients: Client[];
  t: (key: string) => string;
}

export function InvoiceFormFields({
  formData,
  onFormDataChange,
  onWarehouseChange,
  onTypeChange,
  parishes,
  warehouses,
  clients,
  t,
}: InvoiceFormFieldsProps) {
  const handleSeriesChange = async (series: string) => {
    const nextNumber = await calculateNextNumber(
      formData.parishId,
      series.toUpperCase(),
      formData.type,
      formData.warehouseId || undefined
    );
    onFormDataChange({
      series: series.toUpperCase(),
      number: nextNumber || formData.number,
    });
  };

  const handleTypeChange = async (type: 'issued' | 'received') => {
    const nextNumber = await calculateNextNumber(
      formData.parishId,
      formData.series,
      type,
      formData.warehouseId || undefined
    );
    onFormDataChange({
      type,
      number: nextNumber || formData.number,
    });
    onTypeChange?.(type);
  };

  const handleWarehouseChange = async (warehouseId: string) => {
    const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);
    const newSeries = selectedWarehouse?.invoiceSeries || formData.series || 'INV';
    const nextNumber = await calculateNextNumber(
      formData.parishId,
      newSeries,
      formData.type,
      warehouseId || undefined
    );
    onFormDataChange({
      warehouseId,
      series: newSeries,
      number: nextNumber || formData.number,
    });
    onWarehouseChange?.(warehouseId);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('parish')} *</label>
          <select
            value={formData.parishId}
            onChange={(e) => {
              onFormDataChange({ parishId: e.target.value, warehouseId: '' });
            }}
            className="w-full px-3 py-2 border rounded"
            required
          >
            <option value="">{t('selectParish')}</option>
            {parishes.map((parish) => (
              <option key={parish.id} value={parish.id}>
                {parish.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('warehouse')}</label>
          <select
            value={formData.warehouseId}
            onChange={(e) => handleWarehouseChange(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            disabled={!formData.parishId}
          >
            <option value="">{t('selectWarehouse') || 'Select Warehouse'}</option>
            {warehouses
              .filter((w) => w.parishId === formData.parishId)
              .map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
          </select>
        </div>
        <Input
          label={`${t('series') || 'Serie'} *`}
          value={formData.series}
          onChange={async (e) => await handleSeriesChange(e.target.value)}
          required
          placeholder="INV"
        />
        <Input
          type="number"
          label={`${t('number') || 'Număr'} *`}
          value={formData.number || ''}
          onChange={(e) =>
            onFormDataChange({ number: e.target.value ? parseInt(e.target.value) : undefined })
          }
          required
        />
        <Input
          label={t('invoiceNumber')}
          value={generateInvoiceNumber(formData.series, formData.number)}
          disabled
          className="bg-gray-100"
        />
        <div>
          <label className="block text-sm font-medium mb-1">{t('invoiceType')} *</label>
          <select
            value={formData.type}
            onChange={(e) => handleTypeChange(e.target.value as 'issued' | 'received')}
            className="w-full px-3 py-2 border rounded"
            required
          >
            <option value="issued">{t('issued')}</option>
            <option value="received">{t('received')}</option>
          </select>
        </div>
        <Input
          type="date"
          label={`${t('date')} *`}
          value={formData.date}
          onChange={(e) => onFormDataChange({ date: e.target.value })}
          required
        />
        <Input
          type="date"
          label={`${t('dueDate')} *`}
          value={formData.dueDate}
          onChange={(e) => onFormDataChange({ dueDate: e.target.value })}
          required
        />
        <ClientSelect
          value={formData.clientId}
          onChange={(value) => {
            const clientId = Array.isArray(value) ? value[0] || '' : value;
            onFormDataChange({ clientId });
          }}
          clients={clients}
          onlyCompanies={true}
          required
          label={t('clients')}
        />
        <Input
          label={t('currency')}
          value={formData.currency}
          onChange={(e) => onFormDataChange({ currency: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('description')}
          value={formData.description}
          onChange={(e) => onFormDataChange({ description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <div>
          <label className="block text-sm font-medium mb-1">{t('status')}</label>
          <select
            value={formData.status}
            onChange={(e) => onFormDataChange({ status: e.target.value as any })}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="draft">{t('draft')}</option>
            <option value="sent">{t('sent')}</option>
            <option value="paid">{t('paid')}</option>
            <option value="overdue">{t('overdue')}</option>
            <option value="cancelled">{t('cancelled')}</option>
          </select>
        </div>
      </div>
    </>
  );
}


