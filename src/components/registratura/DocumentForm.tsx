'use client';

import React, { useState, useEffect } from 'react';
import { useDocuments, Document } from '@/hooks/useDocuments';
import { useParishes } from '@/hooks/useParishes';
import { useDepartments } from '@/hooks/useDepartments';
import { useClients } from '@/hooks/useClients';
import { useUsers } from '@/hooks/useUsers';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ClientSelect } from '@/components/ui/ClientSelect';
import { Button } from '@/components/ui/Button';
import { createDocumentSchema, updateDocumentSchema, CreateDocumentInput, UpdateDocumentInput } from '@/lib/validations/documents';
import { z } from 'zod';

interface DocumentFormProps {
  document?: Document | null;
  parishId?: string;
  onSave: (data: CreateDocumentInput | UpdateDocumentInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function DocumentForm({ document, parishId, onSave, onCancel, loading: externalLoading }: DocumentFormProps) {
  const { parishes, fetchParishes } = useParishes();
  const { departments, fetchDepartments } = useDepartments();
  const { clients, fetchClients } = useClients();
  const { users, fetchUsers } = useUsers();

  const [formData, setFormData] = useState<Partial<CreateDocumentInput>>({
    parishId: parishId || document?.parishId || '',
    documentType: document?.documentType || 'incoming',
    registrationDate: document?.registrationDate ? new Date(document.registrationDate).toISOString().split('T')[0] : '',
    externalNumber: document?.externalNumber || '',
    externalDate: document?.externalDate ? new Date(document.externalDate).toISOString().split('T')[0] : '',
    senderPartnerId: document?.senderPartnerId || '',
    senderName: document?.senderName || '',
    senderDocNumber: document?.senderDocNumber || '',
    senderDocDate: document?.senderDocDate ? new Date(document.senderDocDate).toISOString().split('T')[0] : '',
    recipientPartnerId: document?.recipientPartnerId || '',
    recipientName: document?.recipientName || '',
    subject: document?.subject || '',
    content: document?.content || '',
    priority: document?.priority || 'normal',
    status: document?.status || 'draft',
    departmentId: document?.departmentId || '',
    assignedTo: document?.assignedTo || '',
    dueDate: document?.dueDate ? new Date(document.dueDate).toISOString().split('T')[0] : '',
    fileIndex: document?.fileIndex || '',
    isSecret: document?.isSecret || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchParishes({ all: true });
    if (formData.parishId) {
      fetchDepartments({ parishId: formData.parishId, pageSize: 1000 });
    }
    fetchClients({ pageSize: 1000 });
    fetchUsers({ pageSize: 1000 });
  }, [formData.parishId, fetchParishes, fetchDepartments, fetchClients, fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Convert empty strings to null for nullable fields
      const cleanedData = { ...formData };
      const nullableFields = [
        'externalNumber',
        'externalDate',
        'senderPartnerId',
        'senderName',
        'senderDocNumber',
        'senderDocDate',
        'recipientPartnerId',
        'recipientName',
        'content',
        'departmentId',
        'assignedTo',
        'dueDate',
        'fileIndex',
        'parentDocumentId',
        'secretDeclassificationList',
      ];
      
      nullableFields.forEach((field) => {
        if (cleanedData[field as keyof typeof cleanedData] === '') {
          (cleanedData as any)[field] = null;
        }
      });

      const schema = document ? updateDocumentSchema : createDocumentSchema;
      const validation = schema.safeParse(cleanedData);

      if (!validation.success) {
        const newErrors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[String(err.path[0])] = err.message;
          }
        });
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      await onSave(validation.data);
    } catch (err) {
      console.error('Error saving document:', err);
      setLoading(false);
    }
  };

