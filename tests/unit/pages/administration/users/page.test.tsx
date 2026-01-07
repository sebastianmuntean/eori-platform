import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../../../../setup/test-utils';
import UtilizatoriPage from '@/app/[locale]/dashboard/administration/users/page';

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
vi.mock('@/components/administration/users/UsersPageContent', () => ({
  UsersPageContent: ({ locale }: { locale: string }) => (
    <div data-testid="users-page-content">Users Page Content - {locale}</div>
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

describe('UtilizatoriPage (Users Page)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    mockUseParams.mockReturnValue({ locale: 'ro' });
    mockMenuTranslations.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        users: 'Users',
      };
      return translations[key] || key;
    });
  });

  describe('Permission Loading State', () => {
    it('should show loading state when permission is being checked', () => {
      mockUseRequirePermission.mockReturnValue({ loading: true, hasPermission: false });

      render(<UtilizatoriPage />);

      expect(screen.getByText('loading')).toBeInTheDocument();
      expect(screen.queryByTestId('users-page-content')).not.toBeInTheDocument();
    });
  });

  describe('Permission Granted', () => {
    it('should render UsersPageContent when permission is granted', () => {
      mockUseRequirePermission.mockReturnValue({ loading: false, hasPermission: true });

      render(<UtilizatoriPage />);

      expect(screen.getByTestId('users-page-content')).toBeInTheDocument();
      expect(screen.getByText('Users Page Content - ro')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should pass correct locale to UsersPageContent', () => {
      mockUseRequirePermission.mockReturnValue({ loading: false, hasPermission: true });
      mockUseParams.mockReturnValue({ locale: 'en' });

      render(<UtilizatoriPage />);

      expect(screen.getByText('Users Page Content - en')).toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('should call usePageTitle with menu translation', () => {
      mockUseRequirePermission.mockReturnValue({ loading: false, hasPermission: true });

      render(<UtilizatoriPage />);

      expect(mockUsePageTitle).toHaveBeenCalled();
    });
  });
});

