import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../setup/test-utils';
import { GeneralRegisterPageContent } from '@/components/registry/general-register/GeneralRegisterPageContent';
import { useRouter } from 'next/navigation';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  useParams: vi.fn(() => ({ locale: 'ro' })),
  usePathname: vi.fn(() => '/ro/dashboard'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock DocumentList component
vi.mock('@/components/registratura/DocumentList', () => ({
  DocumentList: ({ onDocumentClick, onCreateNew }: any) => (
    <div data-testid="document-list">
      <button onClick={() => onDocumentClick({ id: 'doc-1' })}>Click Document</button>
      <button onClick={onCreateNew}>Create New</button>
    </div>
  ),
}));

// Mock translations
const mockTranslations = {
  common: {
    breadcrumbDashboard: 'Dashboard',
    loading: 'Loading...',
  },
  registratura: {
    registratura: 'Registratura',
    generalRegister: 'Registrul General',
  },
};

describe('GeneralRegisterPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component with correct structure', () => {
    render(<GeneralRegisterPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    expect(screen.getByTestId('document-list')).toBeInTheDocument();
  });

  it('should call router.push when document is clicked', () => {
    render(<GeneralRegisterPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    const clickButton = screen.getByText('Click Document');
    clickButton.click();

    expect(mockPush).toHaveBeenCalledWith('/ro/dashboard/registry/general-register/doc-1');
  });

  it('should call router.push when create new is clicked', () => {
    render(<GeneralRegisterPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    const createButton = screen.getByText('Create New');
    createButton.click();

    expect(mockPush).toHaveBeenCalledWith('/ro/dashboard/registry/general-register/new');
  });

  it('should use correct locale in navigation', () => {
    render(<GeneralRegisterPageContent locale="en" />, {
      messages: mockTranslations,
    });

    const clickButton = screen.getByText('Click Document');
    clickButton.click();

    expect(mockPush).toHaveBeenCalledWith('/en/dashboard/registry/general-register/doc-1');
  });
});

