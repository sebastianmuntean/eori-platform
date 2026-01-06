'use client';

import { Input } from '@/components/ui/Input';
import { PageContainer } from '@/components/ui/PageContainer';
import { Select } from '@/components/ui/Select';
import { useTranslations } from 'next-intl';
import { FIXED_ASSET_STATUS } from '@/lib/fixed-assets/constants';
import { getCategoryOptions } from '@/lib/fixed-assets/helpers';
import { FixedAssetCategory } from '@/lib/fixed-assets/constants';

export interface FixedAssetFormData {
  parishId: string;
  inventoryNumber: string;
  name: string;
  description: string;
  category: string;
  type: string;
  location: string;
  acquisitionDate: string;
  acquisitionValue: string;
  currentValue: string;
  depreciationMethod: string;
  usefulLifeYears: string;
  status: 'active' | 'inactive' | 'disposed' | 'damaged';
  disposalDate: string;
  disposalValue: string;
  disposalReason: string;
  notes: string;
}

interface FixedAssetFormProps {
  formData: FixedAssetFormData;
  onChange: (data: Partial<FixedAssetFormData>) => void;
  parishes: Array<{ id: string; name: string }>;
  defaultCategory?: FixedAssetCategory;
  showCategory?: boolean;
  errors?: Record<string, string>;
}

/**
 * Form section component for better organization
 */
function FormSection({ 
  title, 
  children 
}: { 
  title: string; 
  children: React.ReactNode 
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary border-b border-border pb-2">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );
}

/**
 * Reusable form component for fixed assets with multi-column layout
 * Organized into logical sections for better UX
 */
export function FixedAssetForm({
  formData,
  onChange,
  parishes,
  defaultCategory,
  showCategory = true,
  errors = {},
}: FixedAssetFormProps) {
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

  const handleFieldChange = (field: keyof FixedAssetFormData, value: string) => {
    onChange({ [field]: value });
  };

  const statusOptions = [
    { value: FIXED_ASSET_STATUS.ACTIVE, label: t('active') || 'Active' },
    { value: FIXED_ASSET_STATUS.INACTIVE, label: t('inactive') || 'Inactive' },
    { value: FIXED_ASSET_STATUS.DISPOSED, label: t('disposed') || 'Disposed' },
    { value: FIXED_ASSET_STATUS.DAMAGED, label: t('damaged') || 'Damaged' },
  ];

  return (
    <PageContainer>
      {/* Basic Information Section */}
      <FormSection title={t('basicInformation') || 'Basic Information'}>
        <div className="md:col-span-2 lg:col-span-3">
          <Select
            label={t('selectParish') || 'Select Parish'}
            value={formData.parishId}
            onChange={(e) => handleFieldChange('parishId', e.target.value)}
            options={parishes.map(p => ({ value: p.id, label: p.name }))}
            required
            error={errors.parishId}
          />
        </div>
        <Input
          label={t('inventoryNumber') || 'Inventory Number'}
          value={formData.inventoryNumber}
          onChange={(e) => handleFieldChange('inventoryNumber', e.target.value)}
          required
          error={errors.inventoryNumber}
          maxLength={50}
        />
        <Input
          label={t('name') || 'Name'}
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          required
          error={errors.name}
          maxLength={255}
        />
        {showCategory && (
          <Select
            label={t('category') || 'Category'}
            value={formData.category}
            onChange={(e) => handleFieldChange('category', e.target.value)}
            options={getCategoryOptions(tMenu)}
            error={errors.category}
          />
        )}
        <Input
          label={t('type') || 'Type'}
          value={formData.type}
          onChange={(e) => handleFieldChange('type', e.target.value)}
          error={errors.type}
          maxLength={100}
        />
        <Input
          label={t('location') || 'Location'}
          value={formData.location}
          onChange={(e) => handleFieldChange('location', e.target.value)}
          error={errors.location}
          maxLength={255}
        />
        <div className="md:col-span-2 lg:col-span-3">
          <Input
            label={t('description') || 'Description'}
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            error={errors.description}
          />
        </div>
      </FormSection>

      {/* Acquisition Information Section */}
      <FormSection title={t('acquisitionInformation') || 'Acquisition Information'}>
        <Input
          label={t('acquisitionDate') || 'Acquisition Date'}
          type="date"
          value={formData.acquisitionDate}
          onChange={(e) => handleFieldChange('acquisitionDate', e.target.value)}
          error={errors.acquisitionDate}
        />
        <Input
          label={t('acquisitionValue') || 'Acquisition Value'}
          type="number"
          step="0.01"
          min="0"
          value={formData.acquisitionValue}
          onChange={(e) => handleFieldChange('acquisitionValue', e.target.value)}
          error={errors.acquisitionValue}
        />
        <Input
          label={t('currentValue') || 'Current Value'}
          type="number"
          step="0.01"
          min="0"
          value={formData.currentValue}
          onChange={(e) => handleFieldChange('currentValue', e.target.value)}
          error={errors.currentValue}
        />
      </FormSection>

      {/* Depreciation Information Section */}
      <FormSection title={t('depreciationInformation') || 'Depreciation Information'}>
        <Input
          label={t('depreciationMethod') || 'Depreciation Method'}
          value={formData.depreciationMethod}
          onChange={(e) => handleFieldChange('depreciationMethod', e.target.value)}
          error={errors.depreciationMethod}
          maxLength={20}
        />
        <Input
          label={t('usefulLifeYears') || 'Useful Life (Years)'}
          type="number"
          min="1"
          value={formData.usefulLifeYears}
          onChange={(e) => handleFieldChange('usefulLifeYears', e.target.value)}
          error={errors.usefulLifeYears}
        />
        <Select
          label={t('status') || 'Status'}
          value={formData.status}
          onChange={(e) => {
            const value = e.target.value;
            if (['active', 'inactive', 'disposed', 'damaged'].includes(value)) {
              handleFieldChange('status', value as FixedAssetFormData['status']);
            }
          }}
          options={statusOptions}
          error={errors.status}
        />
      </FormSection>

      {/* Disposal Information Section */}
      <FormSection title={t('disposalInformation') || 'Disposal Information'}>
        <Input
          label={t('disposalDate') || 'Disposal Date'}
          type="date"
          value={formData.disposalDate}
          onChange={(e) => handleFieldChange('disposalDate', e.target.value)}
          error={errors.disposalDate}
        />
        <Input
          label={t('disposalValue') || 'Disposal Value'}
          type="number"
          step="0.01"
          min="0"
          value={formData.disposalValue}
          onChange={(e) => handleFieldChange('disposalValue', e.target.value)}
          error={errors.disposalValue}
        />
        <div className="md:col-span-2 lg:col-span-3">
          <Input
            label={t('disposalReason') || 'Disposal Reason'}
            value={formData.disposalReason}
            onChange={(e) => handleFieldChange('disposalReason', e.target.value)}
            error={errors.disposalReason}
          />
        </div>
      </FormSection>

      {/* Additional Notes Section */}
      <FormSection title={t('additionalNotes') || 'Additional Notes'}>
        <div className="md:col-span-2 lg:col-span-3">
          <Input
            label={t('notes') || 'Notes'}
            value={formData.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            error={errors.notes}
          />
        </div>
      </FormSection>
    </PageContainer>
  );
}

