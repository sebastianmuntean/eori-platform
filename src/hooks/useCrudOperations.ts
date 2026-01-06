import { useState, useCallback } from 'react';

export interface CrudOperationsConfig<TEntity, TFormData> {
  onCreate: (data: TFormData) => Promise<boolean | TEntity>;
  onUpdate: (id: string, data: TFormData) => Promise<boolean | TEntity>;
  onDelete: (id: string) => Promise<boolean>;
  onRefresh?: () => void | Promise<void>;
  getInitialFormData: () => TFormData;
  entityToFormData: (entity: TEntity) => TFormData;
}

export interface CrudOperationsReturn<TEntity, TFormData> {
  // State
  showAddModal: boolean;
  showEditModal: boolean;
  selectedEntity: TEntity | null;
  deleteConfirm: string | null;
  formData: TFormData;
  isSubmitting: boolean;

  // Actions
  setShowAddModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setDeleteConfirm: (id: string | null) => void;
  setFormData: React.Dispatch<React.SetStateAction<TFormData>>;
  setIsSubmitting: (submitting: boolean) => void;

  // Handlers
  handleAdd: () => void;
  handleEdit: (entity: TEntity) => void;
  handleSave: () => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  handleCloseAddModal: () => void;
  handleCloseEditModal: () => void;
  resetForm: () => void;
}

/**
 * Reusable hook for common CRUD operations
 * Eliminates code duplication across list pages
 */
export function useCrudOperations<TEntity extends { id: string }, TFormData>(
  config: CrudOperationsConfig<TEntity, TFormData>
): CrudOperationsReturn<TEntity, TFormData> {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<TEntity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<TFormData>(config.getInitialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setFormData(config.getInitialFormData());
    setSelectedEntity(null);
  }, [config]);

  const handleAdd = useCallback(() => {
    resetForm();
    setShowAddModal(true);
  }, [resetForm]);

  const handleEdit = useCallback(
    (entity: TEntity) => {
      setSelectedEntity(entity);
      setFormData(config.entityToFormData(entity));
      setShowEditModal(true);
    },
    [config]
  );

  const handleSave = useCallback(async () => {
    setIsSubmitting(true);
    try {
      if (selectedEntity) {
        const result = await config.onUpdate(selectedEntity.id, formData);
        if (result) {
          setShowEditModal(false);
          setSelectedEntity(null);
          if (config.onRefresh) {
            await config.onRefresh();
          }
        }
      } else {
        const result = await config.onCreate(formData);
        if (result) {
          setShowAddModal(false);
          resetForm();
          if (config.onRefresh) {
            await config.onRefresh();
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedEntity, formData, config, resetForm]);

  const handleDelete = useCallback(
    async (id: string) => {
      setIsSubmitting(true);
      try {
        const result = await config.onDelete(id);
        if (result) {
          setDeleteConfirm(null);
          if (config.onRefresh) {
            await config.onRefresh();
          }
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [config]
  );

  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    resetForm();
  }, [resetForm]);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedEntity(null);
  }, []);

  return {
    // State
    showAddModal,
    showEditModal,
    selectedEntity,
    deleteConfirm,
    formData,
    isSubmitting,

    // Actions
    setShowAddModal,
    setShowEditModal,
    setDeleteConfirm,
    setFormData,
    setIsSubmitting,

    // Handlers
    handleAdd,
    handleEdit,
    handleSave,
    handleDelete,
    handleCloseAddModal,
    handleCloseEditModal,
    resetForm,
  };
}





