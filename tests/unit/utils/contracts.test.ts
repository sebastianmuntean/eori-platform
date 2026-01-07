import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEmptyContractFormData,
  contractToFormData,
  getClientNameById,
  validateContractForm,
  prepareContractUpdateData,
} from '@/lib/utils/contracts';
import { Contract } from '@/hooks/useContracts';
import { Client } from '@/hooks/useClients';
import { ContractFormData } from '@/components/accounting/ContractFormFields';

describe('contracts utilities', () => {
  describe('createEmptyContractFormData', () => {
    it('should create empty form data with default values', () => {
      const formData = createEmptyContractFormData();

      expect(formData.parishId).toBe('');
      expect(formData.contractNumber).toBe('');
      expect(formData.direction).toBe('incoming');
      expect(formData.type).toBe('rental');
      expect(formData.status).toBe('draft');
      expect(formData.clientId).toBe('');
      expect(formData.title).toBe('');
      expect(formData.startDate).toBeTruthy();
      expect(formData.endDate).toBe('');
      expect(formData.amount).toBe('');
      expect(formData.currency).toBe('RON');
      expect(formData.paymentFrequency).toBe('monthly');
      expect(formData.autoRenewal).toBe(false);
      expect(formData.invoiceItemTemplate).toBeNull();
    });

    it('should set startDate to today in ISO format', () => {
      const formData = createEmptyContractFormData();
      const today = new Date().toISOString().split('T')[0];

      expect(formData.startDate).toBe(today);
    });
  });

  describe('contractToFormData', () => {
    const mockContract: Contract = {
      id: 'contract-1',
      parishId: 'parish-1',
      contractNumber: 'CONTRACT-001',
      direction: 'incoming',
      type: 'rental',
      status: 'active',
      clientId: 'client-1',
      title: 'Test Contract',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      signingDate: '2024-01-01',
      amount: '1000.00',
      currency: 'RON',
      paymentFrequency: 'monthly',
      assetReference: 'ASSET-001',
      description: 'Test description',
      terms: 'Test terms',
      notes: 'Test notes',
      renewalDate: '2025-01-01',
      autoRenewal: true,
      parentContractId: 'parent-1',
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: 'user-1',
    };

    it('should convert contract to form data correctly', () => {
      const formData = contractToFormData(mockContract);

      expect(formData.parishId).toBe(mockContract.parishId);
      expect(formData.contractNumber).toBe(mockContract.contractNumber);
      expect(formData.direction).toBe(mockContract.direction);
      expect(formData.type).toBe(mockContract.type);
      expect(formData.status).toBe(mockContract.status);
      expect(formData.clientId).toBe(mockContract.clientId);
      expect(formData.title).toBe(mockContract.title);
      expect(formData.startDate).toBe(mockContract.startDate);
      expect(formData.endDate).toBe(mockContract.endDate);
      expect(formData.amount).toBe(mockContract.amount);
      expect(formData.currency).toBe(mockContract.currency);
      expect(formData.paymentFrequency).toBe(mockContract.paymentFrequency);
      expect(formData.autoRenewal).toBe(mockContract.autoRenewal);
    });

    it('should handle null title', () => {
      const contractWithNullTitle = { ...mockContract, title: null };
      const formData = contractToFormData(contractWithNullTitle);

      expect(formData.title).toBe('');
    });

    it('should handle null signingDate', () => {
      const contractWithNullSigningDate = { ...mockContract, signingDate: null };
      const formData = contractToFormData(contractWithNullSigningDate);

      expect(formData.signingDate).toBe('');
    });
  });

  describe('getClientNameById', () => {
    const mockClients: Client[] = [
      {
        id: 'client-1',
        code: 'CLI001',
        firstName: 'John',
        lastName: 'Doe',
        companyName: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'client-2',
        code: 'CLI002',
        firstName: null,
        lastName: null,
        companyName: 'Test Company',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'client-3',
        code: 'CLI003',
        firstName: '',
        lastName: '',
        companyName: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return client name for person client', () => {
      const name = getClientNameById('client-1', mockClients);
      expect(name).toBe('John Doe');
    });

    it('should return company name for company client', () => {
      const name = getClientNameById('client-2', mockClients);
      expect(name).toBe('Test Company');
    });

    it('should return code when no name available', () => {
      const name = getClientNameById('client-3', mockClients);
      expect(name).toBe('CLI003');
    });

    it('should return "-" for null clientId', () => {
      const name = getClientNameById(null, mockClients);
      expect(name).toBe('-');
    });

    it('should return clientId when client not found', () => {
      const name = getClientNameById('non-existent', mockClients);
      expect(name).toBe('non-existent');
    });

    it('should handle empty clients array', () => {
      const name = getClientNameById('client-1', []);
      expect(name).toBe('client-1');
    });
  });

  describe('validateContractForm', () => {
    it('should validate valid form data', () => {
      const formData: ContractFormData = {
        parishId: 'parish-1',
        contractNumber: 'CONTRACT-001',
        direction: 'incoming',
        type: 'rental',
        status: 'draft',
        clientId: 'client-1',
        title: 'Test',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        signingDate: '',
        amount: '1000.00',
        currency: 'RON',
        paymentFrequency: 'monthly',
        assetReference: '',
        description: '',
        terms: '',
        notes: '',
        renewalDate: '',
        autoRenewal: false,
        parentContractId: '',
        invoiceItemTemplate: null,
      };

      const result = validateContractForm(formData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing parishId', () => {
      const formData = createEmptyContractFormData();
      formData.parishId = '';

      const result = validateContractForm(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('parishId');
    });

    it('should detect missing contractNumber', () => {
      const formData = createEmptyContractFormData();
      formData.parishId = 'parish-1';
      formData.contractNumber = '';

      const result = validateContractForm(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('contractNumber');
    });

    it('should detect whitespace-only contractNumber', () => {
      const formData = createEmptyContractFormData();
      formData.parishId = 'parish-1';
      formData.contractNumber = '   ';

      const result = validateContractForm(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('contractNumber');
    });

    it('should detect missing startDate', () => {
      const formData = createEmptyContractFormData();
      formData.parishId = 'parish-1';
      formData.contractNumber = 'CONTRACT-001';
      formData.startDate = '';

      const result = validateContractForm(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('startDate');
    });

    it('should detect missing endDate', () => {
      const formData = createEmptyContractFormData();
      formData.parishId = 'parish-1';
      formData.contractNumber = 'CONTRACT-001';
      formData.startDate = '2024-01-01';
      formData.endDate = '';

      const result = validateContractForm(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('endDate');
    });

    it('should detect missing amount', () => {
      const formData = createEmptyContractFormData();
      formData.parishId = 'parish-1';
      formData.contractNumber = 'CONTRACT-001';
      formData.startDate = '2024-01-01';
      formData.endDate = '2024-12-31';
      formData.amount = '';

      const result = validateContractForm(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('amount');
    });

    it('should detect zero amount', () => {
      const formData = createEmptyContractFormData();
      formData.parishId = 'parish-1';
      formData.contractNumber = 'CONTRACT-001';
      formData.startDate = '2024-01-01';
      formData.endDate = '2024-12-31';
      formData.amount = '0';

      const result = validateContractForm(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('amount');
    });

    it('should detect negative amount', () => {
      const formData = createEmptyContractFormData();
      formData.parishId = 'parish-1';
      formData.contractNumber = 'CONTRACT-001';
      formData.startDate = '2024-01-01';
      formData.endDate = '2024-12-31';
      formData.amount = '-100';

      const result = validateContractForm(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('amount');
    });

    it('should detect multiple errors', () => {
      const formData = createEmptyContractFormData();
      formData.startDate = ''; // Explicitly set to empty to test validation

      const result = validateContractForm(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('parishId');
      expect(result.errors).toContain('contractNumber');
      expect(result.errors).toContain('startDate');
      expect(result.errors).toContain('endDate');
      expect(result.errors).toContain('amount');
    });
  });

  describe('prepareContractUpdateData', () => {
    it('should prepare update data correctly', () => {
      const formData: ContractFormData = {
        parishId: 'parish-1',
        contractNumber: 'CONTRACT-001',
        direction: 'incoming',
        type: 'rental',
        status: 'active',
        clientId: 'client-1',
        title: 'Test Contract',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        signingDate: '2024-01-01',
        amount: '1000.00',
        currency: 'RON',
        paymentFrequency: 'monthly',
        assetReference: 'ASSET-001',
        description: 'Test description',
        terms: 'Test terms',
        notes: 'Test notes',
        renewalDate: '2025-01-01',
        autoRenewal: true,
        parentContractId: 'parent-1',
        invoiceItemTemplate: null,
      };

      const updateData = prepareContractUpdateData(formData);

      expect(updateData.parishId).toBe(formData.parishId);
      expect(updateData.contractNumber).toBe(formData.contractNumber);
      expect(updateData.direction).toBe(formData.direction);
      expect(updateData.type).toBe(formData.type);
      expect(updateData.status).toBe(formData.status);
      expect(updateData.clientId).toBe(formData.clientId);
      expect(updateData.title).toBe(formData.title);
      expect(updateData.startDate).toBe(formData.startDate);
      expect(updateData.endDate).toBe(formData.endDate);
      expect(updateData.amount).toBe(formData.amount);
      expect(updateData.currency).toBe(formData.currency);
      expect(updateData.paymentFrequency).toBe(formData.paymentFrequency);
      expect(updateData.autoRenewal).toBe(formData.autoRenewal);
    });

    it('should convert empty strings to null for optional fields', () => {
      const formData = createEmptyContractFormData();
      formData.parishId = 'parish-1';
      formData.contractNumber = 'CONTRACT-001';
      formData.startDate = '2024-01-01';
      formData.endDate = '2024-12-31';
      formData.amount = '1000.00';
      formData.title = '';
      formData.signingDate = '';
      formData.description = '';

      const updateData = prepareContractUpdateData(formData);

      expect(updateData.title).toBeNull();
      expect(updateData.signingDate).toBeNull();
      expect(updateData.description).toBeNull();
    });

    it('should preserve non-empty optional fields', () => {
      const formData = createEmptyContractFormData();
      formData.parishId = 'parish-1';
      formData.contractNumber = 'CONTRACT-001';
      formData.startDate = '2024-01-01';
      formData.endDate = '2024-12-31';
      formData.amount = '1000.00';
      formData.title = 'Test Title';
      formData.description = 'Test Description';

      const updateData = prepareContractUpdateData(formData);

      expect(updateData.title).toBe('Test Title');
      expect(updateData.description).toBe('Test Description');
    });
  });
});

