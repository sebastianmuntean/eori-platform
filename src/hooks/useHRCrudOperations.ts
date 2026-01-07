import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/useToast';
import { useTranslations } from 'next-intl';
import { showErrorToast } from '@/lib/utils/hr';

export interface HRCrudOperationsConfig<T extends { id: string }> {
  createEntity: (data: Partial<T>) => Promise<T | null>;
  updateEntity: (id: string, data: Partial<T>) => Promise<T | null>;
  deleteEntity: (id: string) => Promise<boolean>;
  
  // Translation keys
  entityName: string;
  entityNamePlural: string;
  
  // Success messages (optional, will use defaults if not provided)
  messages?: {
    created?: string;
    updated?: string;
    deleted?: string;
    errorCreating?: string;
    errorUpdating?: string;
    errorDeleting?: string;
    confirmDelete?: string;
  };
  
  // Optional callbacks
  onEntityCreated?: (entity: T) => void;
  onEntityUpdated?: (entity: T) => void;
  onEntityDeleted?: (id: string) => void;
  onRefresh?: () => Promise<void> | void;
  
  // Custom delete message generator (optional)
  getDeleteMessage?: (entity: T) => string;
}

export interface HRCrudOperationsReturn<T extends { id: string }> {
  // State
  isFormOpen: boolean;
  selectedEntity: T | null;
  isDeleteDialogOpen: boolean;
  entityToDelete: T | null;
  isSubmitting: boolean;
  
  // Handlers
  handleAdd: () => void;
  handleEdit: (entity: T) => void;
  handleDelete: (entity: T) => void;
  handleFormClose: () => void;
  handleDeleteDialogClose: () => void;
  handleFormSubmit: (data: Partial<T>) => Promise<void>;
  handleConfirmDelete: () => Promise<void>;
  
  // Delete message
  deleteMessage: string;
}

/**
 * Reusable hook for HR CRUD operations
 * Eliminates code duplication across HR page content components
 * 
 * @template T - Entity type that must have an `id: string` property
 */
export function useHRCrudOperations<T extends { id: string }>(
  config: HRCrudOperationsConfig<T>
): HRCrudOperationsReturn<T> {
  const { showToast } = useToast();
  const t = useTranslations('common');
  
  const {
    createEntity,
    updateEntity,
    deleteEntity,
    entityName,
    entityNamePlural,
    messages = {},
    onEntityCreated,
    onEntityUpdated,
    onEntityDeleted,
    onRefresh,
    getDeleteMessage,
  } = config;
  
  // State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<T | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handlers for form actions
  const handleAdd = useCallback(() => {
    setSelectedEntity(null);
    setIsFormOpen(true);
  }, []);
  
  const handleEdit = useCallback((entity: T) => {
    setSelectedEntity(entity);
    setIsFormOpen(true);
  }, []);
  
  const handleDelete = useCallback((entity: T) => {
    setEntityToDelete(entity);
    setIsDeleteDialogOpen(true);
  }, []);
  
  // Handler to close form and reset state
  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setSelectedEntity(null);
  }, []);
  
  // Handler to close delete dialog and reset state
  const handleDeleteDialogClose = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setEntityToDelete(null);
  }, []);
  
  // Handler for form submission (create or update)
  const handleFormSubmit = useCallback(
    async (data: Partial<T>) => {
      setIsSubmitting(true);
      try {
        let result: T | null = null;
        
        if (selectedEntity) {
          result = await updateEntity(selectedEntity.id, data);
          if (result) {
            showToast(
              messages.updated || t(`${entityName}Updated`) || `${entityName} updated successfully`,
              'success'
            );
            onEntityUpdated?.(result);
          } else {
            showToast(
              messages.errorUpdating || t(`errorUpdating${entityName}`) || `Error updating ${entityName}`,
              'error'
            );
          }
        } else {
          result = await createEntity(data);
          if (result) {
            showToast(
              messages.created || t(`${entityName}Created`) || `${entityName} created successfully`,
              'success'
            );
            onEntityCreated?.(result);
          } else {
            showToast(
              messages.errorCreating || t(`errorCreating${entityName}`) || `Error creating ${entityName}`,
              'error'
            );
          }
        }
        
        if (result) {
          handleFormClose();
          if (onRefresh) {
            await onRefresh();
          }
        }
      } catch (error) {
        showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      selectedEntity,
      updateEntity,
      createEntity,
      showToast,
      t,
      handleFormClose,
      entityName,
      messages,
      onEntityCreated,
      onEntityUpdated,
      onRefresh,
    ]
  );
  
  // Handler for delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (!entityToDelete) return;
    
    setIsSubmitting(true);
    try {
      const success = await deleteEntity(entityToDelete.id);
      if (success) {
        showToast(
          messages.deleted || t(`${entityName}Deleted`) || `${entityName} deleted successfully`,
          'success'
        );
        onEntityDeleted?.(entityToDelete.id);
        handleDeleteDialogClose();
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        showToast(
          messages.errorDeleting || t(`errorDeleting${entityName}`) || `Error deleting ${entityName}`,
          'error'
        );
      }
    } catch (error) {
      showErrorToast(error, t('errorOccurred') || 'An error occurred', showToast);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    entityToDelete,
    deleteEntity,
    showToast,
    t,
    handleDeleteDialogClose,
    entityName,
    messages,
    onEntityDeleted,
    onRefresh,
  ]);
  
  // Delete confirmation message
  const deleteMessage = useMemo(() => {
    if (entityToDelete) {
      if (getDeleteMessage) {
        return getDeleteMessage(entityToDelete);
      }
      // Default: try to use entity name or ID
      const entityDisplayName = (entityToDelete as any).name || 
                                (entityToDelete as any).title || 
                                (entityToDelete as any).firstName || 
                                entityToDelete.id;
      return `${messages.confirmDelete || t(`confirmDelete${entityName}`) || `Are you sure you want to delete`} ${entityDisplayName}?`;
    }
    return messages.confirmDelete || t('confirmDelete') || `Are you sure you want to delete this ${entityName}?`;
  }, [entityToDelete, t, entityName, messages, getDeleteMessage]);
  
  return {
    // State
    isFormOpen,
    selectedEntity,
    isDeleteDialogOpen,
    entityToDelete,
    isSubmitting,
    
    // Handlers
    handleAdd,
    handleEdit,
    handleDelete,
    handleFormClose,
    handleDeleteDialogClose,
    handleFormSubmit,
    handleConfirmDelete,
    
    // Delete message
    deleteMessage,
  };
}

