import { Donation } from '@/hooks/useDonations';
import { DonationFormData } from '@/lib/validations/donations';
import { CreateDonationData, UpdateDonationData } from '@/lib/types/payments';

/**
 * Create empty donation form data
 */
export function createEmptyDonationFormData(): DonationFormData {
  return {
    parishId: '',
    paymentNumber: '',
    date: new Date().toISOString().split('T')[0],
    clientId: '',
    amount: '',
    currency: 'RON',
    description: '',
    paymentMethod: '',
    referenceNumber: '',
    status: 'pending',
  };
}

/**
 * Map donation data to form data
 */
export function donationToFormData(donation: Donation): DonationFormData {
  return {
    parishId: donation.parishId,
    paymentNumber: donation.paymentNumber,
    date: donation.date,
    clientId: donation.clientId || '',
    amount: donation.amount,
    currency: donation.currency,
    description: donation.description || '',
    paymentMethod: donation.paymentMethod || '',
    referenceNumber: donation.referenceNumber || '',
    status: donation.status,
  };
}

/**
 * Convert form data to create data
 */
export function donationFormDataToCreateData(formData: DonationFormData): CreateDonationData {
  return {
    parishId: formData.parishId,
    paymentNumber: formData.paymentNumber,
    date: formData.date,
    clientId: formData.clientId || null,
    amount: parseFloat(formData.amount) || 0,
    currency: formData.currency,
    description: formData.description || null,
    paymentMethod: formData.paymentMethod || null,
    referenceNumber: formData.referenceNumber || null,
    status: formData.status,
  };
}

/**
 * Convert form data to update data
 */
export function donationFormDataToUpdateData(formData: DonationFormData): UpdateDonationData {
  return donationFormDataToCreateData(formData);
}

