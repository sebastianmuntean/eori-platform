import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../../../setup/test-utils';
import { UserRolesPageContent } from '@/components/superadmin/user-roles/UserRolesPageContent';
import { useUserRoles } from '@/hooks/useUserRoles';

// Mock hooks
vi.mock('@/hooks/useUserRoles');

// Mock fetch
global.fetch = vi.fn();

// Mock next-intl
vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl');
  return {
    ...actual,
    useTranslations: vi.fn(() => (key: string) => {
      const translations: Record<string, string> = {
        loading: 'Loading...',
        cancel: 'Cancel',
        assign: 'Assign',
        assignRole: 'Assign Role',
        selectRole: 'Select Role',
        userRoles: 'User Roles',
        noRoles: 'No roles',
        noUsers: 'No users available',
        breadcrumbDashboard: 'Dashboard',
        breadcrumbSuperadmin: 'Superadmin',
      };
      return translations[key] || key;
    }),
  };
});

const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    roles: [
      { id: '1', name: 'admin' },
      { id: '2', name: 'user' },
    ],
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    roles: [],
  },
];

describe('UserRolesPageContent', () => {
  const mockAssignRole = vi.fn();
  const mockRemoveRole = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useUserRoles as ReturnType<typeof vi.fn>).mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      assignRole: mockAssignRole,
      removeRole: mockRemoveRole,
      fetchUsers: vi.fn(),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({
        success: true,
        data: [
          { id: '1', name: 'admin' },
          { id: '2', name: 'user' },
        ],
      }),
    });
  });

  describe('Initial Render', () => {
    it('should render user roles page with users list', () => {
      render(<UserRolesPageContent locale="ro" />);

      expect(screen.getByText('Assign User Roles')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    it('should show loading state when loading', () => {
      (useUserRoles as ReturnType<typeof vi.fn>).mockReturnValue({
        users: [],
        loading: true,
        error: null,
        assignRole: mockAssignRole,
        removeRole: mockRemoveRole,
        fetchUsers: vi.fn(),
      });

      render(<UserRolesPageContent locale="ro" />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should display error message when error occurs', () => {
      (useUserRoles as ReturnType<typeof vi.fn>).mockReturnValue({
        users: [],
        loading: false,
        error: 'Failed to load users',
        assignRole: mockAssignRole,
        removeRole: mockRemoveRole,
        fetchUsers: vi.fn(),
      });

      render(<UserRolesPageContent locale="ro" />);
      expect(screen.getByText('Failed to load users')).toBeInTheDocument();
    });
  });

  describe('Role Assignment', () => {
    it('should open assign role modal when button is clicked', () => {
      render(<UserRolesPageContent locale="ro" />);

      const assignButtons = screen.getAllByText('Assign Role');
      fireEvent.click(assignButtons[0]);

      expect(screen.getByText('Assign Role')).toBeInTheDocument();
    });

    it('should call assignRole when form is submitted', async () => {
      mockAssignRole.mockResolvedValue(true);

      render(<UserRolesPageContent locale="ro" />);

      const assignButtons = screen.getAllByText('Assign Role');
      fireEvent.click(assignButtons[0]);

      await waitFor(() => {
        const select = screen.getByLabelText('Select Role');
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByLabelText('Select Role');
      fireEvent.change(select, { target: { value: '1' } });

      const submitButton = screen.getByText('Assign');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAssignRole).toHaveBeenCalledWith('1', '1');
      });
    });
  });

  describe('Role Removal', () => {
    it('should call removeRole when remove button is clicked', () => {
      mockRemoveRole.mockResolvedValue(true);

      render(<UserRolesPageContent locale="ro" />);

      const removeButtons = screen.getAllByText('×');
      fireEvent.click(removeButtons[0]);

      expect(mockRemoveRole).toHaveBeenCalledWith('1', '1');
    });
  });
});

