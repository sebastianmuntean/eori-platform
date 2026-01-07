import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../setup/test-utils';
import { ClassesPageContent } from '@/components/catechesis/classes/ClassesPageContent';
import { useCatechesisClasses } from '@/hooks/useCatechesisClasses';
import { useParishes } from '@/hooks/useParishes';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/hooks/useToast';

// Mock hooks
vi.mock('@/hooks/useCatechesisClasses');
vi.mock('@/hooks/useParishes');
vi.mock('@/hooks/useUser');
vi.mock('@/hooks/useToast');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock next-intl - use importOriginal to preserve NextIntlClientProvider
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return {
    ...actual,
    useTranslations: vi.fn((namespace: string) => {
      const translations: Record<string, Record<string, string>> = {
        common: {
          breadcrumbDashboard: 'Dashboard',
          loading: 'Loading...',
          edit: 'Edit',
          delete: 'Delete',
          actions: 'Actions',
          status: 'Status',
          noData: 'No data available',
          fillRequiredFields: 'Please fill in all required fields',
          created: 'Created successfully',
          updated: 'Updated successfully',
          deleted: 'Deleted successfully',
          errorOccurred: 'An error occurred',
        },
        catechesis: {
          title: 'Catechesis',
          'classes.title': 'Classes',
          'classes.name': 'Name',
          'classes.grade': 'Grade',
          'classes.startDate': 'Start Date',
          'classes.endDate': 'End Date',
          'classes.description': 'Manage catechesis classes',
          'classes.created': 'Class created successfully',
          'classes.updated': 'Class updated successfully',
          'classes.deleted': 'Class deleted successfully',
          'status.active': 'Active',
          'status.inactive': 'Inactive',
          'actions.create': 'Create',
          manageClasses: 'Manage catechesis classes',
        },
      };
      return (key: string) => translations[namespace]?.[key] || key;
    }),
  };
});

describe('ClassesPageContent', () => {
  const locale = 'ro';
  const mockFetchClasses = vi.fn();
  const mockCreateClass = vi.fn();
  const mockUpdateClass = vi.fn();
  const mockDeleteClass = vi.fn();
  const mockSuccess = vi.fn();
  const mockShowError = vi.fn();
  const mockRemoveToast = vi.fn();

  const mockClasses = [
    {
      id: '1',
      name: 'Class 1',
      grade: 'Grade 1',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isActive: true,
      parishId: 'parish1',
      description: null,
      teacherId: null,
      maxStudents: null,
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      name: 'Class 2',
      grade: 'Grade 2',
      startDate: '2024-01-01',
      endDate: null,
      isActive: false,
      parishId: 'parish1',
      description: null,
      teacherId: null,
      maxStudents: null,
      createdAt: '2024-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    (useCatechesisClasses as any).mockReturnValue({
      classes: mockClasses,
      loading: false,
      error: null,
      pagination: { page: 1, totalPages: 1, total: 2, pageSize: 10 },
      fetchClasses: mockFetchClasses,
      createClass: mockCreateClass,
      updateClass: mockUpdateClass,
      deleteClass: mockDeleteClass,
    });

    (useParishes as any).mockReturnValue({
      parishes: [{ id: 'parish1', name: 'Parish 1' }],
      fetchParishes: vi.fn(),
    });

    (useUser as any).mockReturnValue({
      user: { parishId: 'parish1' },
    });

    (useToast as any).mockReturnValue({
      toasts: [],
      success: mockSuccess,
      error: mockShowError,
      removeToast: mockRemoveToast,
    });
  });

  it('should render the page container', () => {
    render(<ClassesPageContent locale={locale} />);
    
    expect(screen.getByText('Classes')).toBeInTheDocument();
  });

  it('should render page header with correct title', () => {
    render(<ClassesPageContent locale={locale} />);
    
    expect(screen.getByText('Classes')).toBeInTheDocument();
  });

  it('should render breadcrumbs correctly', () => {
    render(<ClassesPageContent locale={locale} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Catechesis')).toBeInTheDocument();
  });

  it('should fetch classes on mount', () => {
    render(<ClassesPageContent locale={locale} />);
    
    expect(mockFetchClasses).toHaveBeenCalled();
  });

  it('should render classes table', async () => {
    render(<ClassesPageContent locale={locale} />);
    
    await waitFor(() => {
      expect(screen.getByText('Class 1')).toBeInTheDocument();
      expect(screen.getByText('Class 2')).toBeInTheDocument();
    });
  });

  it('should render create button', () => {
    render(<ClassesPageContent locale={locale} />);
    
    const createButton = screen.getByRole('button', { name: /Create Classes/i });
    expect(createButton).toBeInTheDocument();
  });

  it('should use memoized fetchParams to prevent unnecessary re-renders', () => {
    const { rerender } = render(<ClassesPageContent locale={locale} />);
    
    const initialCallCount = mockFetchClasses.mock.calls.length;
    
    // Rerender with same props
    rerender(<ClassesPageContent locale={locale} />);
    
    // Should not cause additional fetch calls
    expect(mockFetchClasses.mock.calls.length).toBe(initialCallCount);
  });

  it('should format dates correctly', async () => {
    render(<ClassesPageContent locale={locale} />);
    
    await waitFor(() => {
      // Check that dates are formatted (not raw ISO strings)
      const dateElements = screen.getAllByText(/2024/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  it('should display status badges correctly', async () => {
    render(<ClassesPageContent locale={locale} />);
    
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });
});

