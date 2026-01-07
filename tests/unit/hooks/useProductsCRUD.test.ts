import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useProductsCRUD } from '@/hooks/useProductsCRUD';
import { Product } from '@/hooks/useProducts';

// Mock useProducts hook
const mockUseProducts = vi.fn();
vi.mock('@/hooks/useProducts', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useProducts')>('@/hooks/useProducts');
  return {
    ...actual,
    useProducts: () => mockUseProducts(),
  };
});

// Mock product utilities
vi.mock('@/lib/utils/products', () => ({
  createEmptyProductFormData: () => ({
    parishId: '',
    code: '',
    name: '',
    description: '',
    category: '',
    unit: 'buc',
    purchasePrice: '',
    salePrice: '',
    vatRate: '19',
    barcode: '',
    trackStock: true,
    minStock: '',
    isActive: true,
  }),
  productToFormData: (product: Product) => ({
    parishId: product.parishId,
    code: product.code,
    name: product.name,
    description: product.description || '',
    category: product.category || '',
    unit: product.unit,
    purchasePrice: product.purchasePrice || '',
    salePrice: product.salePrice || '',
    vatRate: product.vatRate,
    barcode: product.barcode || '',
    trackStock: product.trackStock,
    minStock: product.minStock || '',
    isActive: product.isActive,
  }),
  productFormDataToCreateData: (formData: any) => ({
    ...formData,
    purchasePrice: formData.purchasePrice || null,
    salePrice: formData.salePrice || null,
    minStock: formData.minStock || null,
    description: formData.description || null,
    category: formData.category || null,
    barcode: formData.barcode || null,
  }),
  productFormDataToUpdateData: (formData: any) => ({
    ...formData,
    purchasePrice: formData.purchasePrice || null,
    salePrice: formData.salePrice || null,
    minStock: formData.minStock || null,
    description: formData.description || null,
    category: formData.category || null,
    barcode: formData.barcode || null,
  }),
}));

// Mock validation
vi.mock('@/lib/validations/products', () => ({
  validateProductForm: (formData: any, t: (key: string) => string) => {
    const errors: Record<string, string> = {};
    if (!formData.code?.trim()) errors.code = 'Code is required';
    if (!formData.name?.trim()) errors.name = 'Name is required';
    return Object.keys(errors).length > 0 ? errors : null;
  },
}));

