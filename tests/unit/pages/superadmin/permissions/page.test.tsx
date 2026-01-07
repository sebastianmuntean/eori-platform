import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../../setup/test-utils';
import PermissionsPage from '@/app/[locale]/dashboard/superadmin/permissions/page';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { usePageTitle } from '@/hooks/usePageTitle';

// Mock hooks
vi.mock('@/hooks/useRequirePermission');
vi.mock('@/hooks/usePageTitle');
vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({ locale: 'ro' })),
}));

// Mock the content component
vi.mock('@/components/superadmin/permissions/PermissionsPageContent', () => ({
  PermissionsPageContent: () => <div data-testid="permissions-content">Permissions Content</div>,
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

describe('PermissionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePageTitle as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
  });

  it('should render loading state when permission is loading', () => {
    (useRequirePermission as ReturnType<typeof vi.fn>).mockReturnValue({
      loading: true,
    });

    render(<PermissionsPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render content component when permission is granted', () => {
    (useRequirePermission as ReturnType<typeof vi.fn>).mockReturnValue({
      loading: false,
    });

    render(<PermissionsPage />);
    expect(screen.getByTestId('permissions-content')).toBeInTheDocument();
  });

  it('should set page title', () => {
    (useRequirePermission as ReturnType<typeof vi.fn>).mockReturnValue({
      loading: false,
    });

    render(<PermissionsPage />);
    expect(usePageTitle).toHaveBeenCalled();
  });
});

