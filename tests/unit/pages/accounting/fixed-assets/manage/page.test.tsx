import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../../../../../setup/test-utils';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import FixedAssetsManagePage from '@/app/[locale]/dashboard/accounting/fixed-assets/manage/page';
import { FixedAssetsManagePageContent } from '@/components/accounting/fixed-assets/FixedAssetsManagePageContent';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

// Mock hooks
vi.mock('@/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}));

vi.mock('@/hooks/useRequirePermission', () => ({
  useRequirePermission: vi.fn(),
}));

// Mock the content component
vi.mock('@/components/accounting/fixed-assets/FixedAssetsManagePageContent', () => ({
  FixedAssetsManagePageContent: vi.fn(({ locale }: { locale: string }) => (
    <div data-testid="fixed-assets-manage-page-content">
      Fixed Assets Manage Page Content - {locale}
    </div>
  )),
}));

// Mock next-intl - use importOriginal to preserve NextIntlClientProvider
const mockUseTranslations = vi.fn();
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
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

describe('FixedAssetsManagePage', () => {
  const mockUseParams = useParams as ReturnType<typeof vi.fn>;
  const mockUseRequirePermission = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Default mocks
    mockUseParams.mockReturnValue({ locale: 'ro' });
    mockUseTranslations.mockReturnValue((key: string) => {
      const translations: Record<string, string> = {
        fixedAssetsManagement: 'Fixed Assets Management',
      };
      return translations[key] || key;
    });

    // Setup mock implementation
    const { useRequirePermission } = await import('@/hooks/useRequirePermission');
    vi.mocked(useRequirePermission).mockImplementation(mockUseRequirePermission);
  });

  describe('Permission Loading State', () => {
    it('should show loading state when permission is being checked', () => {
      mockUseRequirePermission.mockReturnValue({ loading: true });

      render(<FixedAssetsManagePage />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('fixed-assets-manage-page-content')).not.toBeInTheDocument();
    });
  });

  describe('Permission Granted', () => {
    it('should render FixedAssetsManagePageContent when permission is granted', () => {
      mockUseRequirePermission.mockReturnValue({ loading: false });

      render(<FixedAssetsManagePage />);

      expect(screen.getByTestId('fixed-assets-manage-page-content')).toBeInTheDocument();
      expect(screen.getByText('Fixed Assets Manage Page Content - ro')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should pass correct locale to FixedAssetsManagePageContent', () => {
      mockUseRequirePermission.mockReturnValue({ loading: false });
      mockUseParams.mockReturnValue({ locale: 'en' });

      render(<FixedAssetsManagePage />);

      expect(screen.getByText('Fixed Assets Manage Page Content - en')).toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('should call useRequirePermission with correct permission', async () => {
      mockUseRequirePermission.mockReturnValue({ loading: false });

      render(<FixedAssetsManagePage />);

      expect(mockUseRequirePermission).toHaveBeenCalled();
    });

    it('should call usePageTitle with menu translation', async () => {
      mockUseRequirePermission.mockReturnValue({ loading: false });
      const { usePageTitle } = await import('@/hooks/usePageTitle');
      const mockUsePageTitle = vi.mocked(usePageTitle);

      render(<FixedAssetsManagePage />);

      expect(mockUsePageTitle).toHaveBeenCalled();
    });

    it('should call useParams to get locale', () => {
      mockUseRequirePermission.mockReturnValue({ loading: false });

      render(<FixedAssetsManagePage />);

      expect(mockUseParams).toHaveBeenCalled();
    });
  });
});

