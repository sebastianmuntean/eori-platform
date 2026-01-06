import { Pilgrimage, PilgrimageStatus } from '@/hooks/usePilgrimages';
import { PilgrimageFormData } from '@/components/pilgrimages/PilgrimageForm';

/**
 * Transform form data to API format
 * Converts string fields to appropriate types and handles null values
 */
export function transformFormDataToApi(data: PilgrimageFormData): Partial<Pilgrimage> {
  return {
    ...data,
    description: data.description || null,
    destination: data.destination || null,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    registrationDeadline: data.registrationDeadline || null,
    maxParticipants: data.maxParticipants ? parseInt(data.maxParticipants, 10) : null,
    minParticipants: data.minParticipants ? parseInt(data.minParticipants, 10) : null,
    pricePerPerson: data.pricePerPerson || null,
    organizerName: data.organizerName || null,
    organizerContact: data.organizerContact || null,
    notes: data.notes || null,
  };
}

/**
 * Transform pilgrimage entity to form data
 * Converts number fields to strings and handles null values
 */
export function transformPilgrimageToFormData(pilgrimage: Pilgrimage): PilgrimageFormData {
  return {
    parishId: pilgrimage.parishId,
    title: pilgrimage.title,
    description: pilgrimage.description || '',
    destination: pilgrimage.destination || '',
    startDate: pilgrimage.startDate || '',
    endDate: pilgrimage.endDate || '',
    registrationDeadline: pilgrimage.registrationDeadline || '',
    maxParticipants: pilgrimage.maxParticipants?.toString() || '',
    minParticipants: pilgrimage.minParticipants?.toString() || '',
    status: pilgrimage.status,
    pricePerPerson: pilgrimage.pricePerPerson || '',
    currency: pilgrimage.currency || 'RON',
    organizerName: pilgrimage.organizerName || '',
    organizerContact: pilgrimage.organizerContact || '',
    notes: pilgrimage.notes || '',
  };
}

/**
 * Get initial form data for new pilgrimage
 */
export function getInitialPilgrimageFormData(): PilgrimageFormData {
  return {
    parishId: '',
    title: '',
    description: '',
    destination: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    maxParticipants: '',
    minParticipants: '',
    status: 'draft',
    pricePerPerson: '',
    currency: 'RON',
    organizerName: '',
    organizerContact: '',
    notes: '',
  };
}

/**
 * Status variant mapping for Badge components
 */
export const PILGRIMAGE_STATUS_VARIANTS: Record<PilgrimageStatus, 'warning' | 'success' | 'danger' | 'secondary' | 'primary'> = {
  draft: 'secondary',
  open: 'primary',
  closed: 'warning',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'danger',
};

/**
 * Calculate status counts from pilgrimages array
 * Optimized using reduce for better performance
 */
export function calculateStatusCounts(pilgrimages: Pilgrimage[]) {
  return pilgrimages.reduce(
    (acc, pilgrimage) => {
      if (pilgrimage.status === 'open') acc.open++;
      if (pilgrimage.status === 'in_progress') acc.in_progress++;
      if (pilgrimage.status === 'completed') acc.completed++;
      return acc;
    },
    { open: 0, in_progress: 0, completed: 0 }
  );
}





