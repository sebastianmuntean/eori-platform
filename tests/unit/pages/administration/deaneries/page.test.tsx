import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../../../../setup/test-utils';
import DeaneriesPage from '@/app/[locale]/dashboard/administration/deaneries/page';

// Mock Next.js navigation
const mockUseParams = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  })),
}));

// Mock hooks
const mockUsePageTitle = vi.fn();
vi.mock('@/hooks/usePageTitle', () => ({
  usePageTitle: () => mockUsePageTitle(),
}));

const mockUseRequirePermission = vi.fn();
vi.mock('@/hooks/useRequirePermission', () => ({
  useRequirePermission: () => mockUseRequirePermission(),
}));

// Mock the content component
vi.mock('@/components/administration/deaneries/DeaneriesPageContent', () => ({
  DeaneriesPageContent: ({ locale }: { locale: string }) => (
    <div data-testid="deaneries-page-content">Deaneries Page Content - {locale}</div>
  ),
}));

// Mock next-intl
const mockMenuTranslations = vi.fn();
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return {
    ...actual,
    useTranslations: (namespace: string) => {
      if (namespace === 'menu') {
        return mockMenuTranslations;
      }
      return (key: string) => key;
    },
  };
});

describe('DeaneriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseParams.mockReturnValue({ locale: 'ro' });
    mockMenuTranslations.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        deaneries: 'Deaneries',
      };
      return translations[key] || key;
    });
  });

  it('should show loading state when permission is being checked', () => {
    mockUseRequirePermission.mockReturnValue({ loading: true, hasPermission: false });

    render(<DeaneriesPage />);

    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('deaneries-page-content')).not.toBeInTheDocument();
  });

  it('should render DeaneriesPageContent when permission is granted', () => {
    mockUseRequirePermission.mockReturnValue({ loading: false, hasPermission: true });

    render(<DeaneriesPage />);

    expect(screen.getByTestId('deaneries-page-content')).toBeInTheDocument();
    expect(screen.getByText('Deaneries Page Content - ro')).toBeInTheDocument();
  });
});

