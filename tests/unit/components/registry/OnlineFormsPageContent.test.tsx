import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../setup/test-utils';
import userEvent from '@testing-library/user-event';
import { OnlineFormsPageContent } from '@/components/registry/online-forms/OnlineFormsPageContent';
import { useOnlineForms } from '@/hooks/useOnlineForms';
import { useParishes } from '@/hooks/useParishes';
import { useToast } from '@/hooks/useToast';

// Mock hooks
const mockFetchForms = vi.fn();
const mockDeleteForm = vi.fn();
const mockFetchParishes = vi.fn();
const mockSuccess = vi.fn();
const mockRemoveToast = vi.fn();

vi.mock('@/hooks/useOnlineForms', () => ({
  useOnlineForms: vi.fn(),
}));

vi.mock('@/hooks/useParishes', () => ({
  useParishes: vi.fn(),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
  useParams: vi.fn(() => ({ locale: 'ro' })),
}));

// Note: userEvent.setup() will handle clipboard mocking automatically

const mockTranslations = {
  common: {
    breadcrumbDashboard: 'Dashboard',
    loading: 'Loading...',
    search: 'Search',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    active: 'Active',
    inactive: 'Inactive',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    showing: 'Showing',
    allParishes: 'All Parishes',
    allStatuses: 'All Statuses',
    confirmDelete: 'Confirm Delete',
    confirmDeleteMessage: 'Are you sure you want to delete this item?',
    actions: 'Actions',
    status: 'Status',
    createdAt: 'Created At',
    parish: 'Parish',
  },
  'online-forms': {
    onlineForms: 'Online Forms',
    createForm: 'Create Form',
    formName: 'Form Name',
    targetModule: 'Target Module',
    widgetCode: 'Widget Code',
    copyWidgetCode: 'Copy Widget Code',
    widgetCodeCopied: 'Widget code copied to clipboard',
    testForm: 'Test Form',
    noForms: 'No forms found',
    targetModuleRegistratura: 'Registratura',
    targetModuleGeneralRegister: 'General Register',
    targetModuleEvents: 'Events',
    targetModuleClients: 'Clients',
  },
};

const mockForms = [
  {
    id: 'form-1',
    name: 'Test Form 1',
    parishName: 'Parish 1',
    targetModule: 'registratura',
    widgetCode: 'WIDGET-123',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'form-2',
    name: 'Test Form 2',
    parishName: 'Parish 2',
    targetModule: 'events',
    widgetCode: 'WIDGET-456',
    isActive: false,
    createdAt: '2024-01-02T00:00:00Z',
  },
];

const mockParishes = [
  { id: 'parish-1', name: 'Parish 1' },
  { id: 'parish-2', name: 'Parish 2' },
];

describe('OnlineFormsPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useOnlineForms as any).mockReturnValue({
      forms: mockForms,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        totalPages: 1,
        total: 2,
        pageSize: 10,
      },
      fetchForms: mockFetchForms,
      deleteForm: mockDeleteForm.mockResolvedValue(true),
    });
    (useParishes as any).mockReturnValue({
      parishes: mockParishes,
      fetchParishes: mockFetchParishes,
    });
    (useToast as any).mockReturnValue({
      toasts: [],
      success: mockSuccess,
      removeToast: mockRemoveToast,
    });
  });

  it('should render the component with forms list', () => {
    render(<OnlineFormsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    expect(screen.getByRole('heading', { name: 'Online Forms' })).toBeInTheDocument();
    expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    expect(screen.getByText('Test Form 2')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    (useOnlineForms as any).mockReturnValue({
      forms: [],
      loading: true,
      error: null,
      pagination: null,
      fetchForms: mockFetchForms,
      deleteForm: mockDeleteForm,
    });

    render(<OnlineFormsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render error state', () => {
    (useOnlineForms as any).mockReturnValue({
      forms: [],
      loading: false,
      error: 'Failed to load forms',
      pagination: null,
      fetchForms: mockFetchForms,
      deleteForm: mockDeleteForm,
    });

    render(<OnlineFormsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    expect(screen.getByText('Failed to load forms')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    (useOnlineForms as any).mockReturnValue({
      forms: [],
      loading: false,
      error: null,
      pagination: null,
      fetchForms: mockFetchForms,
      deleteForm: mockDeleteForm,
    });

    render(<OnlineFormsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    expect(screen.getByText('No forms found')).toBeInTheDocument();
  });

  it('should call fetchForms on mount', () => {
    render(<OnlineFormsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    expect(mockFetchForms).toHaveBeenCalled();
  });

  it('should navigate to create form page when create button is clicked', async () => {
    const user = userEvent.setup();
    render(<OnlineFormsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    const createButton = screen.getByText('Create Form');
    await user.click(createButton);

    expect(mockPush).toHaveBeenCalledWith('/ro/dashboard/registry/online-forms/new');
  });

  it('should filter forms by search term', async () => {
    const user = userEvent.setup();
    render(<OnlineFormsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'Test Form 1');

    await waitFor(() => {
      expect(mockFetchForms).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Test Form 1',
        })
      );
    });
  });

  it('should copy widget code to clipboard', async () => {
    const user = userEvent.setup();
    render(<OnlineFormsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    const copyButtons = screen.getAllByTitle('Copy Widget Code');
    await user.click(copyButtons[0]);

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalled();
    });
  });

  it('should open delete confirmation modal', async () => {
    const user = userEvent.setup();
    render(<OnlineFormsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('should delete form when confirmed', async () => {
    const user = userEvent.setup();
    render(<OnlineFormsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });

    // Find the delete button in the modal by looking for the one inside the modal
    const modal = screen.getByText('Confirm Delete').closest('[role="dialog"]') || document.body;
    const confirmButton = Array.from(modal.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Delete' && btn.className.includes('danger')
    ) as HTMLButtonElement;
    
    expect(confirmButton).toBeTruthy();
    await user.click(confirmButton!);

    await waitFor(() => {
      expect(mockDeleteForm).toHaveBeenCalledWith('form-1');
    });
  });

  it('should navigate to edit page when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<OnlineFormsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);

    expect(mockPush).toHaveBeenCalledWith('/ro/dashboard/registry/online-forms/form-1');
  });

  it('should navigate to test page when test button is clicked', async () => {
    const user = userEvent.setup();
    render(<OnlineFormsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    const testButtons = screen.getAllByText('Test Form');
    await user.click(testButtons[0]);

    expect(mockPush).toHaveBeenCalledWith('/ro/dashboard/registry/online-forms/form-1/test');
  });
});

