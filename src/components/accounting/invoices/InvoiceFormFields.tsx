import { useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { ClientSelect } from '@/components/ui/ClientSelect';
import { Parish } from '@/hooks/useParishes';
import { Client } from '@/hooks/useClients';
import { Warehouse } from '@/hooks/useWarehouses';
import { generateInvoiceNumber, calculateNextNumber } from '@/lib/utils/invoiceUtils';

const INVOICE_STATUS_OPTIONS = [
  { value: 'draft', labelKey: 'draft' },
  { value: 'sent', labelKey: 'sent' },
  { value: 'paid', labelKey: 'paid' },
  { value: 'overdue', labelKey: 'overdue' },
  { value: 'cancelled', labelKey: 'cancelled' },
] as const;

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
  invoiceType: 'issued' | 'received';
  parishes: Parish[];
  warehouses: Warehouse[];
  clients: Client[];
  t: (key: string) => string;
}

export function InvoiceFormFields({
  formData,
  onFormDataChange,
  onWarehouseChange,
  invoiceType,
  parishes,
  warehouses,
  clients,
  t,
}: InvoiceFormFieldsProps) {
  const handleSeriesChange = useCallback(async (series: string) => {
    const nextNumber = await calculateNextNumber(
      formData.parishId,
      series.toUpperCase(),
      invoiceType,
      formData.warehouseId || undefined
    );
    onFormDataChange({
      series: series.toUpperCase(),
      number: nextNumber || formData.number,
    });
  }, [formData.parishId, formData.warehouseId, formData.number, invoiceType, onFormDataChange]);

  const handleWarehouseChange = useCallback(async (warehouseId: string) => {
    const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);
    const newSeries = selectedWarehouse?.invoiceSeries || formData.series || 'INV';
    const nextNumber = await calculateNextNumber(
      formData.parishId,
      newSeries,
      invoiceType,
      warehouseId || undefined
    );
    onFormDataChange({
      warehouseId,
      series: newSeries,
      number: nextNumber || formData.number,
    });
    onWarehouseChange?.(warehouseId);
  }, [warehouses, formData.parishId, formData.series, formData.number, invoiceType, onFormDataChange, onWarehouseChange]);

  const handleParishChange = useCallback((parishId: string) => {
    onFormDataChange({ parishId, warehouseId: '' });
  }, [onFormDataChange]);

  const filteredWarehouses = useMemo(() => 
    warehouses.filter((w) => w.parishId === formData.parishId),
    [warehouses, formData.parishId]
  );

  const statusOptions = useMemo(() =>
    INVOICE_STATUS_OPTIONS.map(({ value, labelKey }) => ({
      value,
      label: t(labelKey),
    })),
    [t]
  );

  return (
    <>
      {/* Informații organizaționale */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase">{t('organizationalInfo') || 'Informații Organizaționale'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('parish')} *</label>
            <select
              value={formData.parishId}
              onChange={(e) => handleParishChange(e.target.value)}
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
            <label className="block text-sm font-medium mb-1">{t('warehouse')} *</label>
            <select
              value={formData.warehouseId}
              onChange={(e) => handleWarehouseChange(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              disabled={!formData.parishId}
              required
            >
              <option value="">{t('selectWarehouse') || 'Select Warehouse'}</option>
              {filteredWarehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Număr factură */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase">{t('invoiceNumber') || 'Număr Factură'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="lg:col-span-2">
            <Input
              label={t('invoiceNumber')}
              value={generateInvoiceNumber(formData.series, formData.number)}
              disabled
              className="bg-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Date și client */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase">{t('datesAndClient') || 'Date și Client'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <Input
            label={t('currency')}
            value={formData.currency}
            onChange={(e) => onFormDataChange({ currency: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* Descriere și status */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase">{t('additionalInfo') || 'Informații Adiționale'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label={t('description')}
              value={formData.description}
              onChange={(e) => onFormDataChange({ description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('status')}</label>
            <select
              value={formData.status}
              onChange={(e) => onFormDataChange({ 
                status: e.target.value as InvoiceFormData['status'] 
              })}
              className="w-full px-3 py-2 border rounded"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  );
}


