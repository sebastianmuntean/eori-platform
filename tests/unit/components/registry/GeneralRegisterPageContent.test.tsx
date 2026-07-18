import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../setup/test-utils';
import { GeneralRegisterPageContent } from '@/components/registry/general-register/GeneralRegisterPageContent';

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

// Mock GeneralRegisterList (component under test uses this, not DocumentList)
vi.mock('@/components/registry/GeneralRegisterList', () => ({
  GeneralRegisterList: ({ onDocumentClick, onCreateNew }: {
    onDocumentClick: (doc: { id: string }) => void;
    onCreateNew: () => void;
  }) => (
    <div data-testid="document-list">
      <button onClick={() => onDocumentClick({ id: 'doc-1' })}>Click Document</button>
      <button onClick={onCreateNew}>Create New</button>
    </div>
  ),
}));

describe('GeneralRegisterPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component with correct structure', () => {
    render(<GeneralRegisterPageContent locale="ro" />);

    expect(screen.getByTestId('document-list')).toBeInTheDocument();
  });

  it('should call router.push when document is clicked', () => {
    render(<GeneralRegisterPageContent locale="ro" />);

    const clickButton = screen.getByText('Click Document');
    clickButton.click();

    expect(mockPush).toHaveBeenCalledWith('/ro/dashboard/registry/general-register/doc-1');
  });

  it('should call router.push when create new is clicked', () => {
    render(<GeneralRegisterPageContent locale="ro" />);

    const createButton = screen.getByText('Create New');
    createButton.click();

    expect(mockPush).toHaveBeenCalledWith('/ro/dashboard/registry/general-register/new');
  });

  it('should use correct locale in navigation', () => {
    render(<GeneralRegisterPageContent locale="en" />);

    const clickButton = screen.getByText('Click Document');
    clickButton.click();

    expect(mockPush).toHaveBeenCalledWith('/en/dashboard/registry/general-register/doc-1');
  });
});
