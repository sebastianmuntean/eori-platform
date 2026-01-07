import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../../../../setup/test-utils';
import { useParams } from 'next/navigation';
import ProductsPage from '@/app/[locale]/dashboard/accounting/products/page';

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
vi.mock('@/components/accounting/products/ProductsPageContent', () => ({
  ProductsPageContent: vi.fn(({ locale }: { locale: string }) => (
    <div data-testid="products-page-content">Products Page Content - {locale}</div>
  )),
}));

// Mock next-intl
const mockUseTranslations = vi.fn();
vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl');
  return {
    ...actual,
    useTranslations: vi.fn((namespace: string) => {
      if (namespace === 'menu') {
        return mockUseTranslations;
      }
      return (key: string) => {
        const translations: Record<string, string> = {
          loading: 'Loading...',
        };
        return translations[key] || key;
      };
    }),
  };
});

describe('ProductsPage', () => {
  const mockUseParams = useParams as ReturnType<typeof vi.fn>;
  const mockUseRequirePermission = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    mockUseParams.mockReturnValue({ locale: 'ro' });
    mockUseTranslations.mockReturnValue((key: string) => {
      const translations: Record<string, string> = {
        products: 'Products',
      };
      return translations[key] || key;
    });

    const { useRequirePermission } = await import('@/hooks/useRequirePermission');
    vi.mocked(useRequirePermission).mockImplementation(mockUseRequirePermission);
  });

  it('should show loading state when permission is being checked', () => {
    mockUseRequirePermission.mockReturnValue({ loading: true });

    render(<ProductsPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('products-page-content')).not.toBeInTheDocument();
  });

  it('should render ProductsPageContent when permission is granted', () => {
    mockUseRequirePermission.mockReturnValue({ loading: false });

    render(<ProductsPage />);

    expect(screen.getByTestId('products-page-content')).toBeInTheDocument();
    expect(screen.getByText('Products Page Content - ro')).toBeInTheDocument();
  });

  it('should pass locale to ProductsPageContent', () => {
    mockUseRequirePermission.mockReturnValue({ loading: false });
    mockUseParams.mockReturnValue({ locale: 'en' });

    render(<ProductsPage />);

    expect(screen.getByText('Products Page Content - en')).toBeInTheDocument();
  });
});

