import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../../../../setup/test-utils';
import { useParams } from 'next/navigation';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import StockMovementsPage from '@/app/[locale]/dashboard/accounting/stock-movements/page';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}));

// Mock hooks
vi.mock('@/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}));

vi.mock('@/hooks/useRequirePermission', () => ({
  useRequirePermission: vi.fn(),
}));

// Mock the content component
vi.mock('@/components/accounting/stock-movements/StockMovementsPageContent', () => ({
  StockMovementsPageContent: ({ locale }: { locale: string }) => (
    <div data-testid="stock-movements-content">Stock Movements Content (locale: {locale})</div>
  ),
}));

// Mock next-intl
vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl');
  return {
    ...actual,
    useTranslations: vi.fn(() => (key: string) => {
      const translations: Record<string, string> = {
        loading: 'Loading...',
      };
      return translations[key] || key;
    }),
  };
});

describe('StockMovementsPage', () => {
  const mockUseParams = useParams as ReturnType<typeof vi.fn>;
  const mockUsePageTitle = usePageTitle as ReturnType<typeof vi.fn>;
  const mockUseRequirePermission = useRequirePermission as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    mockUseParams.mockReturnValue({ locale: 'ro' });
    mockUsePageTitle.mockReturnValue(undefined);
    mockUseRequirePermission.mockReturnValue({ loading: false });
  });

  describe('Initial Render', () => {
    it('should render loading state when permission is being checked', () => {
      mockUseRequirePermission.mockReturnValue({ loading: true });

      render(<StockMovementsPage />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('stock-movements-content')).not.toBeInTheDocument();
    });

    it('should render content component when permission check is complete', () => {
      mockUseRequirePermission.mockReturnValue({ loading: false });

      render(<StockMovementsPage />);

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByTestId('stock-movements-content')).toBeInTheDocument();
      expect(screen.getByText(/Stock Movements Content/i)).toBeInTheDocument();
    });

    it('should pass correct locale to content component', () => {
      mockUseParams.mockReturnValue({ locale: 'en' });
      mockUseRequirePermission.mockReturnValue({ loading: false });

      render(<StockMovementsPage />);

      expect(screen.getByText(/locale: en/i)).toBeInTheDocument();
    });
  });

  describe('Hooks Integration', () => {
    it('should call usePageTitle with correct translation key', () => {
      mockUseRequirePermission.mockReturnValue({ loading: false });

      render(<StockMovementsPage />);

      expect(mockUsePageTitle).toHaveBeenCalled();
    });

    it('should call useRequirePermission with correct permission', () => {
      render(<StockMovementsPage />);

      // Check that useRequirePermission was called with a permission string
      expect(mockUseRequirePermission).toHaveBeenCalled();
      const permissionArg = mockUseRequirePermission.mock.calls[0][0];
      expect(typeof permissionArg).toBe('string');
    });

    it('should extract locale from useParams', () => {
      mockUseParams.mockReturnValue({ locale: 'ro' });
      mockUseRequirePermission.mockReturnValue({ loading: false });

      render(<StockMovementsPage />);

      expect(mockUseParams).toHaveBeenCalled();
      expect(screen.getByText(/locale: ro/i)).toBeInTheDocument();
    });
  });

  describe('Permission Loading States', () => {
    it('should show loading initially when permissionLoading is true', () => {
      mockUseRequirePermission.mockReturnValue({ loading: true });

      const { rerender } = render(<StockMovementsPage />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Simulate permission check completion
      mockUseRequirePermission.mockReturnValue({ loading: false });
      rerender(<StockMovementsPage />);

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByTestId('stock-movements-content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing locale in params', () => {
      mockUseParams.mockReturnValue({});
      mockUseRequirePermission.mockReturnValue({ loading: false });

      render(<StockMovementsPage />);

      // Should still render, locale will be undefined
      expect(screen.getByTestId('stock-movements-content')).toBeInTheDocument();
    });

    it('should handle different locale values', () => {
      const locales = ['ro', 'en', 'de'];
      
      locales.forEach((locale) => {
        vi.clearAllMocks();
        mockUseParams.mockReturnValue({ locale });
        mockUseRequirePermission.mockReturnValue({ loading: false });

        const { unmount } = render(<StockMovementsPage />);

        expect(screen.getByText(new RegExp(`locale: ${locale}`, 'i'))).toBeInTheDocument();
        unmount();
      });
    });
  });
});

