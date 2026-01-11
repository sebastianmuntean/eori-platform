import { describe, it, expect } from 'vitest';
import {
  PARTICIPANT_STATUS_VARIANTS,
  PARTICIPANT_PAYMENT_STATUS_VARIANTS,
  transformParticipantFormData,
  getInitialParticipantFormData,
} from '@/lib/utils/pilgrimage-participants';
import { ParticipantStatus, PaymentStatus } from '@/hooks/usePilgrimageParticipants';

describe('pilgrimage-participants utilities', () => {
  describe('PARTICIPANT_STATUS_VARIANTS', () => {
    it('should have correct variant for all participant statuses', () => {
      expect(PARTICIPANT_STATUS_VARIANTS.registered).toBe('secondary');
      expect(PARTICIPANT_STATUS_VARIANTS.confirmed).toBe('primary');
      expect(PARTICIPANT_STATUS_VARIANTS.paid).toBe('success');
      expect(PARTICIPANT_STATUS_VARIANTS.cancelled).toBe('danger');
      expect(PARTICIPANT_STATUS_VARIANTS.waitlisted).toBe('warning');
    });

    it('should have all required participant statuses', () => {
      const statuses: ParticipantStatus[] = ['registered', 'confirmed', 'paid', 'cancelled', 'waitlisted'];
      statuses.forEach((status) => {
        expect(PARTICIPANT_STATUS_VARIANTS).toHaveProperty(status);
        expect(typeof PARTICIPANT_STATUS_VARIANTS[status]).toBe('string');
      });
    });
  });

  describe('PARTICIPANT_PAYMENT_STATUS_VARIANTS', () => {
    it('should have correct variant for all payment statuses', () => {
      expect(PARTICIPANT_PAYMENT_STATUS_VARIANTS.pending).toBe('secondary');
      expect(PARTICIPANT_PAYMENT_STATUS_VARIANTS.partial).toBe('warning');
      expect(PARTICIPANT_PAYMENT_STATUS_VARIANTS.paid).toBe('success');
      expect(PARTICIPANT_PAYMENT_STATUS_VARIANTS.refunded).toBe('danger');
    });

    it('should have all required payment statuses', () => {
      const statuses: PaymentStatus[] = ['pending', 'partial', 'paid', 'refunded'];
      statuses.forEach((status) => {
        expect(PARTICIPANT_PAYMENT_STATUS_VARIANTS).toHaveProperty(status);
        expect(typeof PARTICIPANT_PAYMENT_STATUS_VARIANTS[status]).toBe('string');
      });
    });
  });

  describe('transformParticipantFormData', () => {
    it('should transform form data with all fields filled', () => {
      const formData = {
        parishionerId: 'parish-1',
        firstName: 'John',
        lastName: 'Doe',
        cnp: '1234567890123',
        birthDate: '1990-01-01',
        phone: '1234567890',
        email: 'john@example.com',
        address: '123 Main St',
        city: 'Bucharest',
        county: 'Bucharest',
        postalCode: '123456',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '0987654321',
        specialNeeds: 'Wheelchair access',
        status: 'registered' as ParticipantStatus,
        totalAmount: '1000',
        notes: 'Test notes',
      };

      const result = transformParticipantFormData(formData);

      expect(result.parishionerId).toBe('parish-1');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.status).toBe('registered');
    });

    it('should convert empty strings to null for optional fields', () => {
      const formData = {
        parishionerId: '',
        firstName: 'John',
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

      const result = transformParticipantFormData(formData);

      expect(result.parishionerId).toBeNull();
      expect(result.lastName).toBeNull();
      expect(result.cnp).toBeNull();
      expect(result.birthDate).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.email).toBeNull();
      expect(result.address).toBeNull();
      expect(result.city).toBeNull();
      expect(result.county).toBeNull();
      expect(result.postalCode).toBeNull();
      expect(result.emergencyContactName).toBeNull();
      expect(result.emergencyContactPhone).toBeNull();
      expect(result.specialNeeds).toBeNull();
      expect(result.totalAmount).toBeNull();
      expect(result.notes).toBeNull();
    });

    it('should preserve non-empty optional fields', () => {
      const formData = {
        parishionerId: '',
        firstName: 'John',
        lastName: 'Doe',
        cnp: '1234567890123',
        birthDate: '1990-01-01',
        phone: '1234567890',
        email: 'john@example.com',
        address: '123 Main St',
        city: 'Bucharest',
        county: 'Bucharest',
        postalCode: '123456',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '0987654321',
        specialNeeds: 'Wheelchair access',
        status: 'confirmed' as ParticipantStatus,
        totalAmount: '1000',
        notes: 'Test notes',
      };

      const result = transformParticipantFormData(formData);

      expect(result.lastName).toBe('Doe');
      expect(result.cnp).toBe('1234567890123');
      expect(result.email).toBe('john@example.com');
      expect(result.totalAmount).toBe('1000');
    });

    it('should preserve required fields as-is', () => {
      const formData = {
        parishionerId: '',
        firstName: 'John',
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

      const result = transformParticipantFormData(formData);

      expect(result.firstName).toBe('John');
      expect(result.status).toBe('registered');
    });
  });

  describe('getInitialParticipantFormData', () => {
    it('should return form data with all empty strings and default status', () => {
      const result = getInitialParticipantFormData();

      expect(result.parishionerId).toBe('');
      expect(result.firstName).toBe('');
      expect(result.lastName).toBe('');
      expect(result.cnp).toBe('');
      expect(result.birthDate).toBe('');
      expect(result.phone).toBe('');
      expect(result.email).toBe('');
      expect(result.address).toBe('');
      expect(result.city).toBe('');
      expect(result.county).toBe('');
      expect(result.postalCode).toBe('');
      expect(result.emergencyContactName).toBe('');
      expect(result.emergencyContactPhone).toBe('');
      expect(result.specialNeeds).toBe('');
      expect(result.status).toBe('registered');
      expect(result.totalAmount).toBe('');
      expect(result.notes).toBe('');
    });

    it('should return a new object each time (not shared reference)', () => {
      const result1 = getInitialParticipantFormData();
      const result2 = getInitialParticipantFormData();

      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });

    it('should allow mutation without affecting other instances', () => {
      const result1 = getInitialParticipantFormData();
      const result2 = getInitialParticipantFormData();

      result1.firstName = 'John';
      result2.firstName = 'Jane';

      expect(result1.firstName).toBe('John');
      expect(result2.firstName).toBe('Jane');
    });
  });
});


