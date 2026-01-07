import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, mockMessages } from '../../../../setup/test-utils';
import userEvent from '@testing-library/user-event';
import { ProductsPageContent } from '@/components/accounting/products/ProductsPageContent';
import { Product } from '@/hooks/useProducts';
import * as useProductsModule from '@/hooks/useProducts';

// Mock hooks
const mockFetchProducts = vi.fn();
const mockCreateProduct = vi.fn();
const mockUpdateProduct = vi.fn();
const mockDeleteProduct = vi.fn();
const mockFetchParishes = vi.fn();

vi.mock('@/hooks/useProducts', () => ({
  useProducts: vi.fn(() => ({
    products: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    },
    fetchProducts: mockFetchProducts,
    createProduct: mockCreateProduct,
    updateProduct: mockUpdateProduct,
    deleteProduct: mockDeleteProduct,
  })),
}));

vi.mock('@/hooks/useParishes', () => ({
  useParishes: vi.fn(() => ({
    parishes: [
      { id: '1', name: 'Parish 1' },
      { id: '2', name: 'Parish 2' },
    ],
    fetchParishes: mockFetchParishes,
  })),
}));

vi.mock('@/hooks/useProductForm', () => ({
  useProductForm: vi.fn(() => ({
    formData: {
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
    },
    resetForm: vi.fn(),
    updateFormData: vi.fn(),
    loadProduct: vi.fn(),
    validateForm: vi.fn(() => ({ valid: true })),
    toApiData: vi.fn(() => ({})),
  })),
}));

// Mock components
vi.mock('@/components/accounting/ProductsFiltersCard', () => ({
  ProductsFiltersCard: vi.fn(({ onSearchChange, onClear }: any) => (
    <div data-testid="products-filters-card">
      <button onClick={() => onSearchChange('test search')}>Search</button>
      <button onClick={onClear}>Clear</button>
    </div>
  )),
}));

vi.mock('@/components/accounting/ProductsTableCard', () => ({
  ProductsTableCard: vi.fn(({ data, onPageChange }: any) => (
    <div data-testid="products-table-card">
      <div data-testid="products-count">{data.length}</div>
      <button onClick={() => onPageChange(2)}>Next Page</button>
    </div>
  )),
}));

vi.mock('@/components/accounting/ProductAddModal', () => ({
  ProductAddModal: vi.fn(({ isOpen, onClose, onSubmit }: any) =>
    isOpen ? (
      <div data-testid="product-add-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSubmit}>Submit</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/accounting/ProductEditModal', () => ({
  ProductEditModal: vi.fn(({ isOpen, onClose, onSubmit }: any) =>
    isOpen ? (
      <div data-testid="product-edit-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSubmit}>Submit</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/accounting/DeleteProductDialog', () => ({
  DeleteProductDialog: vi.fn(({ isOpen, onClose, onConfirm, productId }: any) =>
    isOpen ? (
      <div data-testid="delete-product-dialog">
        <div>Delete product {productId}</div>
        <button onClick={onClose}>Cancel</button>
        <button onClick={() => onConfirm(productId)}>Confirm</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/accounting/products/ProductsTableColumns', () => ({
  useProductsTableColumns: vi.fn(() => [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
  ]),
}));

describe('ProductsPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchProducts.mockResolvedValue(undefined);
    mockFetchParishes.mockResolvedValue(undefined);
  });

  it('should render page header with correct title', () => {
    render(<ProductsPageContent locale="ro" />, {
      messages: {
        common: {
          ...mockMessages.common,
          products: 'Products',
          add: 'Add',
          noData: 'No data available',
        },
      },
    });

    // Check for the h1 title specifically
    expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument();
  });

  it('should render filters card', () => {
    render(<ProductsPageContent locale="ro" />);

    expect(screen.getByTestId('products-filters-card')).toBeInTheDocument();
  });

  it('should render products table card', () => {
    render(<ProductsPageContent locale="ro" />);

    expect(screen.getByTestId('products-table-card')).toBeInTheDocument();
  });

  it('should fetch products on mount', async () => {
    render(<ProductsPageContent locale="ro" />);

    await waitFor(() => {
      expect(mockFetchProducts).toHaveBeenCalled();
    });
  });

  it('should fetch parishes on mount', async () => {
    render(<ProductsPageContent locale="ro" />);

    await waitFor(() => {
      expect(mockFetchParishes).toHaveBeenCalledWith({ all: true });
    });
  });

  it('should handle search change and reset page', async () => {
    const user = userEvent.setup();
    render(<ProductsPageContent locale="ro" />);

    const searchButton = screen.getByText('Search');
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockFetchProducts).toHaveBeenCalled();
    });
  });

  it('should handle filter clear', async () => {
    const user = userEvent.setup();
    render(<ProductsPageContent locale="ro" />);

    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    await waitFor(() => {
      expect(mockFetchProducts).toHaveBeenCalled();
    });
  });

  it('should show add modal when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProductsPageContent locale="ro" />, {
      messages: {
        common: {
          ...mockMessages.common,
          products: 'Products',
          add: 'Add',
          noData: 'No data available',
        },
      },
    });

    const addButton = screen.getByText('Add');
    await user.click(addButton);

    expect(screen.getByTestId('product-add-modal')).toBeInTheDocument();
  });

  it('should close add modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProductsPageContent locale="ro" />, {
      messages: {
        common: {
          ...mockMessages.common,
          products: 'Products',
          add: 'Add',
          noData: 'No data available',
        },
      },
    });

    const addButton = screen.getByText('Add');
    await user.click(addButton);

    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('product-add-modal')).not.toBeInTheDocument();
    });
  });

  it('should handle pagination change', async () => {
    const user = userEvent.setup();
    render(<ProductsPageContent locale="ro" />);

    const nextPageButton = screen.getByText('Next Page');
    await user.click(nextPageButton);

    await waitFor(() => {
      expect(mockFetchProducts).toHaveBeenCalled();
    });
  });
});

describe('ProductsPageContent - with products data', () => {
  const mockProducts: Product[] = [
    {
      id: '1',
      parishId: '1',
      code: 'PROD001',
      name: 'Test Product 1',
      description: 'Description 1',
      category: 'Category 1',
      unit: 'buc',
      purchasePrice: '10.00',
      salePrice: '15.00',
      vatRate: '19',
      barcode: '123456',
      trackStock: true,
      minStock: '5',
      isActive: true,
      createdBy: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: null,
    },
    {
      id: '2',
      parishId: '2',
      code: 'PROD002',
      name: 'Test Product 2',
      description: 'Description 2',
      category: 'Category 2',
      unit: 'kg',
      purchasePrice: '20.00',
      salePrice: '30.00',
      vatRate: '19',
      barcode: '789012',
      trackStock: false,
      minStock: null,
      isActive: false,
      createdBy: 'user2',
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProductsModule.useProducts).mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        pageSize: 10,
        total: 2,
        totalPages: 1,
      },
      fetchProducts: mockFetchProducts,
      createProduct: mockCreateProduct,
      updateProduct: mockUpdateProduct,
      deleteProduct: mockDeleteProduct,
    });
  });

  it('should display products count', () => {
    render(<ProductsPageContent locale="ro" />);

    expect(screen.getByTestId('products-count')).toHaveTextContent('2');
  });
});

