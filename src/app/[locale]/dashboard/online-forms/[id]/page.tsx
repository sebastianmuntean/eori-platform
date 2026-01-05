'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { useOnlineForm, useOnlineForms } from '@/hooks/useOnlineForms';
import { useFormFields, FormField } from '@/hooks/useFormFields';
import { useFormMappings, FormFieldMapping } from '@/hooks/useFormMappings';
import { FormFieldEditor } from '@/components/online-forms/FormFieldEditor';
import { FieldMappingEditor } from '@/components/online-forms/FieldMappingEditor';
import { FormPreview } from '@/components/online-forms/FormPreview';
import { useMappingDatasets } from '@/hooks/useMappingDatasets';
import { Modal } from '@/components/ui/Modal';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ONLINE_FORMS_PERMISSIONS } from '@/lib/permissions/onlineForms';

type TabType = 'config' | 'fields' | 'mappings' | 'preview';

export default function EditOnlineFormPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tForms = useTranslations('online-forms');
  const tMenu = useTranslations('menu');

  // Check permission to view online forms
  const { loading: permissionLoading } = useRequirePermission(ONLINE_FORMS_PERMISSIONS.VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return null;
  }

  const { form, fetchForm } = useOnlineForm();
  usePageTitle(form?.name || tMenu('onlineForms'));
  const { updateForm } = useOnlineForms();
  const { fields, fetchFields, createField, updateField, deleteField } = useFormFields();
  const { mappings, fetchMappings, createMapping, updateMapping, deleteMapping } = useFormMappings();
  const { datasets, fetchDatasets, applyDataset } = useMappingDatasets();

  const [activeTab, setActiveTab] = useState<TabType>('config');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    emailValidationMode: 'end' as 'start' | 'end',
    submissionFlow: 'review' as 'direct' | 'review',
    targetModule: 'registratura' as 'registratura' | 'general_register' | 'events' | 'partners',
    successMessage: '',
    errorMessage: '',
  });

  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [showMappingEditor, setShowMappingEditor] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<FormFieldMapping | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchForm(id);
    }
  }, [id, fetchForm]);

  useEffect(() => {
    if (form) {
      fetchDatasets({
        targetModule: form.targetModule,
      });
    }
  }, [form, fetchDatasets]);

  useEffect(() => {
    if (form) {
      setFormData({
        name: form.name,
        description: form.description || '',
        isActive: form.isActive,
        emailValidationMode: form.emailValidationMode,
        submissionFlow: form.submissionFlow,
        targetModule: form.targetModule,
        successMessage: form.successMessage || '',
        errorMessage: form.errorMessage || '',
      });
      fetchFields(form.id);
      fetchMappings(form.id);
    }
  }, [form, fetchFields, fetchMappings]);

  const handleSaveConfig = async () => {
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: t('required') });
      return;
    }

    setLoading(true);
    try {
      await updateForm(id, {
        ...formData,
        description: formData.description || null,
        successMessage: formData.successMessage || null,
        errorMessage: formData.errorMessage || null,
      });
      await fetchForm(id);
    } catch (err) {
      console.error('Error updating form:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = () => {
    setSelectedField(null);
    setShowFieldEditor(true);
  };

  const handleEditField = (field: FormField) => {
    setSelectedField(field);
    setShowFieldEditor(true);
  };

  const handleSaveField = async (fieldData: Partial<FormField>) => {
    if (selectedField) {
      await updateField(id, selectedField.id, fieldData);
    } else {
      await createField(id, fieldData);
    }
    await fetchFields(id);
    setShowFieldEditor(false);
    setSelectedField(null);
  };

  const handleDeleteField = async (fieldId: string) => {
    if (confirm(t('confirmDelete') || 'Are you sure?')) {
      await deleteField(id, fieldId);
      await fetchFields(id);
    }
  };

  const handleAddMapping = () => {
    setSelectedMapping(null);
    setShowMappingEditor(true);
  };

  const handleEditMapping = (mapping: FormFieldMapping) => {
    setSelectedMapping(mapping);
    setShowMappingEditor(true);
  };

  const handleSaveMapping = async (mappingData: Partial<FormFieldMapping>) => {
    if (selectedMapping) {
      await updateMapping(id, selectedMapping.id, mappingData);
    } else {
      await createMapping(id, mappingData);
    }
    await fetchMappings(id);
    setShowMappingEditor(false);
    setSelectedMapping(null);
  };

  const handleDeleteMapping = async (mappingId: string) => {
    if (confirm(t('confirmDelete') || 'Are you sure?')) {
      await deleteMapping(id, mappingId);
      await fetchMappings(id);
    }
  };

  const handleApplyTemplate = () => {
    setShowTemplateModal(true);
  };

  const handleConfirmApplyTemplate = async () => {
    if (!selectedTemplateId || !form) return;

    try {
      await applyDataset(selectedTemplateId, form.id, replaceExisting);
      await fetchMappings(form.id);
      setShowTemplateModal(false);
      setSelectedTemplateId('');
    } catch (error) {
      console.error('Error applying template:', error);
    }
  };

  const availableFieldKeys = fields.map(f => f.fieldKey);

  const tabs = [
    { id: 'config' as TabType, label: t('settings') },
    { id: 'fields' as TabType, label: tForms('fields') },
    { id: 'mappings' as TabType, label: tForms('mappings') },
    { id: 'preview' as TabType, label: t('preview') },
  ];

  if (!form) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tForms('onlineForms'), href: `/${locale}/dashboard/online-forms` },
          { label: form.name },
        ]}
      />

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'config' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">{t('settings')}</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Input
                label={`${tForms('formName')} *`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                error={errors.name}
              />

              <div>
                <label className="block text-sm font-medium mb-1">{tForms('formDescription')}</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-md bg-bg-primary text-text-primary"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label={tForms('emailValidationMode')}
                  value={formData.emailValidationMode}
                  onChange={(e) => setFormData({ ...formData, emailValidationMode: e.target.value as 'start' | 'end' })}
                  options={[
                    { value: 'start', label: tForms('emailValidationModeStart') },
                    { value: 'end', label: tForms('emailValidationModeEnd') },
                  ]}
                />

                <Select
                  label={tForms('submissionFlow')}
                  value={formData.submissionFlow}
                  onChange={(e) => setFormData({ ...formData, submissionFlow: e.target.value as 'direct' | 'review' })}
                  options={[
                    { value: 'direct', label: tForms('submissionFlowDirect') },
                    { value: 'review', label: tForms('submissionFlowReview') },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{tForms('successMessage')}</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-md bg-bg-primary text-text-primary"
                  value={formData.successMessage}
                  onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{tForms('errorMessage')}</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-md bg-bg-primary text-text-primary"
                  value={formData.errorMessage}
                  onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm">
                  {tForms('isActive')}
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button onClick={handleSaveConfig} disabled={loading}>
                  {loading ? t('loading') : t('save')}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'fields' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">{tForms('fields')}</h2>
              <Button onClick={handleAddField}>{tForms('addField')}</Button>
            </div>
          </CardHeader>
          <CardBody>
            {fields.length === 0 ? (
              <div className="text-center py-8">{tForms('noFields')}</div>
            ) : (
              <Table
                columns={[
                  { key: 'orderIndex', label: tForms('orderIndex') },
                  { key: 'fieldKey', label: tForms('fieldKey') },
                  { key: 'label', label: tForms('fieldLabel') },
                  { key: 'fieldType', label: tForms('fieldType') },
                  { key: 'isRequired', label: tForms('isRequired') },
                  {
                    key: 'actions',
                    label: t('actions'),
                    render: (value: any) => value,
                  },
                ]}
                data={fields
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((field) => ({
                    id: field.id,
                    orderIndex: field.orderIndex,
                    fieldKey: field.fieldKey,
                    label: field.label,
                    fieldType: field.fieldType,
                    isRequired: field.isRequired ? t('yes') : t('no'),
                    actions: (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEditField(field)}>
                          {t('edit')}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteField(field.id)}
                        >
                          {t('delete')}
                        </Button>
                      </div>
                    ),
                  }))}
              />
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'mappings' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">{tForms('mappings')}</h2>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleApplyTemplate}>
                  {tForms('applyTemplate')}
                </Button>
                <Button onClick={handleAddMapping}>{tForms('addMapping')}</Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {mappings.length === 0 ? (
              <div className="text-center py-8">{tForms('noMappings')}</div>
            ) : (
              <Table
                columns={[
                  { key: 'fieldKey', label: tForms('fieldKey') },
                  { key: 'targetTable', label: tForms('targetTable') },
                  { key: 'targetColumn', label: tForms('targetColumn') },
                  { key: 'actions', label: t('actions') },
                ]}
                data={mappings.map((mapping) => ({
                  id: mapping.id,
                  fieldKey: mapping.fieldKey,
                  targetTable: mapping.targetTable,
                  targetColumn: mapping.targetColumn,
                  actions: (
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEditMapping(mapping)}>
                        {t('edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteMapping(mapping.id)}
                      >
                        {t('delete')}
                      </Button>
                    </div>
                  ),
                }))}
              />
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'preview' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">{t('preview')}</h2>
          </CardHeader>
          <CardBody>
            <FormPreview
              fields={fields}
              formName={form.name}
              formDescription={form.description}
              readOnly={false}
            />
          </CardBody>
        </Card>
      )}

      {/* Modals */}
      <FormFieldEditor
        isOpen={showFieldEditor}
        onClose={() => {
          setShowFieldEditor(false);
          setSelectedField(null);
        }}
        onSave={handleSaveField}
        field={selectedField}
        existingFieldKeys={selectedField ? [] : availableFieldKeys}
      />

      <FieldMappingEditor
        isOpen={showMappingEditor}
        onClose={() => {
          setShowMappingEditor(false);
          setSelectedMapping(null);
        }}
        onSave={handleSaveMapping}
        mapping={selectedMapping}
        targetModule={form.targetModule}
        availableFieldKeys={availableFieldKeys}
      />

      {/* Apply Template Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setSelectedTemplateId('');
        }}
        title={tForms('applyTemplate')}
      >
        <div className="space-y-4">
          <Select
            label={tForms('selectTemplate')}
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            options={[
              { value: '', label: '-- Selectează template --' },
              ...datasets.map((d: any) => ({
                value: d.id,
                label: `${d.name} (${d.mappings?.length || 0} mapări)`,
              })),
            ]}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="replaceExisting"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="replaceExisting" className="text-sm">
              {tForms('replaceExistingMappings')}
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowTemplateModal(false);
                setSelectedTemplateId('');
              }}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleConfirmApplyTemplate} disabled={!selectedTemplateId}>
              {tForms('applyTemplate')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

