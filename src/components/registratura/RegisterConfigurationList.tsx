'use client';

import React, { useState, useEffect } from 'react';
import { useRegisterConfigurations, RegisterConfiguration } from '@/hooks/useRegisterConfigurations';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { RegisterConfigurationForm } from './RegisterConfigurationForm';
import { useCreateRegisterConfiguration, useUpdateRegisterConfiguration, useDeleteRegisterConfiguration, useCreateRegistersForParishes } from '@/hooks/useRegisterConfigurations';
import { useTranslations } from 'next-intl';

interface RegisterConfigurationListProps {
  onConfigurationClick?: (config: RegisterConfiguration) => void;
}

export function RegisterConfigurationList({ onConfigurationClick }: RegisterConfigurationListProps) {
  const tReg = useTranslations('registratura');
  const t = useTranslations('common');
  const { registerConfigurations, loading, error, fetchRegisterConfigurations } = useRegisterConfigurations();
  const { createRegisterConfiguration, loading: creating } = useCreateRegisterConfiguration();
  const { updateRegisterConfiguration, loading: updating } = useUpdateRegisterConfiguration();
  const { deleteRegisterConfiguration, loading: deleting } = useDeleteRegisterConfiguration();
  const { createRegistersForParishes, loading: creatingForParishes } = useCreateRegistersForParishes();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<RegisterConfiguration | null>(null);
  const [copyingConfig, setCopyingConfig] = useState<RegisterConfiguration | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<RegisterConfiguration | null>(null);
  const [creationResult, setCreationResult] = useState<{ created: number; registers: any[] } | null>(null);

  useEffect(() => {
    fetchRegisterConfigurations();
  }, [fetchRegisterConfigurations]);

  const handleCreate = async (data: {
    name: string;
    parishId?: string | null;
    resetsAnnually: boolean;
    startingNumber: number;
    notes?: string | null;
  }) => {
    const result = await createRegisterConfiguration(data);
    if (result) {
      setShowCreateModal(false);
      fetchRegisterConfigurations();
    }
  };

  const handleCopy = async (data: {
    name: string;
    parishId?: string | null;
    resetsAnnually: boolean;
    startingNumber: number;
    notes?: string | null;
  }) => {
    const result = await createRegisterConfiguration(data);
    if (result) {
      setCopyingConfig(null);
      fetchRegisterConfigurations();
    }
  };

  const handleUpdate = async (data: {
    name: string;
    parishId?: string | null;
    resetsAnnually: boolean;
    startingNumber: number;
    notes?: string | null;
  }) => {
    if (!editingConfig) return;
    const result = await updateRegisterConfiguration(editingConfig.id, data);
    if (result) {
      setEditingConfig(null);
      fetchRegisterConfigurations();
    }
  };

  const handleDelete = async () => {
    if (!deletingConfig) return;
    const success = await deleteRegisterConfiguration(deletingConfig.id);
    if (success) {
      setDeletingConfig(null);
      fetchRegisterConfigurations();
    }
  };

  const handleCreateForParishes = async () => {
    const result = await createRegistersForParishes();
    if (result) {
      setCreationResult(result);
      fetchRegisterConfigurations();
      // Clear the result after 5 seconds
      setTimeout(() => setCreationResult(null), 5000);
    }
  };

  const columns = [
    { key: 'name', label: tReg('registerConfigurations.name') },
    { key: 'parish', label: tReg('registerConfigurations.parish') },
    { 
      key: 'resetsAnnually', 
      label: tReg('registerConfigurations.resetsAnnually'),
      render: (value: boolean) => value ? (
        <Badge variant="success">{tReg('registerConfigurations.yes')}</Badge>
      ) : (
        <Badge variant="info">{tReg('registerConfigurations.no')}</Badge>
      )
    },
    { key: 'startingNumber', label: tReg('registerConfigurations.startingNumber') },
    { 
      key: 'actions', 
      label: tReg('registerConfigurations.actions'),
      render: (_value: any, row: any) => {
        const config = registerConfigurations.find(c => c.id === row.id);
        if (!config) return null;
        return (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditingConfig(config)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('edit')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCopyingConfig(config)}
              title={tReg('registerConfigurations.copyConfiguration')}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {tReg('registerConfigurations.copy')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeletingConfig(config)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('delete')}
            </Button>
          </div>
        );
      }
    },
  ];

  const rows = (registerConfigurations ?? []).map((config) => ({
    id: config.id,
    name: config.name,
    parish: config.parish ? `${config.parish.name} (${config.parish.code})` : tReg('registerConfigurations.none'),
    resetsAnnually: config.resetsAnnually,
    startingNumber: config.startingNumber,
    actions: config.id, // Just store the ID, render function will handle the display
  }));

  if (loading) {
    return <div className="text-center py-8">{tReg('loading')}</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{tReg('registerConfigurations.error')}: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{tReg('registerConfigurations.title')}</h2>
        <div className="flex gap-2">
          <Button 
            variant="secondary"
            onClick={handleCreateForParishes}
            disabled={creatingForParishes}
          >
            {creatingForParishes ? tReg('registerConfigurations.creatingRegisters') : tReg('registerConfigurations.addRegistersForParishes')}
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            {tReg('registerConfigurations.addConfiguration')}
          </Button>
        </div>
      </div>

      {creationResult && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800 font-medium">
            {tReg('registerConfigurations.registersCreated', { count: creationResult.created })}
          </p>
          <ul className="mt-2 list-disc list-inside text-sm text-green-700">
            {creationResult.registers.map((reg) => (
              <li key={reg.id}>
                {reg.name} - {reg.parishName} ({reg.parishCode})
              </li>
            ))}
          </ul>
        </div>
      )}

      <Table columns={columns} data={rows} />

      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={tReg('registerConfigurations.addConfiguration')}
        >
          <RegisterConfigurationForm
            onSave={handleCreate}
            onCancel={() => setShowCreateModal(false)}
            loading={creating}
          />
        </Modal>
      )}

      {editingConfig && (
        <Modal
          isOpen={!!editingConfig}
          onClose={() => setEditingConfig(null)}
          title={tReg('registerConfigurations.editConfiguration')}
        >
          <RegisterConfigurationForm
            registerConfiguration={editingConfig}
            onSave={handleUpdate}
            onCancel={() => setEditingConfig(null)}
            loading={updating}
          />
        </Modal>
      )}

      {copyingConfig && (
        <Modal
          isOpen={!!copyingConfig}
          onClose={() => setCopyingConfig(null)}
          title={tReg('registerConfigurations.copyConfiguration')}
        >
          <RegisterConfigurationForm
            registerConfiguration={copyingConfig}
            onSave={handleCopy}
            onCancel={() => setCopyingConfig(null)}
            loading={creating}
            isCopy={true}
          />
        </Modal>
      )}

      {deletingConfig && (
        <Modal
          isOpen={!!deletingConfig}
          onClose={() => setDeletingConfig(null)}
          title={tReg('registerConfigurations.deleteConfiguration')}
        >
          <div className="space-y-4">
            <p>
              {tReg('registerConfigurations.deleteConfirm', { name: deletingConfig.name })}
            </p>
            <p className="text-sm text-gray-500">
              {tReg('registerConfigurations.deleteWarning')}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setDeletingConfig(null)}
                disabled={deleting}
              >
                {tReg('registerConfigurations.cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? tReg('registerConfigurations.deleting') : tReg('registerConfigurations.delete')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

