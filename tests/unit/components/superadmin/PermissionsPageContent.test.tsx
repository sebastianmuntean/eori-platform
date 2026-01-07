import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../../../setup/test-utils';
import { PermissionsPageContent } from '@/components/superadmin/permissions/PermissionsPageContent';
import { usePermissions } from '@/hooks/usePermissions';
import { useTable } from '@/hooks/useTable';

// Mock hooks
vi.mock('@/hooks/usePermissions');
vi.mock('@/hooks/useTable');

// Mock next-intl
vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl');
  return {
    ...actual,
    useTranslations: vi.fn(() => (key: string) => {
      const translations: Record<string, string> = {
        loading: 'Loading...',
        name: 'Name',
        actions: 'Actions',
        delete: 'Delete',
        cancel: 'Cancel',
        confirmDelete: 'Confirm Delete',
        managePermissions: 'Manage Permissions',
        addPermission: 'Add Permission',
        editPermission: 'Edit Permission',
        noPermissions: 'No permissions available',
        breadcrumbDashboard: 'Dashboard',
        breadcrumbSuperadmin: 'Superadmin',
        permissionsBreadcrumb: 'Permissions',
      };
      return translations[key] || key;
    }),
  };
});

const mockPermissions = [
  {
    id: '1',
    name: 'users.view',
    resource: 'users',
    action: 'view',
    description: 'View users',
  },
  {
    id: '2',
    name: 'users.create',
    resource: 'users',
    action: 'create',
    description: 'Create users',
  },
  {
    id: '3',
    name: 'roles.view',
    resource: 'roles',
    action: 'view',
    description: 'View roles',
  },
];

describe('PermissionsPageContent', () => {
  const mockCreatePermission = vi.fn();
  const mockUpdatePermission = vi.fn();
  const mockDeletePermission = vi.fn();
  const mockBulkDeletePermissions = vi.fn();
  const mockHandleSort = vi.fn();
  const mockHandlePageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (usePermissions as ReturnType<typeof vi.fn>).mockReturnValue({
      permissions: mockPermissions,
      loading: false,
      error: null,
      createPermission: mockCreatePermission,
      updatePermission: mockUpdatePermission,
      deletePermission: mockDeletePermission,
      bulkDeletePermissions: mockBulkDeletePermissions,
    });

    (useTable as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockPermissions,
      page: 1,
      pageSize: 1000,
      totalPages: 1,
      sortConfig: null,
      handleSort: mockHandleSort,
      handlePageChange: mockHandlePageChange,
    });
  });

  describe('Initial Render', () => {
    it('should render permissions page with header and table', () => {
      render(<PermissionsPageContent locale="ro" />);

      expect(screen.getByText('Manage Permissions')).toBeInTheDocument();
      expect(screen.getByText('Add Permission')).toBeInTheDocument();
      expect(screen.getByText('users.view')).toBeInTheDocument();
      expect(screen.getByText('users.create')).toBeInTheDocument();
      expect(screen.getByText('roles.view')).toBeInTheDocument();
    });

    it('should show loading state when loading', () => {
      (usePermissions as ReturnType<typeof vi.fn>).mockReturnValue({
        permissions: [],
        loading: true,
        error: null,
        createPermission: mockCreatePermission,
        updatePermission: mockUpdatePermission,
        deletePermission: mockDeletePermission,
        bulkDeletePermissions: mockBulkDeletePermissions,
      });

      render(<PermissionsPageContent locale="ro" />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should display error message when error occurs', () => {
      (usePermissions as ReturnType<typeof vi.fn>).mockReturnValue({
        permissions: [],
        loading: false,
        error: 'Failed to load permissions',
        createPermission: mockCreatePermission,
        updatePermission: mockUpdatePermission,
        deletePermission: mockDeletePermission,
        bulkDeletePermissions: mockBulkDeletePermissions,
      });

      render(<PermissionsPageContent locale="ro" />);
      expect(screen.getByText('Failed to load permissions')).toBeInTheDocument();
    });
  });

  describe('Permission Selection', () => {
    it('should toggle individual permission selection', () => {
      render(<PermissionsPageContent locale="ro" />);

      const checkboxes = screen.getAllByRole('checkbox');
      const firstPermissionCheckbox = checkboxes[1]; // First is select-all

      fireEvent.click(firstPermissionCheckbox);
      expect(firstPermissionCheckbox).toBeChecked();
    });

    it('should select all permissions when select all is clicked', () => {
      render(<PermissionsPageContent locale="ro" />);

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(selectAllCheckbox);

      const allCheckboxes = screen.getAllByRole('checkbox');
      allCheckboxes.forEach((checkbox) => {
        if (checkbox !== selectAllCheckbox) {
          expect(checkbox).toBeChecked();
        }
      });
    });
  });

  describe('Modal Operations', () => {
    it('should open add modal when add button is clicked', () => {
      render(<PermissionsPageContent locale="ro" />);

      const addButton = screen.getByText('Add Permission');
      fireEvent.click(addButton);

      expect(screen.getByText('Add Permission')).toBeInTheDocument();
    });

    it('should open edit modal when edit button is clicked', () => {
      render(<PermissionsPageContent locale="ro" />);

      const editButtons = screen.getAllByText('Editare');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Edit Permission')).toBeInTheDocument();
    });

    it('should open delete confirmation modal when delete button is clicked', () => {
      render(<PermissionsPageContent locale="ro" />);

      const deleteButtons = screen.getAllByText('Șterge');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });
  });

  describe('Bulk Operations', () => {
    it('should show bulk actions bar when permissions are selected', () => {
      render(<PermissionsPageContent locale="ro" />);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Select first permission
      fireEvent.click(checkboxes[2]); // Select second permission

      expect(screen.getByText(/permisiune/i)).toBeInTheDocument();
    });

    it('should open bulk delete confirmation when bulk delete is clicked', () => {
      render(<PermissionsPageContent locale="ro" />);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Select first permission

      const bulkDeleteButton = screen.getByText(/Șterge selectate/i);
      fireEvent.click(bulkDeleteButton);

      expect(screen.getByText(/Confirmă ștergerea în bulk/i)).toBeInTheDocument();
    });
  });
});

