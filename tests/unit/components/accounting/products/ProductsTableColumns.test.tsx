import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, renderHook } from '../../../../setup/test-utils';
import { useProductsTableColumns } from '@/components/accounting/products/ProductsTableColumns';
import { Product } from '@/hooks/useProducts';

// Mock next-intl
vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl');
  return {
    ...actual,
    useTranslations: vi.fn(() => (key: string) => {
      const translations: Record<string, string> = {
        code: 'Code',
        name: 'Name',
        category: 'Category',
        unit: 'Unit',
        trackStock: 'Track Stock',
        status: 'Status',
        actions: 'Actions',
        yes: 'Yes',
        no: 'No',
        active: 'Active',
        inactive: 'Inactive',
        edit: 'Edit',
        delete: 'Delete',
      };
      return translations[key] || key;
    }),
  };
});

// Mock UI components
vi.mock('@/components/ui/Badge', () => ({
  Badge: vi.fn(({ children, variant }: any) => (
    <span data-testid={`badge-${variant}`}>{children}</span>
  )),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: vi.fn(({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  )),
}));

vi.mock('@/components/ui/Dropdown', () => ({
  Dropdown: vi.fn(({ trigger, items, align }: any) => (
    <div data-testid="dropdown" data-align={align}>
      {trigger}
      <div data-testid="dropdown-items">
        {items.map((item: any, index: number) => (
          <button
            key={index}
            data-testid={`dropdown-item-${index}`}
            data-variant={item.variant}
            onClick={item.onClick}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )),
}));

describe('useProductsTableColumns', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const mockProduct: Product = {
    id: '1',
    parishId: '1',
    code: 'PROD001',
    name: 'Test Product',
    description: 'Test Description',
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return columns array with correct structure', () => {
    const { result } = renderHook(() =>
      useProductsTableColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      })
    );

    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current.length).toBeGreaterThan(0);
  });

  it('should include code column', () => {
    const { result } = renderHook(() =>
      useProductsTableColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      })
    );

    const codeColumn = result.current.find((col) => col.key === 'code');
    expect(codeColumn).toBeDefined();
    expect(codeColumn?.label).toBe('Code');
    expect(codeColumn?.sortable).toBe(true);
  });

  it('should include name column', () => {
    const { result } = renderHook(() =>
      useProductsTableColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      })
    );

    const nameColumn = result.current.find((col) => col.key === 'name');
    expect(nameColumn).toBeDefined();
    expect(nameColumn?.label).toBe('Name');
    expect(nameColumn?.sortable).toBe(true);
  });

  it('should include category column', () => {
    const { result } = renderHook(() =>
      useProductsTableColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      })
    );

    const categoryColumn = result.current.find((col) => col.key === 'category');
    expect(categoryColumn).toBeDefined();
    expect(categoryColumn?.label).toBe('Category');
    expect(categoryColumn?.sortable).toBe(true);
  });

  it('should include unit column', () => {
    const { result } = renderHook(() =>
      useProductsTableColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      })
    );

    const unitColumn = result.current.find((col) => col.key === 'unit');
    expect(unitColumn).toBeDefined();
    expect(unitColumn?.label).toBe('Unit');
    expect(unitColumn?.sortable).toBe(false);
  });

  it('should include trackStock column with badge render', () => {
    const { result } = renderHook(() =>
      useProductsTableColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      })
    );

    const trackStockColumn = result.current.find((col) => col.key === 'trackStock');
    expect(trackStockColumn).toBeDefined();
    expect(trackStockColumn?.label).toBe('Track Stock');
    expect(trackStockColumn?.sortable).toBe(false);
    expect(trackStockColumn?.render).toBeDefined();

    // Test render function with true value
    if (trackStockColumn?.render) {
      const { container } = render(trackStockColumn.render(true) as React.ReactElement);
      expect(container.querySelector('[data-testid="badge-info"]')).toBeInTheDocument();
    }
  });

  it('should include isActive column with badge render', () => {
    const { result } = renderHook(() =>
      useProductsTableColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      })
    );

    const isActiveColumn = result.current.find((col) => col.key === 'isActive');
    expect(isActiveColumn).toBeDefined();
    expect(isActiveColumn?.label).toBe('Status');
    expect(isActiveColumn?.sortable).toBe(false);
    expect(isActiveColumn?.render).toBeDefined();

    // Test render function with true value
    if (isActiveColumn?.render) {
      const { container } = render(isActiveColumn.render(true) as React.ReactElement);
      expect(container.querySelector('[data-testid="badge-success"]')).toBeInTheDocument();
    }

    // Test render function with false value
    if (isActiveColumn?.render) {
      const { container } = render(isActiveColumn.render(false) as React.ReactElement);
      expect(container.querySelector('[data-testid="badge-secondary"]')).toBeInTheDocument();
    }
  });

  it('should include actions column with dropdown', () => {
    const { result } = renderHook(() =>
      useProductsTableColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      })
    );

    const actionsColumn = result.current.find((col) => col.key === 'id');
    expect(actionsColumn).toBeDefined();
    expect(actionsColumn?.label).toBe('Actions');
    expect(actionsColumn?.sortable).toBe(false);
    expect(actionsColumn?.render).toBeDefined();

    // Test render function
    if (actionsColumn?.render) {
      render(actionsColumn.render(null, mockProduct) as React.ReactElement);
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown')).toHaveAttribute('data-align', 'right');
    }
  });

  it('should call onEdit when edit action is clicked', () => {
    const { result } = renderHook(() =>
      useProductsTableColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      })
    );

    const actionsColumn = result.current.find((col) => col.key === 'id');
    if (actionsColumn?.render) {
      render(actionsColumn.render(null, mockProduct) as React.ReactElement);

      const editButton = screen.getByTestId('dropdown-item-0');
      editButton.click();

      expect(mockOnEdit).toHaveBeenCalledWith(mockProduct);
    }
  });

  it('should call onDelete when delete action is clicked', () => {
    const { result } = renderHook(() =>
      useProductsTableColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      })
    );

    const actionsColumn = result.current.find((col) => col.key === 'id');
    if (actionsColumn?.render) {
      render(actionsColumn.render(null, mockProduct) as React.ReactElement);

      const deleteButton = screen.getByTestId('dropdown-item-1');
      deleteButton.click();

      expect(mockOnDelete).toHaveBeenCalledWith(mockProduct.id);
    }
  });

  it('should have delete action with danger variant', () => {
    const { result } = renderHook(() =>
      useProductsTableColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      })
    );

    const actionsColumn = result.current.find((col) => col.key === 'id');
    if (actionsColumn?.render) {
      render(actionsColumn.render(null, mockProduct) as React.ReactElement);

      const deleteButton = screen.getByTestId('dropdown-item-1');
      expect(deleteButton).toHaveAttribute('data-variant', 'danger');
    }
  });
});

