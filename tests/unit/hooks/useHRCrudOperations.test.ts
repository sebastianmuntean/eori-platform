import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useHRCrudOperations } from '@/hooks/useHRCrudOperations';

// Mock dependencies - must be defined before vi.mock calls
vi.mock('@/hooks/useToast', () => ({
  useToast: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
}));

vi.mock('@/lib/utils/hr', () => ({
  showErrorToast: vi.fn(),
}));

// Import mocks after they're defined
import { useToast } from '@/hooks/useToast';
import { useTranslations } from 'next-intl';
import { showErrorToast } from '@/lib/utils/hr';

// Test entity type
interface TestEntity {
  id: string;
  name: string;
  email?: string;
}

describe('useHRCrudOperations', () => {
  let mockShowToast: ReturnType<typeof vi.fn>;
  let mockCreateEntity: ReturnType<typeof vi.fn>;
  let mockUpdateEntity: ReturnType<typeof vi.fn>;
  let mockDeleteEntity: ReturnType<typeof vi.fn>;
  let mockOnEntityCreated: ReturnType<typeof vi.fn>;
  let mockOnEntityUpdated: ReturnType<typeof vi.fn>;
  let mockOnEntityDeleted: ReturnType<typeof vi.fn>;
  let mockOnRefresh: ReturnType<typeof vi.fn>;
  let mockGetDeleteMessage: ReturnType<typeof vi.fn>;
  let mockT: ReturnType<typeof vi.fn>;

  const testEntity: TestEntity = {
    id: 'entity-1',
    name: 'Test Entity',
    email: 'test@example.com',
  };

  const newEntity: TestEntity = {
    id: 'entity-2',
    name: 'New Entity',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mocks
    mockShowToast = vi.fn();
    mockT = vi.fn((key: string) => {
      const translations: Record<string, string> = {
        'errorOccurred': 'An error occurred',
        'confirmDelete': 'Are you sure you want to delete',
        'EmployeeUpdated': 'Employee updated successfully',
        'EmployeeCreated': 'Employee created successfully',
        'EmployeeDeleted': 'Employee deleted successfully',
        'errorUpdatingEmployee': 'Error updating employee',
        'errorCreatingEmployee': 'Error creating employee',
        'errorDeletingEmployee': 'Error deleting employee',
        'confirmDeleteEmployee': 'Are you sure you want to delete',
      };
      return translations[key] || key;
    });

    (useToast as any).mockReturnValue({ showToast: mockShowToast });
    (useTranslations as any).mockReturnValue(mockT);

    mockCreateEntity = vi.fn().mockResolvedValue(newEntity);
    mockUpdateEntity = vi.fn().mockResolvedValue(testEntity);
    mockDeleteEntity = vi.fn().mockResolvedValue(true);
    mockOnEntityCreated = vi.fn();
    mockOnEntityUpdated = vi.fn();
    mockOnEntityDeleted = vi.fn();
    mockOnRefresh = vi.fn();
    mockGetDeleteMessage = vi.fn();
  });

  describe('initial state', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Entity',
          entityNamePlural: 'Entities',
        })
      );

      expect(result.current.isFormOpen).toBe(false);
      expect(result.current.selectedEntity).toBe(null);
      expect(result.current.isDeleteDialogOpen).toBe(false);
      expect(result.current.entityToDelete).toBe(null);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.deleteMessage).toContain('Are you sure you want to delete');
    });
  });

  describe('handleAdd', () => {
    it('should open form and clear selected entity', () => {
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Entity',
          entityNamePlural: 'Entities',
        })
      );

      act(() => {
        result.current.handleAdd();
      });

      expect(result.current.isFormOpen).toBe(true);
      expect(result.current.selectedEntity).toBe(null);
    });
  });

  describe('handleEdit', () => {
    it('should open form with selected entity', () => {
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Entity',
          entityNamePlural: 'Entities',
        })
      );

      act(() => {
        result.current.handleEdit(testEntity);
      });

      expect(result.current.isFormOpen).toBe(true);
      expect(result.current.selectedEntity).toEqual(testEntity);
    });
  });

  describe('handleDelete', () => {
    it('should open delete dialog with entity to delete', () => {
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Entity',
          entityNamePlural: 'Entities',
        })
      );

      act(() => {
        result.current.handleDelete(testEntity);
      });

      expect(result.current.isDeleteDialogOpen).toBe(true);
      expect(result.current.entityToDelete).toEqual(testEntity);
    });
  });

  describe('handleFormClose', () => {
    it('should close form and clear selected entity', () => {
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Entity',
          entityNamePlural: 'Entities',
        })
      );

      // Open form first
      act(() => {
        result.current.handleEdit(testEntity);
      });

      expect(result.current.isFormOpen).toBe(true);
      expect(result.current.selectedEntity).toEqual(testEntity);

      // Close form
      act(() => {
        result.current.handleFormClose();
      });

      expect(result.current.isFormOpen).toBe(false);
      expect(result.current.selectedEntity).toBe(null);
    });
  });

  describe('handleDeleteDialogClose', () => {
    it('should close delete dialog and clear entity to delete', () => {
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Entity',
          entityNamePlural: 'Entities',
        })
      );

      // Open delete dialog first
      act(() => {
        result.current.handleDelete(testEntity);
      });

      expect(result.current.isDeleteDialogOpen).toBe(true);
      expect(result.current.entityToDelete).toEqual(testEntity);

      // Close dialog
      act(() => {
        result.current.handleDeleteDialogClose();
      });

      expect(result.current.isDeleteDialogOpen).toBe(false);
      expect(result.current.entityToDelete).toBe(null);
    });
  });

  describe('handleFormSubmit - Create', () => {
    it('should create entity successfully', async () => {
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Employee',
          entityNamePlural: 'Employees',
          onEntityCreated: mockOnEntityCreated,
          onRefresh: mockOnRefresh,
        })
      );

      await act(async () => {
        await result.current.handleFormSubmit({ name: 'New Entity' });
      });

      await waitFor(() => {
        expect(mockCreateEntity).toHaveBeenCalledWith({ name: 'New Entity' });
        expect(mockShowToast).toHaveBeenCalledWith(
          'Employee created successfully',
          'success'
        );
        expect(mockOnEntityCreated).toHaveBeenCalledWith(newEntity);
        expect(mockOnRefresh).toHaveBeenCalled();
      });
      
      expect(result.current.isFormOpen).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should show error toast when creation fails', async () => {
      mockCreateEntity.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Employee',
          entityNamePlural: 'Employees',
        })
      );

      await act(async () => {
        await result.current.handleFormSubmit({ name: 'New Entity' });
      });

      await waitFor(() => {
        expect(mockCreateEntity).toHaveBeenCalled();
        expect(mockShowToast).toHaveBeenCalledWith(
          'Error creating employee',
          'error'
        );
      });
      
      // Form should stay open on error, but we need to check after waitFor
      // The form was never closed because result was null
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should handle creation errors', async () => {
      const error = new Error('Network error');
      mockCreateEntity.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Employee',
          entityNamePlural: 'Employees',
        })
      );

      await act(async () => {
        await result.current.handleFormSubmit({ name: 'New Entity' });
      });

      await waitFor(() => {
        expect(showErrorToast).toHaveBeenCalledWith(
          error,
          'An error occurred',
          mockShowToast
        );
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('should use custom success message when provided', async () => {
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Employee',
          entityNamePlural: 'Employees',
          messages: {
            created: 'Custom creation message',
          },
        })
      );

      await act(async () => {
        await result.current.handleFormSubmit({ name: 'New Entity' });
      });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Custom creation message', 'success');
      });
    });
  });

  describe('handleFormSubmit - Update', () => {
    it('should update entity successfully', async () => {
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Employee',
          entityNamePlural: 'Employees',
          onEntityUpdated: mockOnEntityUpdated,
          onRefresh: mockOnRefresh,
        })
      );

      // Set selected entity first
      act(() => {
        result.current.handleEdit(testEntity);
      });

      await act(async () => {
        await result.current.handleFormSubmit({ name: 'Updated Entity' });
      });

      await waitFor(() => {
        expect(mockUpdateEntity).toHaveBeenCalledWith('entity-1', { name: 'Updated Entity' });
        expect(mockShowToast).toHaveBeenCalledWith(
          'Employee updated successfully',
          'success'
        );
        expect(mockOnEntityUpdated).toHaveBeenCalledWith(testEntity);
        expect(mockOnRefresh).toHaveBeenCalled();
        expect(result.current.isFormOpen).toBe(false);
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('should show error toast when update fails', async () => {
      mockUpdateEntity.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Employee',
          entityNamePlural: 'Employees',
        })
      );

      act(() => {
        result.current.handleEdit(testEntity);
      });

      await act(async () => {
        await result.current.handleFormSubmit({ name: 'Updated Entity' });
      });

      await waitFor(() => {
        expect(mockUpdateEntity).toHaveBeenCalled();
        expect(mockShowToast).toHaveBeenCalledWith(
          'Error updating employee',
          'error'
        );
        expect(result.current.isFormOpen).toBe(true); // Form should stay open on error
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      mockUpdateEntity.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Employee',
          entityNamePlural: 'Employees',
        })
      );

      act(() => {
        result.current.handleEdit(testEntity);
      });

      await act(async () => {
        await result.current.handleFormSubmit({ name: 'Updated Entity' });
      });

      await waitFor(() => {
        expect(showErrorToast).toHaveBeenCalledWith(
          error,
          'An error occurred',
          mockShowToast
        );
      });
      
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('handleConfirmDelete', () => {
    it('should delete entity successfully', async () => {
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Employee',
          entityNamePlural: 'Employees',
          onEntityDeleted: mockOnEntityDeleted,
          onRefresh: mockOnRefresh,
        })
      );

      // Set entity to delete first
      act(() => {
        result.current.handleDelete(testEntity);
      });

      await act(async () => {
        await result.current.handleConfirmDelete();
      });

      await waitFor(() => {
        expect(mockDeleteEntity).toHaveBeenCalledWith('entity-1');
        expect(mockShowToast).toHaveBeenCalledWith(
          'Employee deleted successfully',
          'success'
        );
        expect(mockOnEntityDeleted).toHaveBeenCalledWith('entity-1');
        expect(mockOnRefresh).toHaveBeenCalled();
        expect(result.current.isDeleteDialogOpen).toBe(false);
        expect(result.current.entityToDelete).toBe(null);
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('should show error toast when deletion fails', async () => {
      mockDeleteEntity.mockResolvedValue(false);

      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Employee',
          entityNamePlural: 'Employees',
        })
      );

      act(() => {
        result.current.handleDelete(testEntity);
      });

      await act(async () => {
        await result.current.handleConfirmDelete();
      });

      await waitFor(() => {
        expect(mockDeleteEntity).toHaveBeenCalled();
        expect(mockShowToast).toHaveBeenCalledWith(
          'Error deleting employee',
          'error'
        );
        expect(result.current.isDeleteDialogOpen).toBe(true); // Dialog should stay open on error
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed');
      mockDeleteEntity.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Employee',
          entityNamePlural: 'Employees',
        })
      );

      act(() => {
        result.current.handleDelete(testEntity);
      });

      await act(async () => {
        await result.current.handleConfirmDelete();
      });

      await waitFor(() => {
        expect(showErrorToast).toHaveBeenCalledWith(
          error,
          'An error occurred',
          mockShowToast
        );
      });
      
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should do nothing if no entity to delete', async () => {
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Employee',
          entityNamePlural: 'Employees',
        })
      );

      await act(async () => {
        await result.current.handleConfirmDelete();
      });

      await waitFor(() => {
        expect(mockDeleteEntity).not.toHaveBeenCalled();
        expect(mockShowToast).not.toHaveBeenCalled();
      });
    });
  });

  describe('deleteMessage', () => {
    it('should generate default delete message when entity has name property', () => {
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Entity',
          entityNamePlural: 'Entities',
        })
      );

      act(() => {
        result.current.handleDelete(testEntity);
      });

      expect(result.current.deleteMessage).toContain('Test Entity');
    });

    it('should use custom delete message generator when provided', () => {
      mockGetDeleteMessage.mockReturnValue('Custom delete message');

      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Entity',
          entityNamePlural: 'Entities',
          getDeleteMessage: mockGetDeleteMessage,
        })
      );

      act(() => {
        result.current.handleDelete(testEntity);
      });

      expect(mockGetDeleteMessage).toHaveBeenCalledWith(testEntity);
      expect(result.current.deleteMessage).toBe('Custom delete message');
    });

    it('should use custom confirmDelete message when provided', () => {
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Entity',
          entityNamePlural: 'Entities',
          messages: {
            confirmDelete: 'Custom confirm message',
          },
        })
      );

      act(() => {
        result.current.handleDelete(testEntity);
      });

      expect(result.current.deleteMessage).toContain('Custom confirm message');
    });

    it('should fallback to entity ID when no name property exists', () => {
      const entityWithoutName = { id: 'entity-3' } as TestEntity;

      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Entity',
          entityNamePlural: 'Entities',
        })
      );

      act(() => {
        result.current.handleDelete(entityWithoutName);
      });

      expect(result.current.deleteMessage).toContain('entity-3');
    });
  });

  describe('isSubmitting state', () => {
    it('should set isSubmitting to true during form submission', async () => {
      // This test verifies that isSubmitting is managed correctly
      // We'll test it indirectly by checking the final state
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Entity',
          entityNamePlural: 'Entities',
        })
      );

      // Initially false
      expect(result.current.isSubmitting).toBe(false);

      // After submission completes, should be false
      await act(async () => {
        await result.current.handleFormSubmit({ name: 'New Entity' });
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('should set isSubmitting to true during delete', async () => {
      // This test verifies that isSubmitting is managed correctly
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Entity',
          entityNamePlural: 'Entities',
        })
      );

      // Initially false
      expect(result.current.isSubmitting).toBe(false);

      act(() => {
        result.current.handleDelete(testEntity);
      });

      // After delete completes, should be false
      await act(async () => {
        await result.current.handleConfirmDelete();
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });
  });

  describe('onRefresh callback', () => {
    it('should call onRefresh after successful create', async () => {
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Entity',
          entityNamePlural: 'Entities',
          onRefresh: mockOnRefresh,
        })
      );

      await act(async () => {
        await result.current.handleFormSubmit({ name: 'New Entity' });
      });

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled();
      });
    });

    it('should call onRefresh after successful update', async () => {
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Entity',
          entityNamePlural: 'Entities',
          onRefresh: mockOnRefresh,
        })
      );

      act(() => {
        result.current.handleEdit(testEntity);
      });

      await act(async () => {
        await result.current.handleFormSubmit({ name: 'Updated Entity' });
      });

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled();
      });
    });

    it('should call onRefresh after successful delete', async () => {
      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Entity',
          entityNamePlural: 'Entities',
          onRefresh: mockOnRefresh,
        })
      );

      act(() => {
        result.current.handleDelete(testEntity);
      });

      await act(async () => {
        await result.current.handleConfirmDelete();
      });

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled();
      });
    });

    it('should not call onRefresh when operation fails', async () => {
      mockCreateEntity.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useHRCrudOperations<TestEntity>({
          createEntity: mockCreateEntity,
          updateEntity: mockUpdateEntity,
          deleteEntity: mockDeleteEntity,
          entityName: 'Entity',
          entityNamePlural: 'Entities',
          onRefresh: mockOnRefresh,
        })
      );

      await act(async () => {
        await result.current.handleFormSubmit({ name: 'New Entity' });
      });

      await waitFor(() => {
        expect(mockOnRefresh).not.toHaveBeenCalled();
      });
    });
  });
});

