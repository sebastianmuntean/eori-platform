import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEntityCRUD, EntityCRUDConfig } from '@/hooks/useEntityCRUD';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Test entity type
interface TestEntity {
  id: string;
  name: string;
  email: string;
  age: number;
}

interface TestFormData {
  name: string;
  email: string;
  age: number;
}

type TestCreateData = Omit<TestEntity, 'id'>;
type TestUpdateData = Partial<TestCreateData>;

describe('useEntityCRUD', () => {
  let mockConfig: EntityCRUDConfig<TestEntity, TestFormData, TestCreateData, TestUpdateData>;
  let mockCreateEntity: ReturnType<typeof vi.fn>;
  let mockUpdateEntity: ReturnType<typeof vi.fn>;
  let mockDeleteEntity: ReturnType<typeof vi.fn>;
  let mockFetchEntities: ReturnType<typeof vi.fn>;
  let mockRefreshEntities: ReturnType<typeof vi.fn>;
  let mockOnEntityCreated: ReturnType<typeof vi.fn>;
  let mockOnEntityUpdated: ReturnType<typeof vi.fn>;
  let mockOnEntityDeleted: ReturnType<typeof vi.fn>;
  let mockOnViewEntity: ReturnType<typeof vi.fn>;

  const mockEntity: TestEntity = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  };

  const mockFormData: TestFormData = {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  };

  const mockT = (key: string) => key;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCreateEntity = vi.fn();
    mockUpdateEntity = vi.fn();
    mockDeleteEntity = vi.fn();
    mockFetchEntities = vi.fn();
    mockRefreshEntities = vi.fn();
    mockOnEntityCreated = vi.fn();
    mockOnEntityUpdated = vi.fn();
    mockOnEntityDeleted = vi.fn();
    mockOnViewEntity = vi.fn();

    mockConfig = {
      fetchEntities: mockFetchEntities,
      createEntity: mockCreateEntity,
      updateEntity: mockUpdateEntity,
      deleteEntity: mockDeleteEntity,
      createEmptyFormData: () => ({ name: '', email: '', age: 0 }),
      entityToFormData: (entity) => ({
        name: entity.name,
        email: entity.email,
        age: entity.age,
      }),
      formDataToCreateData: (formData) => ({
        name: formData.name,
        email: formData.email,
        age: formData.age,
      }),
      formDataToUpdateData: (formData) => ({
        name: formData.name,
        email: formData.email,
        age: formData.age,
      }),
      validateForm: (formData, t) => {
        const errors: Record<string, string> = {};
        if (!formData.name) errors.name = 'Name is required';
        if (!formData.email) errors.email = 'Email is required';
        if (formData.age < 0) errors.age = 'Age must be positive';
        return Object.keys(errors).length > 0 ? errors : null;
      },
      refreshEntities: mockRefreshEntities,
      onEntityCreated: mockOnEntityCreated,
      onEntityUpdated: mockOnEntityUpdated,
      onEntityDeleted: mockOnEntityDeleted,
      onViewEntity: mockOnViewEntity,
    };
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      expect(result.current.showAddModal).toBe(false);
      expect(result.current.showEditModal).toBe(false);
      expect(result.current.showDeleteDialog).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.selectedEntity).toBe(null);
      expect(result.current.deleteEntityId).toBe(null);
      expect(result.current.formData).toEqual({ name: '', email: '', age: 0 });
      expect(result.current.formErrors).toEqual({});
    });
  });

  describe('modal management', () => {
    it('should open and close add modal', () => {
      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.openAddModal();
      });

      expect(result.current.showAddModal).toBe(true);
      expect(result.current.formData).toEqual({ name: '', email: '', age: 0 });

      act(() => {
        result.current.closeAddModal();
      });

      expect(result.current.showAddModal).toBe(false);
      expect(result.current.formData).toEqual({ name: '', email: '', age: 0 });
    });

    it('should open and close edit modal with entity data', () => {
      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.openEditModal(mockEntity);
      });

      expect(result.current.showEditModal).toBe(true);
      expect(result.current.selectedEntity).toEqual(mockEntity);
      expect(result.current.formData).toEqual(mockFormData);

      act(() => {
        result.current.closeEditModal();
      });

      expect(result.current.showEditModal).toBe(false);
      expect(result.current.selectedEntity).toBe(null);
    });

    it('should open and close delete dialog', () => {
      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.openDeleteDialog('1');
      });

      expect(result.current.showDeleteDialog).toBe(true);
      expect(result.current.deleteEntityId).toBe('1');

      act(() => {
        result.current.closeDeleteDialog();
      });

      expect(result.current.showDeleteDialog).toBe(false);
      expect(result.current.deleteEntityId).toBe(null);
    });
  });

  describe('form management', () => {
    it('should update form data', () => {
      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.updateFormData({ name: 'Jane Doe' });
      });

      expect(result.current.formData.name).toBe('Jane Doe');
      expect(result.current.formData.email).toBe('');
    });

    it('should set form field', () => {
      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.setFormField('email', 'jane@example.com');
      });

      expect(result.current.formData.email).toBe('jane@example.com');
    });

    it('should clear form error', () => {
      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.updateFormData({ name: '' });
      });

      act(() => {
        result.current.handleCreate();
      });

      expect(result.current.formErrors.name).toBeDefined();

      act(() => {
        result.current.clearFormError('name');
      });

      expect(result.current.formErrors.name).toBeUndefined();
    });

    it('should reset form', () => {
      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.updateFormData(mockFormData);
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData).toEqual({ name: '', email: '', age: 0 });
      expect(result.current.formErrors).toEqual({});
      expect(result.current.selectedEntity).toBe(null);
    });
  });

  describe('form validation', () => {
    it('should validate form and set errors for invalid data', async () => {
      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.updateFormData({ name: '', email: '', age: -1 });
      });

      await act(async () => {
        await result.current.handleCreate();
      });

      expect(result.current.formErrors.name).toBe('Name is required');
      expect(result.current.formErrors.email).toBe('Email is required');
      expect(result.current.formErrors.age).toBe('Age must be positive');
      expect(mockCreateEntity).not.toHaveBeenCalled();
    });

    it('should clear errors for valid data', async () => {
      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.updateFormData({ name: '', email: '', age: 0 });
      });

      await act(async () => {
        await result.current.handleCreate();
      });

      expect(result.current.formErrors.name).toBeDefined();

      act(() => {
        result.current.updateFormData(mockFormData);
      });

      await act(async () => {
        await result.current.handleCreate();
      });

      await waitFor(() => {
        expect(Object.keys(result.current.formErrors).length).toBe(0);
      });
    });
  });

  describe('create entity', () => {
    it('should create entity successfully', async () => {
      mockCreateEntity.mockResolvedValue(mockEntity);

      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.updateFormData(mockFormData);
      });

      await act(async () => {
        const success = await result.current.handleCreate();
        expect(success).toBe(true);
      });

      await waitFor(() => {
        expect(mockCreateEntity).toHaveBeenCalledWith({
          name: mockFormData.name,
          email: mockFormData.email,
          age: mockFormData.age,
        });
        expect(mockRefreshEntities).toHaveBeenCalled();
        expect(mockOnEntityCreated).toHaveBeenCalledWith(mockEntity);
        expect(result.current.showAddModal).toBe(false);
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('should not create entity if validation fails', async () => {
      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.updateFormData({ name: '', email: '', age: 0 });
      });

      await act(async () => {
        const success = await result.current.handleCreate();
        expect(success).toBe(false);
      });

      expect(mockCreateEntity).not.toHaveBeenCalled();
      expect(mockRefreshEntities).not.toHaveBeenCalled();
    });

    it('should handle create error gracefully', async () => {
      mockCreateEntity.mockResolvedValue(null);

      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.updateFormData(mockFormData);
      });

      await act(async () => {
        const success = await result.current.handleCreate();
        expect(success).toBe(false);
      });

      await waitFor(() => {
        expect(mockCreateEntity).toHaveBeenCalled();
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('should set isSubmitting during create', async () => {
      let resolveCreate: (value: TestEntity | null) => void;
      const createPromise = new Promise<TestEntity | null>((resolve) => {
        resolveCreate = resolve;
      });
      mockCreateEntity.mockReturnValue(createPromise);

      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.updateFormData(mockFormData);
      });

      let createPromise2: Promise<boolean>;
      act(() => {
        createPromise2 = result.current.handleCreate();
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      act(() => {
        resolveCreate!(mockEntity);
      });
      
      await act(async () => {
        await createPromise2!;
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });
  });

  describe('update entity', () => {
    it('should update entity successfully', async () => {
      const updatedEntity = { ...mockEntity, name: 'Jane Doe' };
      mockUpdateEntity.mockResolvedValue(updatedEntity);

      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.openEditModal(mockEntity);
      });

      act(() => {
        result.current.updateFormData({ name: 'Jane Doe', email: 'jane@example.com', age: 31 });
      });

      await act(async () => {
        const success = await result.current.handleUpdate();
        expect(success).toBe(true);
      });

      await waitFor(() => {
        expect(mockUpdateEntity).toHaveBeenCalledWith('1', {
          name: 'Jane Doe',
          email: 'jane@example.com',
          age: 31,
        });
        expect(mockRefreshEntities).toHaveBeenCalled();
        expect(mockOnEntityUpdated).toHaveBeenCalledWith(updatedEntity);
        expect(result.current.showEditModal).toBe(false);
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('should not update entity if no entity is selected', async () => {
      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.updateFormData(mockFormData);
      });

      await act(async () => {
        const success = await result.current.handleUpdate();
        expect(success).toBe(false);
      });

      expect(mockUpdateEntity).not.toHaveBeenCalled();
    });

    it('should not update entity if validation fails', async () => {
      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.openEditModal(mockEntity);
      });

      act(() => {
        result.current.updateFormData({ name: '', email: '', age: 0 });
      });

      await act(async () => {
        const success = await result.current.handleUpdate();
        expect(success).toBe(false);
      });

      expect(mockUpdateEntity).not.toHaveBeenCalled();
    });

    it('should handle update error gracefully', async () => {
      mockUpdateEntity.mockResolvedValue(null);

      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.openEditModal(mockEntity);
      });

      act(() => {
        result.current.updateFormData(mockFormData);
      });

      await act(async () => {
        const success = await result.current.handleUpdate();
        expect(success).toBe(false);
      });

      await waitFor(() => {
        expect(mockUpdateEntity).toHaveBeenCalled();
        expect(result.current.isSubmitting).toBe(false);
      });
    });
  });

  describe('delete entity', () => {
    it('should delete entity successfully', async () => {
      mockDeleteEntity.mockResolvedValue(true);

      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      await act(async () => {
        const success = await result.current.handleDelete('1');
        expect(success).toBe(true);
      });

      await waitFor(() => {
        expect(mockDeleteEntity).toHaveBeenCalledWith('1');
        expect(mockRefreshEntities).toHaveBeenCalled();
        expect(mockOnEntityDeleted).toHaveBeenCalledWith('1');
        expect(result.current.showDeleteDialog).toBe(false);
      });
    });

    it('should handle delete failure gracefully', async () => {
      mockDeleteEntity.mockResolvedValue(false);

      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      await act(async () => {
        const success = await result.current.handleDelete('1');
        expect(success).toBe(false);
      });

      await waitFor(() => {
        expect(mockDeleteEntity).toHaveBeenCalledWith('1');
        expect(mockRefreshEntities).not.toHaveBeenCalled();
        expect(mockOnEntityDeleted).not.toHaveBeenCalled();
      });
    });

    it('should handle delete error gracefully', async () => {
      mockDeleteEntity.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      await act(async () => {
        const success = await result.current.handleDelete('1');
        expect(success).toBe(false);
      });

      await waitFor(() => {
        expect(mockDeleteEntity).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('view entity', () => {
    it('should call onViewEntity when handleView is called', () => {
      const { result } = renderHook(() => useEntityCRUD(mockConfig, mockT));

      act(() => {
        result.current.handleView?.('1');
      });

      expect(mockOnViewEntity).toHaveBeenCalledWith('1');
    });

    it('should not have handleView if onViewEntity is not provided', () => {
      const configWithoutView = {
        ...mockConfig,
        onViewEntity: undefined,
      };

      const { result } = renderHook(() => useEntityCRUD(configWithoutView, mockT));

      expect(result.current.handleView).toBeUndefined();
    });
  });

  describe('optional callbacks', () => {
    it('should work without optional callbacks', async () => {
      const configWithoutCallbacks = {
        ...mockConfig,
        onEntityCreated: undefined,
        onEntityUpdated: undefined,
        onEntityDeleted: undefined,
      };

      mockCreateEntity.mockResolvedValue(mockEntity);

      const { result } = renderHook(() => useEntityCRUD(configWithoutCallbacks, mockT));

      act(() => {
        result.current.updateFormData(mockFormData);
      });

      await act(async () => {
        await result.current.handleCreate();
      });

      await waitFor(() => {
        expect(mockCreateEntity).toHaveBeenCalled();
        expect(mockRefreshEntities).toHaveBeenCalled();
      });
    });
  });
});

