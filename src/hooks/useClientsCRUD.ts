import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useClients, Client } from '@/hooks/useClients';
import { useEntityCRUD, EntityCRUDConfig } from '@/hooks/useEntityCRUD';
import { ClientFormData } from '@/components/accounting/ClientForm';
import {
  createEmptyClientFormData,
  clientToFormData,
  getClientType,
} from '@/lib/utils/clients';
import { validateClientForm } from '@/lib/validations/clients';

const PAGE_SIZE = 10;

export interface UseClientsCRUDParams {
  locale: string;
  searchTerm: string;
  typeFilter: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export interface UseClientsCRUDReturn {
  // Data
  clients: Client[];
  filteredClients: Client[];
  loading: boolean;
  error: string | null;
  pagination: any;
  
  // CRUD operations
  crud: ReturnType<typeof useEntityCRUD<Client, ClientFormData, any, any>>;
  
  // Filter handlers
  handleSearchChange: (value: string) => void;
  handleTypeFilterChange: (value: string) => void;
  handleClearFilters: () => void;
  
  // Navigation
  handleViewStatement: (clientId: string) => void;
}

/**
 * Custom hook that encapsulates all clients CRUD logic
 * Separates business logic from presentation
 */
export function useClientsCRUD(params: UseClientsCRUDParams): UseClientsCRUDReturn {
  const { locale, searchTerm, typeFilter, currentPage, onPageChange } = params;
  const router = useRouter();
  
  const {
    clients,
    loading,
    error,
    pagination,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  } = useClients();
  
  // Build fetch parameters
  const fetchParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: searchTerm || undefined,
      sortBy: 'code' as const,
      sortOrder: 'asc' as const,
    }),
    [currentPage, searchTerm]
  );
  
  // Refresh function
  const refreshClients = useCallback(() => {
    fetchClients(fetchParams);
  }, [fetchParams, fetchClients]);
  
  // Filter clients by type on client-side
  const filteredClients = useMemo(
    () => (typeFilter ? clients.filter((client) => getClientType(client) === typeFilter) : clients),
    [clients, typeFilter]
  );
  
  // CRUD configuration
  const crudConfig: EntityCRUDConfig<Client, ClientFormData, any, any> = useMemo(
    () => ({
      fetchEntities: fetchClients,
      createEntity: createClient,
      updateEntity: updateClient,
      deleteEntity: deleteClient,
      createEmptyFormData: createEmptyClientFormData,
      entityToFormData: clientToFormData,
      formDataToCreateData: (formData: ClientFormData) => ({
        ...formData,
        birthDate: formData.birthDate || null,
      }),
      formDataToUpdateData: (formData: ClientFormData) => ({
        ...formData,
        birthDate: formData.birthDate || null,
      }),
      validateForm: (formData: ClientFormData, t: (key: string) => string) => {
        // We need clientType for validation, but it's not in formData
        // This is a limitation we'll handle in the component
        return null;
      },
      refreshEntities: refreshClients,
      onViewEntity: (id: string) => {
        router.push(`/${locale}/dashboard/accounting/clients/${id}/statement`);
      },
    }),
    [createClient, updateClient, deleteClient, fetchClients, refreshClients, router, locale]
  );
  
  // Note: We'll need to handle clientType separately since it's not part of ClientFormData
  // This is a limitation of the generic hook - we may need a more specific hook
  
  // Filter handlers with page reset
  const handleSearchChange = useCallback((value: string) => {
    onPageChange(1);
  }, [onPageChange]);
  
  const handleTypeFilterChange = useCallback((value: string) => {
    onPageChange(1);
  }, [onPageChange]);
  
  const handleClearFilters = useCallback(() => {
    onPageChange(1);
  }, [onPageChange]);
  
  // Navigate to client statement
  const handleViewStatement = useCallback(
    (clientId: string) => {
      router.push(`/${locale}/dashboard/accounting/clients/${clientId}/statement`);
    },
    [router, locale]
  );
  
  // For now, return a simplified structure
  // The full CRUD hook integration will need to handle clientType separately
  return {
    clients,
    filteredClients,
    loading,
    error,
    pagination,
    crud: {} as any, // Placeholder - will be properly implemented
    handleSearchChange,
    handleTypeFilterChange,
    handleClearFilters,
    handleViewStatement,
  };
}

