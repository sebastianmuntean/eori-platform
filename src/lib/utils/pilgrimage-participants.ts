import { ParticipantStatus, PaymentStatus } from '@/hooks/usePilgrimageParticipants';

/**
 * Participant status variant mapping for Badge components
 */
export const PARTICIPANT_STATUS_VARIANTS: Record<
  ParticipantStatus,
  'warning' | 'success' | 'danger' | 'secondary' | 'primary'
> = {
  registered: 'secondary',
  confirmed: 'primary',
  paid: 'success',
  cancelled: 'danger',
  waitlisted: 'warning',
};

/**
 * Payment status variant mapping for Badge components
 */
export const PARTICIPANT_PAYMENT_STATUS_VARIANTS: Record<
  PaymentStatus,
  'warning' | 'success' | 'danger' | 'secondary'
> = {
  pending: 'secondary',
  partial: 'warning',
  paid: 'success',
  refunded: 'danger',
};

/**
 * Transform participant form data to API format
 * Converts empty strings to null for optional fields
 */
export function transformParticipantFormData(formData: {
  parishionerId: string;
  firstName: string;
  lastName: string;
  cnp: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  county: string;
  postalCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  specialNeeds: string;
  status: ParticipantStatus;
  totalAmount: string;
  notes: string;
}) {
  return {
    ...formData,
    parishionerId: formData.parishionerId || null,
    lastName: formData.lastName || null,
    cnp: formData.cnp || null,
    birthDate: formData.birthDate || null,
    phone: formData.phone || null,
    email: formData.email || null,
    address: formData.address || null,
    city: formData.city || null,
    county: formData.county || null,
    postalCode: formData.postalCode || null,
    emergencyContactName: formData.emergencyContactName || null,
    emergencyContactPhone: formData.emergencyContactPhone || null,
    specialNeeds: formData.specialNeeds || null,
    totalAmount: formData.totalAmount || null,
    notes: formData.notes || null,
  };
}

/**
 * Get initial participant form data
 */
export function getInitialParticipantFormData(): {
  parishionerId: string;
  firstName: string;
  lastName: string;
  cnp: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  county: string;
  postalCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  specialNeeds: string;
  status: ParticipantStatus;
  totalAmount: string;
  notes: string;
} {
  return {
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
    status: 'registered',
    totalAmount: '',
    notes: '',
  };
}