// Mock shared helpers
vi.mock('@/hooks/shared/crudHelpers', () => ({
  createStandardFilterHandler: (onPageChange: (page: number) => void) => () => {
    onPageChange(1);
  },
  normalizeFilterValue: (value: string) => (value || undefined),
  normalizeBooleanFilter: (value: string) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('useProductsCRUD', () => {
  let mockFetchProducts: ReturnType<typeof vi.fn>;
  let mockCreateProduct: ReturnType<typeof vi.fn>;
  let mockUpdateProduct: ReturnType<typeof vi.fn>;
  let mockDeleteProduct: ReturnType<typeof vi.fn>;

  const mockProduct: Product = {
    id: '1',
    parishId: 'parish-1',
    code: 'PROD-001',
    name: 'Test Product',
    description: 'Test Description',
    category: 'Category 1',
    unit: 'buc',
    purchasePrice: '10.00',
    salePrice: '15.00',
    vatRate: '19',
    barcode: '123456789',
    trackStock: true,
    minStock: '5',
    isActive: true,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: 'user-1',
  };

  const mockPagination = {
    page: 1,
    pageSize: 10,
    total: 1,
    totalPages: 1,
  };

  const mockT = (key: string) => key;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFetchProducts = vi.fn().mockResolvedValue(undefined);
    mockCreateProduct = vi.fn();
    mockUpdateProduct = vi.fn();
    mockDeleteProduct = vi.fn();

    mockUseProducts.mockReturnValue({
      products: [mockProduct],
      loading: false,
      error: null,
      pagination: mockPagination,
      fetchProducts: mockFetchProducts,
      createProduct: mockCreateProduct,
      updateProduct: mockUpdateProduct,
      deleteProduct: mockDeleteProduct,
    });
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      const params = {
        searchTerm: '',
        categoryFilter: '',
        isActiveFilter: '',
        currentPage: 1,
        onPageChange: vi.fn(),
      };

      const { result } = renderHook(() => useProductsCRUD(params, mockT));

      expect(result.current.products).toEqual([mockProduct]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.pagination).toEqual(mockPagination);
      expect(result.current.crud).toBeDefined();
    });

    it('should build correct fetch parameters', () => {
      const params = {
        searchTerm: 'test',
        categoryFilter: 'Category 1',
        isActiveFilter: 'true',
        currentPage: 2,
        onPageChange: vi.fn(),
      };

      renderHook(() => useProductsCRUD(params, mockT));

      // Wait for fetch to be called
      waitFor(() => {
        expect(mockFetchProducts).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
            pageSize: 10,
            search: 'test',
            category: 'Category 1',
            isActive: true,
            sortBy: 'code',
            sortOrder: 'asc',
          })
        );
      });
    });
  });

  describe('filter handlers', () => {
    it('should reset page when search changes', () => {
      const onPageChange = vi.fn();
      const params = {
        searchTerm: '',
        categoryFilter: '',
        isActiveFilter: '',
        currentPage: 1,
        onPageChange,
      };

      const { result } = renderHook(() => useProductsCRUD(params, mockT));

      act(() => {
        result.current.handleSearchChange();
      });

      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('should reset page when category filter changes', () => {
      const onPageChange = vi.fn();
      const params = {
        searchTerm: '',
        categoryFilter: '',
        isActiveFilter: '',
        currentPage: 1,
        onPageChange,
      };

      const { result } = renderHook(() => useProductsCRUD(params, mockT));

      act(() => {
        result.current.handleCategoryFilterChange();
      });

      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('should reset page when isActive filter changes', () => {
      const onPageChange = vi.fn();
      const params = {
        searchTerm: '',
        categoryFilter: '',
        isActiveFilter: '',
        currentPage: 1,
        onPageChange,
      };

      const { result } = renderHook(() => useProductsCRUD(params, mockT));

      act(() => {
        result.current.handleIsActiveFilterChange();
      });

      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('should reset page when filters are cleared', () => {
      const onPageChange = vi.fn();
      const params = {
        searchTerm: '',
        categoryFilter: '',
        isActiveFilter: '',
        currentPage: 1,
        onPageChange,
      };

      const { result } = renderHook(() => useProductsCRUD(params, mockT));

      act(() => {
        result.current.handleClearFilters();
      });

      expect(onPageChange).toHaveBeenCalledWith(1);
    });
  });

  describe('CRUD operations integration', () => {
    it('should provide CRUD hook with correct configuration', () => {
      const params = {
        searchTerm: '',
        categoryFilter: '',
        isActiveFilter: '',
        currentPage: 1,
        onPageChange: vi.fn(),
      };

      const { result } = renderHook(() => useProductsCRUD(params, mockT));

      expect(result.current.crud).toBeDefined();
      expect(result.current.crud.showAddModal).toBe(false);
      expect(result.current.crud.showEditModal).toBe(false);
      expect(result.current.crud.showDeleteDialog).toBe(false);
      expect(result.current.crud.formData).toBeDefined();
    });

    it('should refresh products after create', async () => {
      const mockCreatedProduct = { ...mockProduct, id: '2' };
      mockCreateProduct.mockResolvedValue(mockCreatedProduct);

      const params = {
        searchTerm: '',
        categoryFilter: '',
        isActiveFilter: '',
        currentPage: 1,
        onPageChange: vi.fn(),
      };

      const { result } = renderHook(() => useProductsCRUD(params, mockT));

      act(() => {
        result.current.crud.updateFormData({
          code: 'PROD-002',
          name: 'New Product',
          parishId: 'parish-1',
          unit: 'buc',
          vatRate: '19',
          trackStock: true,
          isActive: true,
        });
      });

      await act(async () => {
        await result.current.crud.handleCreate();
      });

      await waitFor(() => {
        expect(mockCreateProduct).toHaveBeenCalled();
        expect(mockFetchProducts).toHaveBeenCalled();
      });
    });

    it('should refresh products after update', async () => {
      const mockUpdatedProduct = { ...mockProduct, name: 'Updated Product' };
      mockUpdateProduct.mockResolvedValue(mockUpdatedProduct);

      const params = {
        searchTerm: '',
        categoryFilter: '',
        isActiveFilter: '',
        currentPage: 1,
        onPageChange: vi.fn(),
      };

      const { result } = renderHook(() => useProductsCRUD(params, mockT));

      act(() => {
        result.current.crud.openEditModal(mockProduct);
      });

      act(() => {
        result.current.crud.updateFormData({
          ...result.current.crud.formData,
          name: 'Updated Product',
        });
      });

      await act(async () => {
        await result.current.crud.handleUpdate();
      });

      await waitFor(() => {
        expect(mockUpdateProduct).toHaveBeenCalledWith('1', expect.any(Object));
        expect(mockFetchProducts).toHaveBeenCalled();
      });
    });

    it('should refresh products after delete', async () => {
      mockDeleteProduct.mockResolvedValue(true);

      const params = {
        searchTerm: '',
        categoryFilter: '',
        isActiveFilter: '',
        currentPage: 1,
        onPageChange: vi.fn(),
      };

      const { result } = renderHook(() => useProductsCRUD(params, mockT));

      await act(async () => {
        await result.current.crud.handleDelete('1');
      });

      await waitFor(() => {
        expect(mockDeleteProduct).toHaveBeenCalledWith('1');
        expect(mockFetchProducts).toHaveBeenCalled();
      });
    });
  });

  describe('filter normalization', () => {
    it('should normalize empty search term to undefined', () => {
      const params = {
        searchTerm: '',
        categoryFilter: '',
        isActiveFilter: '',
        currentPage: 1,
        onPageChange: vi.fn(),
      };

      renderHook(() => useProductsCRUD(params, mockT));

      waitFor(() => {
        expect(mockFetchProducts).toHaveBeenCalledWith(
          expect.objectContaining({
            search: undefined,
          })
        );
      });
    });

    it('should normalize boolean filter correctly', () => {
      const params = {
        searchTerm: '',
        categoryFilter: '',
        isActiveFilter: 'true',
        currentPage: 1,
        onPageChange: vi.fn(),
      };

      renderHook(() => useProductsCRUD(params, mockT));

      waitFor(() => {
        expect(mockFetchProducts).toHaveBeenCalledWith(
          expect.objectContaining({
            isActive: true,
          })
        );
      });
    });

    it('should handle false boolean filter', () => {
      const params = {
        searchTerm: '',
        categoryFilter: '',
        isActiveFilter: 'false',
        currentPage: 1,
        onPageChange: vi.fn(),
      };

      renderHook(() => useProductsCRUD(params, mockT));

      waitFor(() => {
        expect(mockFetchProducts).toHaveBeenCalledWith(
          expect.objectContaining({
            isActive: false,
          })
        );
      });
    });
  });
});

