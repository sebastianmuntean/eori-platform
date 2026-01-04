'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRegisterConfigurations } from '@/hooks/useRegisterConfigurations';
import { useClients, Client } from '@/hooks/useClients';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ClientSelect } from '@/components/ui/ClientSelect';

interface GeneralRegisterFormProps {
  onSave: (data: {
    registerConfigurationId: string;
    documentType: 'incoming' | 'outgoing' | 'internal';
    subject: string;
    from?: string | null;
    petitionerClientId?: string | null;
    to?: string | null;
    description?: string | null;
    filePath?: string | null;
    status?: 'draft' | 'in_work' | 'distributed' | 'resolved' | 'cancelled';
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  initialData?: {
    registerConfigurationId?: string;
    documentType?: 'incoming' | 'outgoing' | 'internal';
    subject?: string;
    from?: string | null;
    petitionerClientId?: string | null;
    to?: string | null;
    description?: string | null;
    status?: 'draft' | 'in_work' | 'distributed' | 'resolved' | 'cancelled';
  };
}

export function GeneralRegisterForm({ onSave, onCancel, loading: externalLoading, initialData }: GeneralRegisterFormProps) {
  const { registerConfigurations, fetchRegisterConfigurations } = useRegisterConfigurations();
  const { clients, fetchClients, loading: clientsLoading } = useClients();
  const [selectedRegisterId, setSelectedRegisterId] = useState(initialData?.registerConfigurationId || '');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialData?.petitionerClientId || null);
  const [formData, setFormData] = useState({
    documentType: (initialData?.documentType || 'incoming') as 'incoming' | 'outgoing' | 'internal',
    subject: initialData?.subject || '',
    from: initialData?.from || '',
    to: initialData?.to || '',
    description: initialData?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [nextNumber, setNextNumber] = useState<number | null>(null);

  useEffect(() => {
    fetchRegisterConfigurations();
  }, [fetchRegisterConfigurations]);

  // Get selected register configuration
  const selectedRegister = registerConfigurations.find(r => r.id === selectedRegisterId);
  const currentDate = new Date().toLocaleDateString('ro-RO');
  const currentYear = new Date().getFullYear();

  // When register is selected, fetch next number preview (optional - can be done on save)
  useEffect(() => {
    if (selectedRegisterId) {
      // Preview would be shown, but actual number is generated on save
      setNextNumber(null); // Will be generated server-side
    }
  }, [selectedRegisterId]);

  // Fetch clients on mount (clients are system-wide, not parish-specific)
  useEffect(() => {
    fetchClients({
      pageSize: 100, // Fetch more clients for autocomplete
      sortBy: 'name', // Sort by Name (companyName or firstName + lastName)
      sortOrder: 'asc',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If initialData has a petitionerClientId, fetch the client and set the form field
  useEffect(() => {
    if (initialData?.petitionerClientId && clients.length > 0) {
      const client = clients.find(c => c.id === initialData.petitionerClientId);
      if (client) {
        const displayName = getClientDisplayName(client);
        setFormData(prev => ({ ...prev, from: displayName }));
      } else {
        // Client not in current list, try to fetch it
        fetch(`/api/clients/${initialData.petitionerClientId}`, {
          credentials: 'include',
        })
          .then(res => res.json())
          .then(result => {
            if (result.success && result.data) {
              const client = result.data as Client;
              const displayName = getClientDisplayName(client);
              setFormData(prev => ({ ...prev, from: displayName }));
              // Add to clients list if not already there
              if (!clients.find(c => c.id === client.id)) {
                fetchClients({ pageSize: 100 });
              }
            }
          })
          .catch(err => {
            console.error('Error fetching client for copy:', err);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.petitionerClientId, clients]);

  // Get detailed display name for client (used in ClientSelect)
  const getClientDisplayName = (client: Client): string => {
    const parts: string[] = [];
    
    // Add name or company name
    if (client.companyName) {
      parts.push(client.companyName);
    } else {
      const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim();
      if (fullName) {
        parts.push(fullName);
      }
    }
    
    // Add code
    if (client.code) {
      parts.push(`[${client.code}]`);
    }
    
    // Add CNP if available
    if (client.cnp) {
      parts.push(`CNP: ${client.cnp}`);
    }
    
    // Add CUI if available
    if (client.cui) {
      parts.push(`CUI: ${client.cui}`);
    }
    
    // Add city if available
    if (client.city) {
      parts.push(client.city);
    }
    
    // Add email if available
    if (client.email) {
      parts.push(client.email);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'Client fără nume';
  };

  // Debounce search to reduce API calls
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Memoize onSearch to prevent infinite loop with debouncing
  const handleSearch = useCallback((searchTerm: string) => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Only search if term is at least 3 characters
    if (searchTerm && searchTerm.length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchClients({
          search: searchTerm,
          pageSize: 50,
        });
      }, 300); // 300ms debounce
    }
  }, [fetchClients]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[GeneralRegisterForm] handleSubmit called');
    setErrors({});
    setLoading(true);

    try {
      // Validation
      if (!selectedRegisterId) {
        console.log('[GeneralRegisterForm] Validation failed: no register selected');
        setErrors({ registerConfigurationId: 'Selectați un registru' });
        setLoading(false);
        return;
      }

      if (!formData.subject.trim()) {
        console.log('[GeneralRegisterForm] Validation failed: no subject');
        setErrors({ subject: 'Subiectul este obligatoriu' });
        setLoading(false);
        return;
      }

      const saveData = {
        registerConfigurationId: selectedRegisterId,
        documentType: formData.documentType,
        subject: formData.subject.trim(),
        from: formData.from.trim() || null,
        petitionerClientId: selectedClientId || null,
        to: formData.to.trim() || null,
        description: formData.description.trim() || null,
        status: 'draft' as const,
      };

      console.log('[GeneralRegisterForm] Calling onSave with data:', {
        ...saveData,
        petitionerClientId: saveData.petitionerClientId || 'null',
      });

      await onSave(saveData);
      console.log('[GeneralRegisterForm] onSave completed successfully');
    } catch (err) {
      console.error('[GeneralRegisterForm] Error saving document:', err);
    } finally {
      setLoading(false);
      console.log('[GeneralRegisterForm] handleSubmit finished, loading set to false');
    }
  };

  const isIncoming = formData.documentType === 'incoming';
  const isOutgoing = formData.documentType === 'outgoing';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Register Configuration - Required */}
      <div>
        <Select
          label="Registru *"
          value={selectedRegisterId}
          onChange={(e) => {
            setSelectedRegisterId(e.target.value);
          }}
          options={registerConfigurations.map(r => ({
            value: r.id,
            label: `${r.name}${r.parish ? ` (${r.parish.name})` : ' (Episcopie)'}`
          }))}
          placeholder="Selectează registrul"
          error={errors.registerConfigurationId}
          required
        />
        {selectedRegister && (
          <p className="text-sm text-gray-500 mt-1">
            Parohie: {selectedRegister.parish ? `${selectedRegister.parish.name} (${selectedRegister.parish.code})` : 'Niciuna (Episcopie)'}
          </p>
        )}
      </div>

      {/* Auto-generated fields (read-only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
        <div>
          <label className="block text-sm font-medium text-gray-600">Data Documentului</label>
          <div className="mt-1 text-sm text-gray-900 font-medium">{currentDate}</div>
          <p className="text-xs text-gray-500 mt-1">Setată automat la data curentă</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Număr Înregistrare</label>
          <div className="mt-1 text-sm text-gray-900 font-medium">
            {selectedRegisterId ? 'Se va genera automat' : 'Selectați un registru'}
          </div>
          <p className="text-xs text-gray-500 mt-1">Generat automat la salvare</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Document Type */}
        <Select
          label="Tip Document *"
          value={formData.documentType}
          onChange={(e) => setFormData({ ...formData, documentType: e.target.value as 'incoming' | 'outgoing' | 'internal' })}
          options={[
            { value: 'incoming', label: 'Intrare' },
            { value: 'outgoing', label: 'Ieșire' },
            { value: 'internal', label: 'Intern' },
          ]}
          error={errors.documentType}
          required
        />

        {/* Subject */}
        <div className="md:col-span-2">
          <Input
            label="Subiect *"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            error={errors.subject}
            required
          />
        </div>

        {/* Petent (for incoming) */}
        {isIncoming && (
          <ClientSelect
            label="Petent"
            value={selectedClientId || ''}
            onChange={(clientId) => {
              const clientIdString = Array.isArray(clientId) ? clientId[0] : clientId;
              setSelectedClientId(clientIdString || null);
              if (clientIdString) {
                const client = clients.find(c => c.id === clientIdString);
                if (client) {
                  setFormData({ ...formData, from: getClientDisplayName(client) });
                }
              } else {
                setFormData({ ...formData, from: '' });
              }
            }}
            clients={clients}
            onlyCompanies={false}
            allowMultiple={true}
            placeholder="Caută client..."
            loading={clientsLoading}
            onSearch={handleSearch}
            getDisplayName={getClientDisplayName}
          />
        )}

        {/* To (for outgoing) */}
        {isOutgoing && (
          <Input
            label="Către"
            value={formData.to}
            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
            placeholder="Nume destinatar"
          />
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">Descriere</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-bg-primary text-text-primary"
          placeholder="Descrierea documentului..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading || externalLoading}>
          Anulează
        </Button>
        <Button type="submit" disabled={loading || externalLoading || !selectedRegisterId}>
          {loading || externalLoading ? 'Salvează...' : 'Continuă'}
        </Button>
      </div>
    </form>
  );
}


