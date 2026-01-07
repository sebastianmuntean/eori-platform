import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../setup/test-utils';
import userEvent from '@testing-library/user-event';
import { MappingDatasetsPageContent } from '@/components/registry/mapping-datasets/MappingDatasetsPageContent';
import { useMappingDatasets } from '@/hooks/useMappingDatasets';

// Mock hooks
const mockFetchDatasets = vi.fn();
const mockDeleteDataset = vi.fn();

vi.mock('@/hooks/useMappingDatasets', () => ({
  useMappingDatasets: vi.fn(),
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

const mockTranslations = {
  common: {
    breadcrumbDashboard: 'Dashboard',
    loading: 'Loading...',
    search: 'Search',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    showing: 'Showing',
    all: 'All',
    confirmDelete: 'Confirm Delete',
    confirmDeleteMessage: 'Are you sure you want to delete this item?',
    actions: 'Actions',
    createdAt: 'Created At',
    parish: 'Parish',
    no: 'No',
  },
  'online-forms': {
    onlineForms: 'Online Forms',
    mappingDatasets: 'Mapping Datasets',
    createDataset: 'Create Dataset',
    datasetName: 'Dataset Name',
    targetModule: 'Target Module',
    isDefault: 'Is Default',
    mappingsCount: 'Mappings Count',
    noDatasets: 'No datasets found',
    globalTemplate: 'Global Template',
    targetModuleRegistratura: 'Registratura',
    targetModuleGeneralRegister: 'General Register',
    targetModuleEvents: 'Events',
    targetModuleClients: 'Clients',
  },
};

const mockDatasets = [
  {
    id: 'dataset-1',
    name: 'Dataset 1',
    targetModule: 'registratura',
    parishName: 'Parish 1',
    isDefault: true,
    mappings: [{ id: 'mapping-1' }, { id: 'mapping-2' }],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dataset-2',
    name: 'Dataset 2',
    targetModule: 'events',
    parishName: null,
    isDefault: false,
    mappings: [],
    createdAt: '2024-01-02T00:00:00Z',
  },
];

describe('MappingDatasetsPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useMappingDatasets as any).mockReturnValue({
      datasets: mockDatasets,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        totalPages: 1,
        total: 2,
        pageSize: 10,
      },
      fetchDatasets: mockFetchDatasets,
      deleteDataset: mockDeleteDataset.mockResolvedValue(true),
    });
  });

  it('should render the component with datasets list', () => {
    render(<MappingDatasetsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    expect(screen.getByRole('heading', { name: 'Mapping Datasets' })).toBeInTheDocument();
    expect(screen.getByText('Dataset 1')).toBeInTheDocument();
    expect(screen.getByText('Dataset 2')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    (useMappingDatasets as any).mockReturnValue({
      datasets: [],
      loading: true,
      error: null,
      pagination: null,
      fetchDatasets: mockFetchDatasets,
      deleteDataset: mockDeleteDataset,
    });

    render(<MappingDatasetsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render error state', () => {
    (useMappingDatasets as any).mockReturnValue({
      datasets: [],
      loading: false,
      error: 'Failed to load datasets',
      pagination: null,
      fetchDatasets: mockFetchDatasets,
      deleteDataset: mockDeleteDataset,
    });

    render(<MappingDatasetsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    expect(screen.getByText('Failed to load datasets')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    (useMappingDatasets as any).mockReturnValue({
      datasets: [],
      loading: false,
      error: null,
      pagination: null,
      fetchDatasets: mockFetchDatasets,
      deleteDataset: mockDeleteDataset,
    });

    render(<MappingDatasetsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    expect(screen.getByText('No datasets found')).toBeInTheDocument();
  });

  it('should call fetchDatasets on mount', () => {
    render(<MappingDatasetsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    expect(mockFetchDatasets).toHaveBeenCalled();
  });

  it('should navigate to create dataset page when create button is clicked', async () => {
    const user = userEvent.setup();
    render(<MappingDatasetsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    const createButton = screen.getByText('Create Dataset');
    await user.click(createButton);

    expect(mockPush).toHaveBeenCalledWith(
      '/ro/dashboard/registry/online-forms/mapping-datasets/new'
    );
  });

  it('should filter datasets by search term', async () => {
    const user = userEvent.setup();
    render(<MappingDatasetsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'Dataset 1');

    await waitFor(() => {
      expect(mockFetchDatasets).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Dataset 1',
        })
      );
    });
  });

  it('should display mappings count correctly', () => {
    render(<MappingDatasetsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    // Dataset 1 has 2 mappings
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should display global template for datasets without parish', () => {
    render(<MappingDatasetsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    expect(screen.getByText('Global Template')).toBeInTheDocument();
  });

  it('should open delete confirmation modal', async () => {
    const user = userEvent.setup();
    render(<MappingDatasetsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('should delete dataset when confirmed', async () => {
    const user = userEvent.setup();
    render(<MappingDatasetsPageContent locale="ro" />, {
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
      expect(mockDeleteDataset).toHaveBeenCalledWith('dataset-1');
    });
  });

  it('should navigate to edit page when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<MappingDatasetsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);

    expect(mockPush).toHaveBeenCalledWith(
      '/ro/dashboard/registry/online-forms/mapping-datasets/dataset-1'
    );
  });

  it('should cancel delete when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<MappingDatasetsPageContent locale="ro" />, {
      messages: mockTranslations,
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockDeleteDataset).not.toHaveBeenCalled();
    expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
  });
});