  const isIncoming = formData.documentType === 'incoming';
  const isOutgoing = formData.documentType === 'outgoing';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Parish */}
        <Select
          label="Parohie *"
          value={formData.parishId || ''}
          onChange={(e) => {
            setFormData({ ...formData, parishId: e.target.value, departmentId: '' });
          }}
          options={parishes.map(p => ({ value: p.id, label: p.name }))}
          placeholder="Selectează parohia"
          error={errors.parishId}
          required
        />

        {/* Document Type */}
        <Select
          label="Tip Document *"
          value={formData.documentType || ''}
          onChange={(e) => setFormData({ ...formData, documentType: e.target.value as any })}
          options={[
            { value: 'incoming', label: 'Intrare' },
            { value: 'outgoing', label: 'Ieșire' },
            { value: 'internal', label: 'Intern' },
          ]}
          error={errors.documentType}
          required
        />

        {/* Registration Date */}
        <Input
          label="Data Înregistrării"
          type="date"
          value={formData.registrationDate || ''}
          onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
          error={errors.registrationDate}
        />

        {/* External Number */}
        <Input
          label="Număr Extern"
          value={formData.externalNumber || ''}
          onChange={(e) => setFormData({ ...formData, externalNumber: e.target.value || null })}
          error={errors.externalNumber}
        />

        {/* External Date */}
        <Input
          label="Data Externă"
          type="date"
          value={formData.externalDate || ''}
          onChange={(e) => setFormData({ ...formData, externalDate: e.target.value || null })}
          error={errors.externalDate}
        />

        {/* Subject */}
        <div className="md:col-span-2 lg:col-span-3">
          <Input
            label="Subiect *"
            value={formData.subject || ''}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            error={errors.subject}
            required
          />
        </div>

        {/* Sender fields (for incoming) */}
        {isIncoming && (
          <>
            <ClientSelect
              label="Expeditor (Partener)"
              value={formData.senderPartnerId || ''}
              onChange={(value) => setFormData({ ...formData, senderPartnerId: value || null })}
              clients={clients}
              onlyCompanies={false}
              placeholder="Selectează partener"
            />
            <Input
              label="Nume Expeditor"
              value={formData.senderName || ''}
              onChange={(e) => setFormData({ ...formData, senderName: e.target.value || null })}
            />
            <Input
              label="Nr. Document Expeditor"
              value={formData.senderDocNumber || ''}
              onChange={(e) => setFormData({ ...formData, senderDocNumber: e.target.value || null })}
            />
            <Input
              label="Data Document Expeditor"
              type="date"
              value={formData.senderDocDate || ''}
              onChange={(e) => setFormData({ ...formData, senderDocDate: e.target.value || null })}
            />
          </>
        )}

        {/* Recipient fields (for outgoing) */}
        {isOutgoing && (
          <>
            <ClientSelect
              label="Destinatar (Partener)"
              value={formData.recipientPartnerId || ''}
              onChange={(value) => setFormData({ ...formData, recipientPartnerId: value || null })}
              clients={clients}
              onlyCompanies={false}
              placeholder="Selectează partener"
            />
            <Input
              label="Nume Destinatar"
              value={formData.recipientName || ''}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value || null })}
            />
          </>
        )}

        {/* Priority */}
        <Select
          label="Prioritate"
          value={formData.priority || 'normal'}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
          options={[
            { value: 'low', label: 'Scăzută' },
            { value: 'normal', label: 'Normală' },
            { value: 'high', label: 'Ridicată' },
            { value: 'urgent', label: 'Urgentă' },
          ]}
        />

        {/* Status */}
        <Select
          label="Status"
          value={formData.status || 'draft'}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          options={[
            { value: 'draft', label: 'Ciornă' },
            { value: 'registered', label: 'Înregistrat' },
            { value: 'in_work', label: 'În lucru' },
            { value: 'resolved', label: 'Rezolvat' },
            { value: 'archived', label: 'Arhivat' },
          ]}
        />

        {/* Department */}
        <Select
          label="Departament"
          value={formData.departmentId || ''}
          onChange={(e) => setFormData({ ...formData, departmentId: e.target.value || null })}
          options={departments
            .filter(d => d.parishId === formData.parishId)
            .map(d => ({ value: d.id, label: d.name }))}
          placeholder="Selectează departament"
          disabled={!formData.parishId}
        />

        {/* Assigned To */}
        <Select
          label="Atribuit Către"
          value={formData.assignedTo || ''}
          onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value || null })}
          options={users.map(u => ({ value: u.id, label: u.name || u.email }))}
          placeholder="Selectează utilizator"
        />

        {/* Due Date */}
        <Input
          label="Termen Limita"
          type="date"
          value={formData.dueDate || ''}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value || null })}
        />

        {/* File Index */}
        <Input
          label="Indicativ Arhivare"
          value={formData.fileIndex || ''}
          onChange={(e) => setFormData({ ...formData, fileIndex: e.target.value || null })}
        />

        {/* Is Secret */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isSecret"
            checked={formData.isSecret || false}
            onChange={(e) => setFormData({ ...formData, isSecret: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="isSecret" className="text-sm font-medium">
            Document Secret
          </label>
        </div>
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium mb-1">Conținut</label>
        <textarea
          value={formData.content || ''}
          onChange={(e) => setFormData({ ...formData, content: e.target.value || null })}
          rows={6}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-bg-primary text-text-primary"
        />
        {errors.content && (
          <p className="mt-1 text-sm text-danger">{errors.content}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Anulează
        </Button>
        <Button type="submit" variant="primary" isLoading={loading || externalLoading}>
          {document ? 'Actualizează' : 'Creează'} Document
        </Button>
      </div>
    </form>
  );
}

