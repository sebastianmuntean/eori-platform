'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useCallback } from 'react';
import { Client } from '@/hooks/useClients';
import { getClientDisplayName } from '@/lib/utils/clients';
import { Autocomplete, AutocompleteOption } from '@/components/ui/Autocomplete';

export interface ClientSelectProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  clients: Client[];
  onlyCompanies?: boolean;
  allowMultiple?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onSearch?: (searchTerm: string) => void;
  loading?: boolean;
  getDisplayName?: (client: Client) => string;
}

/**
 * Reusable client select component
 * @param onlyCompanies - If true, only shows companies (clients with companyName). If false, shows all clients.
 * @param allowMultiple - If true, uses Autocomplete for search functionality. If false, uses simple select dropdown.
 */
export function ClientSelect({
  value,
  onChange,
  clients,
  onlyCompanies = false,
  allowMultiple = false,
  required = false,
  label,
  placeholder,
  className = '',
  disabled = false,
  onSearch,
  loading = false,
  getDisplayName: customGetDisplayName,
}: ClientSelectProps) {
  const t = useTranslations('common');

  // Filter clients based on onlyCompanies prop
  const filteredClients = useMemo(() => {
    return onlyCompanies
      ? clients.filter((c) => c.companyName)
      : clients;
  }, [clients, onlyCompanies]);

  // Get display name for client - use custom function if provided, otherwise use default
  const getDisplayName = useCallback((client: Client): string => {
    if (customGetDisplayName) {
      return customGetDisplayName(client);
    }
    if (onlyCompanies) {
      return client.companyName || client.code;
    }
    return getClientDisplayName(client);
  }, [onlyCompanies, customGetDisplayName]);

  // Convert clients to Autocomplete options
  const autocompleteOptions = useMemo<AutocompleteOption[]>(() => {
    return filteredClients.map((client) => ({
      value: client.id,
      label: getDisplayName(client),
      client,
    }));
  }, [filteredClients, getDisplayName]);

  // Find selected client for Autocomplete (value should be client ID)
  const selectedClientLabel = useMemo(() => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return '';
    }
    const clientId = Array.isArray(value) ? value[0] : value;
    const client = filteredClients.find((c) => c.id === clientId);
    return client ? getDisplayName(client) : '';
  }, [value, filteredClients, getDisplayName]);

  // Handle Autocomplete change
  const handleAutocompleteChange = useCallback((label: string) => {
    // Find client by label
    const option = autocompleteOptions.find((opt) => opt.label === label);
    if (option) {
      onChange(option.value);
    } else {
      onChange('');
    }
  }, [autocompleteOptions, onChange]);

  // If allowMultiple is true, use Autocomplete
  if (allowMultiple) {
    return (
      <div className={className}>
        <Autocomplete
          label={label ? `${label}${required ? ' *' : ''}` : undefined}
          value={selectedClientLabel}
          onChange={handleAutocompleteChange}
          options={autocompleteOptions}
          placeholder={placeholder || t('selectClient') || 'Select Client'}
          loading={loading}
          onSearch={onSearch}
          disabled={disabled}
          getOptionLabel={(option) => option.label}
        />
      </div>
    );
  }

  // Otherwise, use simple select dropdown
  const stringValue = Array.isArray(value) ? value[0] || '' : value;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-1">
          {label} {required && '*'}
        </label>
      )}
      <select
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded bg-bg-primary text-text-primary"
        required={required}
        disabled={disabled}
      >
        <option value="">
          {placeholder || t('selectClient') || 'Select Client'}
        </option>
        {filteredClients.map((client) => (
          <option key={client.id} value={client.id}>
            {getDisplayName(client)}
          </option>
        ))}
      </select>
    </div>
  );
}

