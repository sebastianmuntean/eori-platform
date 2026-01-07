import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../setup/test-utils';
import { ParticipantForm } from '@/components/pilgrimages/ParticipantForm';
import { ParticipantStatus } from '@/hooks/usePilgrimageParticipants';

// Mock translations
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    optional: 'Optional',
    selectClient: 'Select Client',
    firstName: 'First Name',
    lastName: 'Last Name',
    cnp: 'CNP',
    birthDate: 'Birth Date',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    city: 'City',
    county: 'County',
    postalCode: 'Postal Code',
    emergencyContactName: 'Emergency Contact Name',
    emergencyContactPhone: 'Emergency Contact Phone',
    specialNeeds: 'Special Needs',
    participantStatus: 'Status',
    totalAmount: 'Total Amount',
    notes: 'Notes',
    participant: 'Participant',
    participantStatuses: {
      registered: 'Registered',
      confirmed: 'Confirmed',
      paid: 'Paid',
      cancelled: 'Cancelled',
      waitlisted: 'Waitlisted',
    },
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
  };
  return translations[key] || key;
};

const mockTPilgrimages = (key: string) => {
  const translations: Record<string, string> = {
    participant: 'Participant',
    firstName: 'First Name',
    lastName: 'Last Name',
    cnp: 'CNP',
    birthDate: 'Birth Date',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    city: 'City',
    county: 'County',
    postalCode: 'Postal Code',
    emergencyContactName: 'Emergency Contact Name',
    emergencyContactPhone: 'Emergency Contact Phone',
    specialNeeds: 'Special Needs',
    participantStatus: 'Status',
    totalAmount: 'Total Amount',
    notes: 'Notes',
    'participantStatuses.registered': 'Registered',
    'participantStatuses.confirmed': 'Confirmed',
    'participantStatuses.paid': 'Paid',
    'participantStatuses.cancelled': 'Cancelled',
    'participantStatuses.waitlisted': 'Waitlisted',
  };
  return translations[key] || key;
};

const mockClients = [
  { id: '1', firstName: 'John', lastName: 'Doe' },
  { id: '2', firstName: 'Jane', lastName: 'Smith', companyName: 'Acme Corp' },
];

const defaultFormData = {
  parishionerId: '',
  firstName: '',
  lastName: '',
  cnp: '',
  birthDate: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  county: '',
  postalCode: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  specialNeeds: '',
  status: 'registered' as ParticipantStatus,
  totalAmount: '',
  notes: '',
};

describe('ParticipantForm', () => {
  const defaultProps = {
    formData: defaultFormData,
    setFormData: vi.fn(),
    clients: mockClients,
    onSave: vi.fn(),
    onCancel: vi.fn(),
    loading: false,
    t: mockT,
    tPilgrimages: mockTPilgrimages,
  };

  it('should render all form fields', () => {
    render(<ParticipantForm {...defaultProps} />);

    expect(screen.getByText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByText(/CNP/i)).toBeInTheDocument();
    expect(screen.getByText(/Birth Date/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Phone/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Email/i)).toBeInTheDocument();
    expect(screen.getByText(/Address/i)).toBeInTheDocument();
  });

  it('should render client selection dropdown with clients', () => {
    render(<ParticipantForm {...defaultProps} />);

    const selects = screen.getAllByRole('combobox');
    const participantSelect = selects[0];
    expect(participantSelect).toBeInTheDocument();
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith Acme Corp')).toBeInTheDocument();
  });

  it('should call setFormData when input values change', () => {
    const setFormData = vi.fn();
    render(<ParticipantForm {...defaultProps} setFormData={setFormData} />);

    const textboxes = screen.getAllByRole('textbox');
    const firstNameInput = textboxes[0]; // First textbox is firstName
    fireEvent.change(firstNameInput, { target: { value: 'John' } });

    expect(setFormData).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'John' })
    );
  });

  it('should call onSave when save button is clicked', () => {
    const onSave = vi.fn();
    render(<ParticipantForm {...defaultProps} onSave={onSave} />);

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ParticipantForm {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should disable buttons when loading', () => {
    render(<ParticipantForm {...defaultProps} loading={true} />);

    const saveButton = screen.getByText('Saving...');
    const cancelButton = screen.getByText('Cancel');

    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should display current form data values', () => {
    const formData = {
      ...defaultFormData,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    render(<ParticipantForm {...defaultProps} formData={formData} />);

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
  });

  it('should render status dropdown with all status options', () => {
    render(<ParticipantForm {...defaultProps} />);

    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects[1]; // Second select is status
    expect(statusSelect).toBeInTheDocument();

    // Check that status options are available
    const options = Array.from(statusSelect.querySelectorAll('option'));
    expect(options.length).toBeGreaterThan(0);
  });

  it('should handle textarea fields', () => {
    const setFormData = vi.fn();
    render(<ParticipantForm {...defaultProps} setFormData={setFormData} />);

    const textareas = screen.getAllByRole('textbox');
    // Find the notes textarea (it's one of the last textboxes)
    const notesTextarea = textareas.find((el) => 
      el.tagName === 'TEXTAREA' && el.getAttribute('rows') === '3'
    ) || textareas[textareas.length - 1];
    
    fireEvent.change(notesTextarea, { target: { value: 'Test notes' } });

    expect(setFormData).toHaveBeenCalledWith(
      expect.objectContaining({ notes: 'Test notes' })
    );
  });

  it('should mark firstName as required', () => {
    render(<ParticipantForm {...defaultProps} />);

    const textboxes = screen.getAllByRole('textbox');
    const firstNameInput = textboxes[0]; // First textbox is firstName
    expect(firstNameInput).toBeRequired();
  });
});

