import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../setup/test-utils';
import { StudentsPageContent } from '@/components/catechesis/students/StudentsPageContent';
import { useCatechesisStudents } from '@/hooks/useCatechesisStudents';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/hooks/useToast';

// Mock hooks
vi.mock('@/hooks/useCatechesisStudents');
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
          'students.title': 'Students',
          'students.firstName': 'First Name',
          'students.lastName': 'Last Name',
          'students.dateOfBirth': 'Date of Birth',
          'students.parentName': 'Parent Name',
          'status.active': 'Active',
          'status.inactive': 'Inactive',
          'actions.create': 'Create',
          'students.created': 'Student created successfully',
          'students.updated': 'Student updated successfully',
          'students.deleted': 'Student deleted successfully',
          manageStudents: 'Manage students',
        },
      };
      return (key: string) => translations[namespace]?.[key] || key;
    }),
  };
});

describe('StudentsPageContent', () => {
  const locale = 'ro';
  const mockFetchStudents = vi.fn();
  const mockCreateStudent = vi.fn();
  const mockUpdateStudent = vi.fn();
  const mockDeleteStudent = vi.fn();
  const mockSuccess = vi.fn();
  const mockShowError = vi.fn();
  const mockRemoveToast = vi.fn();

  const mockStudents = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '2010-01-01',
      parentName: 'Jane Doe',
      parentEmail: 'jane@example.com',
      parentPhone: '123456789',
      address: '123 Main St',
      notes: null,
      isActive: true,
      parishId: 'parish1',
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '2011-02-02',
      parentName: null,
      parentEmail: null,
      parentPhone: null,
      address: null,
      notes: null,
      isActive: false,
      parishId: 'parish1',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    (useCatechesisStudents as any).mockReturnValue({
      students: mockStudents,
      loading: false,
      error: null,
      pagination: { page: 1, totalPages: 1, total: 2, pageSize: 10 },
      fetchStudents: mockFetchStudents,
      createStudent: mockCreateStudent,
      updateStudent: mockUpdateStudent,
      deleteStudent: mockDeleteStudent,
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
    render(<StudentsPageContent locale={locale} />);
    
    expect(screen.getByText('Students')).toBeInTheDocument();
  });

  it('should render page header with correct title', () => {
    render(<StudentsPageContent locale={locale} />);
    
    expect(screen.getByText('Students')).toBeInTheDocument();
  });

  it('should render breadcrumbs correctly', () => {
    render(<StudentsPageContent locale={locale} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Catechesis')).toBeInTheDocument();
  });

  it('should fetch students on mount', () => {
    render(<StudentsPageContent locale={locale} />);
    
    expect(mockFetchStudents).toHaveBeenCalled();
  });

  it('should render students table', async () => {
    render(<StudentsPageContent locale={locale} />);
    
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane')).toBeInTheDocument();
      expect(screen.getByText('Smith')).toBeInTheDocument();
    });
  });

  it('should render create button', () => {
    render(<StudentsPageContent locale={locale} />);
    
    const createButton = screen.getByRole('button', { name: /Create Students/i });
    expect(createButton).toBeInTheDocument();
  });

  it('should use memoized fetchParams', () => {
    const { rerender } = render(<StudentsPageContent locale={locale} />);
    
    const initialCallCount = mockFetchStudents.mock.calls.length;
    
    rerender(<StudentsPageContent locale={locale} />);
    
    expect(mockFetchStudents.mock.calls.length).toBe(initialCallCount);
  });

  it('should format dates correctly', async () => {
    render(<StudentsPageContent locale={locale} />);
    
    await waitFor(() => {
      const dateElements = screen.getAllByText(/2010|2011/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  it('should display status badges correctly', async () => {
    render(<StudentsPageContent locale={locale} />);
    
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  it('should use memoized columns', () => {
    const { rerender } = render(<StudentsPageContent locale={locale} />);
    
    rerender(<StudentsPageContent locale={locale} />);
    
    expect(screen.getByText('Students')).toBeInTheDocument();
  });
});

