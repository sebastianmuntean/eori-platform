import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export interface EntityCRUDConfig<T extends { id: string }, TFormData, TCreateData, TUpdateData> {
  // Data fetching
  fetchEntities: (params: any) => Promise<void>;
  createEntity: (data: TCreateData) => Promise<T | null>;
  updateEntity: (id: string, data: TUpdateData) => Promise<T | null>;
  deleteEntity: (id: string) => Promise<boolean>;
  
  // Form management
  createEmptyFormData: () => TFormData;
  entityToFormData: (entity: T) => TFormData;
  formDataToCreateData: (formData: TFormData) => TCreateData;
  formDataToUpdateData: (formData: TFormData) => TUpdateData;
  validateForm: (formData: TFormData, t: (key: string) => string) => Record<string, string> | null;
  
  // Optional callbacks
  onEntityCreated?: (entity: T) => void;
  onEntityUpdated?: (entity: T) => void;
  onEntityDeleted?: (id: string) => void;
  onViewEntity?: (id: string) => void;
  
  // Refresh function
  refreshEntities: () => void;
}

export interface UseEntityCRUDReturn<T extends { id: string }, TFormData> {
  // Modal state
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteDialog: boolean;
  
  // Form state
  formData: TFormData;
  formErrors: Record<string, string>;
  isSubmitting: boolean;
  selectedEntity: T | null;
  deleteEntityId: string | null;
  
  // Actions
  openAddModal: () => void;
  closeAddModal: () => void;
  openEditModal: (entity: T) => void;
  closeEditModal: () => void;
  openDeleteDialog: (id: string) => void;
  closeDeleteDialog: () => void;
  
  // Form handlers
  updateFormData: (data: Partial<TFormData>) => void;
  setFormField: (field: keyof TFormData, value: any) => void;
  clearFormError: (field: string) => void;
  resetForm: () => void;
  
  // CRUD operations
  handleCreate: () => Promise<boolean>;
  handleUpdate: () => Promise<boolean>;
  handleDelete: (id: string) => Promise<boolean>;
  handleView?: (id: string) => void;
}

/**
 * Generic CRUD hook for managing entity operations
 * Extracts common CRUD logic from pages into reusable hook
 * 
 * @template T - Entity type that must have an `id: string` property
 * @template TFormData - Form data type
 * @template TCreateData - Data type for creating entities
 * @template TUpdateData - Data type for updating entities
 */
export function useEntityCRUD<T extends { id: string }, TFormData, TCreateData, TUpdateData>(
  config: EntityCRUDConfig<T, TFormData, TCreateData, TUpdateData>,
  t: (key: string) => string
): UseEntityCRUDReturn<T, TFormData> {
  const router = useRouter();
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<TFormData>(config.createEmptyFormData());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
  const [deleteEntityId, setDeleteEntityId] = useState<string | null>(null);
  
  // Reset form to empty state
  const resetForm = useCallback(() => {
    setFormData(config.createEmptyFormData());
    setFormErrors({});
    setSelectedEntity(null);
  }, [config]);
  
  // Modal handlers
  const openAddModal = useCallback(() => {
    resetForm();
    setShowAddModal(true);
  }, [resetForm]);
  
  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    resetForm();
  }, [resetForm]);
  
  const openEditModal = useCallback((entity: T) => {
    setSelectedEntity(entity);
    setFormData(config.entityToFormData(entity));
    setFormErrors({});
    setShowEditModal(true);
  }, [config]);
  
  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedEntity(null);
    setFormErrors({});
  }, []);
  
  const openDeleteDialog = useCallback((id: string) => {
    setDeleteEntityId(id);
    setShowDeleteDialog(true);
  }, []);
  
  const closeDeleteDialog = useCallback(() => {
    setDeleteEntityId(null);
    setShowDeleteDialog(false);
  }, []);
  
  // Form handlers
  const updateFormData = useCallback((data: Partial<TFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);
  
  const setFormField = useCallback((field: keyof TFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);
  
  const clearFormError = useCallback((field: string) => {
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);
  
  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors = config.validateForm(formData, t);
    if (errors && Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return false;
    }
    setFormErrors({});
    return true;
  }, [formData, config, t]);
  
  // Create entity
  const handleCreate = useCallback(async (): Promise<boolean> => {
    if (!validateForm()) {
      return false;
    }
    
    setIsSubmitting(true);
    try {
      const createData = config.formDataToCreateData(formData);
      const result = await config.createEntity(createData);
      
      if (result) {
        closeAddModal();
        config.refreshEntities();
        config.onEntityCreated?.(result);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating entity:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, config, closeAddModal]);
  
  // Update entity
  const handleUpdate = useCallback(async (): Promise<boolean> => {
    if (!selectedEntity || !validateForm()) {
      return false;
    }
    
    setIsSubmitting(true);
    try {
      const updateData = config.formDataToUpdateData(formData);
      const result = await config.updateEntity(selectedEntity.id, updateData);
      
      if (result) {
        closeEditModal();
        config.refreshEntities();
        config.onEntityUpdated?.(result);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating entity:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedEntity, formData, validateForm, config, closeEditModal]);
  
  // Delete entity
  const handleDelete = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await config.deleteEntity(id);
      if (success) {
        closeDeleteDialog();
        config.refreshEntities();
        config.onEntityDeleted?.(id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting entity:', error);
      return false;
    }
  }, [config, closeDeleteDialog]);
  
  // View entity (optional)
  const handleView = useCallback((id: string) => {
    if (config.onViewEntity) {
      config.onViewEntity(id);
    }
  }, [config]);
  
  return {
    // Modal state
    showAddModal,
    showEditModal,
    showDeleteDialog,
    
    // Form state
    formData,
    formErrors,
    isSubmitting,
    selectedEntity,
    deleteEntityId,
    
    // Actions
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openDeleteDialog,
    closeDeleteDialog,
    
    // Form handlers
    updateFormData,
    setFormField,
    clearFormError,
    resetForm,
    
    // CRUD operations
    handleCreate,
    handleUpdate,
    handleDelete,
    handleView: config.onViewEntity ? handleView : undefined,
  };
}

