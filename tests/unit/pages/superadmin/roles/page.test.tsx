import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../../setup/test-utils';
import RolesPage from '@/app/[locale]/dashboard/superadmin/roles/page';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { usePageTitle } from '@/hooks/usePageTitle';

// Mock hooks
vi.mock('@/hooks/useRequirePermission');
vi.mock('@/hooks/usePageTitle');
vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({ locale: 'ro' })),
}));

// Mock the content component
vi.mock('@/components/superadmin/roles/RolesPageContent', () => ({
  RolesPageContent: () => <div data-testid="roles-content">Roles Content</div>,
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

describe('RolesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePageTitle as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
  });

  it('should render loading state when permission is loading', () => {
    (useRequirePermission as ReturnType<typeof vi.fn>).mockReturnValue({
      loading: true,
    });

    render(<RolesPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render content component when permission is granted', () => {
    (useRequirePermission as ReturnType<typeof vi.fn>).mockReturnValue({
      loading: false,
    });

    render(<RolesPage />);
    expect(screen.getByTestId('roles-content')).toBeInTheDocument();
  });

  it('should set page title', () => {
    (useRequirePermission as ReturnType<typeof vi.fn>).mockReturnValue({
      loading: false,
    });

    render(<RolesPage />);
    expect(usePageTitle).toHaveBeenCalled();
  });
});

