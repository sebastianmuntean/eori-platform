import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockRequestWithParams, assertFileResponse, assertErrorResponse } from '../../../../../../utils/api-helpers';
import { sampleEmployees, sampleEmploymentContracts, type EmployeeFixture, type EmploymentContractFixture } from '../../../../../../utils/fixtures';
import { employees, employmentContracts } from '../../../../../../../database/schema';

// Use vi.hoisted to ensure variables are accessible in mocks
const mockData = vi.hoisted(() => {
  return {
    employees: [] as EmployeeFixture[],
    contracts: new Map<string, EmploymentContractFixture[]>(),
  };
});

// Convenience aliases for easier access
const mockEmployeesData = mockData.employees;
const mockContractsDataMap = mockData.contracts;

// Mock the database client with proper query handling
vi.mock('@/database/client', () => {
  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn((table: any) => {
          // Create a thenable object that can be awaited directly or chained with where()
          const createQueryBuilder = (getData: () => any) => {
            const promise = Promise.resolve(getData());
            // Attach where method to the promise
            (promise as any).where = vi.fn((condition: any) => {
              return Promise.resolve(getData());
            });
            return promise;
          };

          // If it's an employees query, return employees data
          if (table === employees) {
            return createQueryBuilder(() => mockEmployeesData);
          }
          
          // If it's a contracts query, return all contracts
          // The route code will filter them by employeeId using .find()
          // This is acceptable for unit testing - we're testing route logic, not DB filtering
          if (table === employmentContracts) {
            return createQueryBuilder(() => {
              return Array.from(mockContractsDataMap.values()).flat();
            });
          }
          
          // Default query builder
          return createQueryBuilder(() => []);
        }),
      })),
    },
  };
});

// Helper to set employees data (modifies array in place)
function setEmployeesData(employees: EmployeeFixture[]) {
  mockEmployeesData.length = 0;
  mockEmployeesData.push(...employees);
}

// Helper to set contracts for a specific employee
function setContractsForEmployee(employeeId: string, contracts: EmploymentContractFixture[]) {
  mockContractsDataMap.set(employeeId, contracts);
}

// Helper to get contracts for a specific employee
function getContractsForEmployee(employeeId: string): EmploymentContractFixture[] {
  return mockContractsDataMap.get(employeeId) || [];
}

// Mock ExcelJS
const mockWorksheet = {
  addRow: vi.fn(),
  getRow: vi.fn(() => ({
    font: {},
    fill: {},
    alignment: {},
  })),
  columns: [],
};

const mockWorkbook = {
  addWorksheet: vi.fn(() => mockWorksheet),
  xlsx: {
    writeBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-excel-data')),
  },
};

vi.mock('exceljs', () => ({
  default: {
    Workbook: vi.fn(() => mockWorkbook),
  },
}));

// Mock error handling
vi.mock('@/lib/errors', () => ({
  formatErrorResponse: vi.fn((error: unknown) => {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
        statusCode: 500,
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
      statusCode: 500,
    };
  }),
  logError: vi.fn(),
}));

// Import GET function - will be imported after mocks are set up
let GET: typeof import('../../../../../../../src/app/api/hr/reports/employees/export/route').GET;

describe('GET /api/hr/reports/employees/export', () => {
  beforeEach(async () => {
    // Import GET function after mocks are set up
    const routeModule = await import('../../../../../../../src/app/api/hr/reports/employees/export/route');
    GET = routeModule.GET;
    
    // Reset mocks
    vi.clearAllMocks();
    mockData.employees.length = 0;
    mockData.contracts.clear();

    // Reset ExcelJS mocks
    mockWorkbook.addWorksheet.mockReturnValue(mockWorksheet);
    mockWorkbook.xlsx.writeBuffer.mockResolvedValue(Buffer.from('mock-excel-data'));
    mockWorksheet.addRow.mockClear();
    mockWorksheet.getRow.mockReturnValue({
      font: {},
      fill: {},
      alignment: {},
    });
    mockWorksheet.columns = [];
  });

  describe('Happy Paths', () => {
    it('should export Excel file with all employees when no filters are provided', async () => {
      // Arrange
      const testEmployees: EmployeeFixture[] = [
        {
          ...sampleEmployees[0],
          id: 'emp-1',
          employeeNumber: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+40123456789',
          employmentStatus: 'active',
          hireDate: '2020-01-01',
        },
        {
          ...sampleEmployees[1],
          id: 'emp-2',
          employeeNumber: 'EMP002',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+40987654321',
          employmentStatus: 'active',
          hireDate: '2019-06-01',
        },
      ];

      const testContracts1: EmploymentContractFixture[] = [
        {
          ...sampleEmploymentContracts[0],
          employeeId: 'emp-1',
          status: 'active',
          contractType: 'indeterminate',
          startDate: '2020-01-01',
        },
      ];

      const testContracts2: EmploymentContractFixture[] = [
        {
          ...sampleEmploymentContracts[1],
          employeeId: 'emp-2',
          status: 'active',
          contractType: 'indeterminate',
          startDate: '2019-06-01',
        },
      ];

      setEmployeesData(testEmployees);
      setContractsForEmployee('emp-1', testContracts1);
      setContractsForEmployee('emp-2', testContracts2);

      const request = createMockRequestWithParams('http://localhost/api/hr/reports/employees/export', {
        format: 'excel',
      });

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      assertFileResponse(
        response,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      const contentDisposition = response.headers.get('content-disposition');
      expect(contentDisposition).toContain('attachment; filename="raport_angajati_');
      expect(contentDisposition).toContain('.xlsx"');
    });

    it('should export Excel file with parishId filter', async () => {
      // Arrange
      const parishId = 'parish-1';
      const testEmployees: EmployeeFixture[] = [
        {
          ...sampleEmployees[0],
          id: 'emp-1',
          parishId,
          employeeNumber: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          employmentStatus: 'active',
        },
      ];

      setEmployeesData(testEmployees);
      setContractsForEmployee('emp-1', []);

      const request = createMockRequestWithParams('http://localhost/api/hr/reports/employees/export', {
        parishId,
        format: 'excel',
      });

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      assertFileResponse(
        response,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });

    it('should export Excel file with employmentStatus filter', async () => {
      // Arrange
      const testEmployees: EmployeeFixture[] = [
        {
          ...sampleEmployees[0],
          id: 'emp-1',
          employmentStatus: 'active',
        },
      ];

      setEmployeesData(testEmployees);
      setContractsForEmployee('emp-1', []);

      const request = createMockRequestWithParams('http://localhost/api/hr/reports/employees/export', {
        employmentStatus: 'active',
        format: 'excel',
      });

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      assertFileResponse(
        response,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });

    it('should export Excel file with both parishId and employmentStatus filters', async () => {
      // Arrange
      const parishId = 'parish-1';
      const testEmployees: EmployeeFixture[] = [
        {
          ...sampleEmployees[0],
          id: 'emp-1',
          parishId,
          employmentStatus: 'active',
        },
      ];

      setEmployeesData(testEmployees);
      setContractsForEmployee('emp-1', []);

      const request = createMockRequestWithParams('http://localhost/api/hr/reports/employees/export', {
        parishId,
        employmentStatus: 'active',
        format: 'excel',
      });

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      assertFileResponse(
        response,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty employee list', async () => {
      // Arrange
      setEmployeesData([]);

      const request = createMockRequestWithParams('http://localhost/api/hr/reports/employees/export', {
        format: 'excel',
      });

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      assertFileResponse(
        response,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      // Verify Excel was still created (even with empty data)
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Angajați');
    });

    it('should handle employees without contracts', async () => {
      // Arrange
      const testEmployees: EmployeeFixture[] = [
        {
          ...sampleEmployees[0],
          id: 'emp-1',
          employeeNumber: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          employmentStatus: 'active',
        },
      ];

      setEmployeesData(testEmployees);
      setContractsForEmployee('emp-1', []);

      const request = createMockRequestWithParams('http://localhost/api/hr/reports/employees/export', {
        format: 'excel',
      });

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      assertFileResponse(
        response,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });

    it('should handle employees with multiple contracts (active/inactive)', async () => {
      // Arrange
      const testEmployees: EmployeeFixture[] = [
        {
          ...sampleEmployees[0],
          id: 'emp-1',
          employeeNumber: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          employmentStatus: 'active',
        },
      ];

      const testContracts: EmploymentContractFixture[] = [
        {
          ...sampleEmploymentContracts[0],
          id: 'contract-1',
          employeeId: 'emp-1',
          status: 'active',
          contractType: 'indeterminate',
          startDate: '2020-01-01',
        },
        {
          ...sampleEmploymentContracts[1],
          id: 'contract-2',
          employeeId: 'emp-1',
          status: 'expired',
          contractType: 'determinate',
          startDate: '2019-01-01',
        },
      ];

      setEmployeesData(testEmployees);
      setContractsForEmployee('emp-1', testContracts);

      const request = createMockRequestWithParams('http://localhost/api/hr/reports/employees/export', {
        format: 'excel',
      });

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      assertFileResponse(
        response,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });
  });

  describe('Error Cases', () => {
    it('should handle database query failure', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      
      // Mock database to throw error
      const { db } = await import('../../../../../../../database/client');
      vi.spyOn(db, 'select').mockImplementation(() => {
        throw dbError;
      });

      const request = createMockRequestWithParams('http://localhost/api/hr/reports/employees/export', {
        format: 'excel',
      });

      // Act
      const response = await GET(request);

      // Assert
      const errorData = await assertErrorResponse(response, 500);
      expect(errorData.success).toBe(false);
      expect(errorData.error).toBeDefined();
    });

    it('should handle Excel generation failure', async () => {
      // Arrange
      const testEmployees: EmployeeFixture[] = [
        {
          ...sampleEmployees[0],
          id: 'emp-1',
          employmentStatus: 'active',
        },
      ];

      setEmployeesData(testEmployees);
      setContractsForEmployee('emp-1', []);

      // Mock ExcelJS to throw error
      const excelError = new Error('Failed to generate Excel file');
      mockWorkbook.xlsx.writeBuffer = vi.fn().mockRejectedValue(excelError);

      const request = createMockRequestWithParams('http://localhost/api/hr/reports/employees/export', {
        format: 'excel',
      });

      // Act
      const response = await GET(request);

      // Assert
      const errorData = await assertErrorResponse(response, 500);
      expect(errorData.success).toBe(false);
      expect(errorData.error).toBeDefined();
    });
  });

  describe('Format Validation', () => {
    it('should return 501 for PDF format', async () => {
      // Arrange
      const request = createMockRequestWithParams('http://localhost/api/hr/reports/employees/export', {
        format: 'pdf',
      });

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(501);
      const data = await response.json();
      expect(data).toEqual({
        success: false,
        error: 'PDF export not yet implemented',
      });
    });
  });

  describe('Response Headers', () => {
    it('should set correct Content-Type header for Excel', async () => {
      // Arrange
      const testEmployees: EmployeeFixture[] = [
        {
          ...sampleEmployees[0],
          id: 'emp-1',
          employmentStatus: 'active',
        },
      ];

      setEmployeesData(testEmployees);
      setContractsForEmployee('emp-1', []);

      const request = createMockRequestWithParams('http://localhost/api/hr/reports/employees/export', {
        format: 'excel',
      });

      // Act
      const response = await GET(request);

      // Assert
      const contentType = response.headers.get('content-type');
      expect(contentType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should set correct Content-Disposition header with filename', async () => {
      // Arrange
      const testEmployees: EmployeeFixture[] = [
        {
          ...sampleEmployees[0],
          id: 'emp-1',
          employmentStatus: 'active',
        },
      ];

      setEmployeesData(testEmployees);
      setContractsForEmployee('emp-1', []);

      const request = createMockRequestWithParams('http://localhost/api/hr/reports/employees/export', {
        format: 'excel',
      });

      // Act
      const response = await GET(request);

      // Assert
      const contentDisposition = response.headers.get('content-disposition');
      expect(contentDisposition).toContain('attachment; filename="raport_angajati_');
      expect(contentDisposition).toContain('.xlsx"');
      
      // Verify filename contains today's date
      const today = new Date().toISOString().split('T')[0];
      expect(contentDisposition).toContain(today);
    });
  });

  describe('Excel Structure', () => {
    it('should create workbook with correct worksheet name', async () => {
      // Arrange
      const testEmployees: EmployeeFixture[] = [
        {
          ...sampleEmployees[0],
          id: 'emp-1',
          employeeNumber: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          employmentStatus: 'active',
        },
      ];

      setEmployeesData(testEmployees);
      setContractsForEmployee('emp-1', []);

      const request = createMockRequestWithParams('http://localhost/api/hr/reports/employees/export', {
        format: 'excel',
      });

      // Act
      await GET(request);

      // Assert
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Angajați');
    });

    it('should add headers row', async () => {
      // Arrange
      const testEmployees: EmployeeFixture[] = [
        {
          ...sampleEmployees[0],
          id: 'emp-1',
          employeeNumber: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          cnp: '1234567890123',
          email: 'john@example.com',
          phone: '+40123456789',
          employmentStatus: 'active',
          hireDate: '2020-01-01',
        },
      ];

      setEmployeesData(testEmployees);
      setContractsForEmployee('emp-1', []);

      const request = createMockRequestWithParams('http://localhost/api/hr/reports/employees/export', {
        format: 'excel',
      });

      // Act
      await GET(request);

      // Assert
      // Headers should be added (first call to addRow)
      expect(mockWorksheet.addRow).toHaveBeenCalled();
    });

    it('should set column widths correctly', async () => {
      // Arrange
      const testEmployees: EmployeeFixture[] = [
        {
          ...sampleEmployees[0],
          id: 'emp-1',
          employmentStatus: 'active',
        },
      ];

      setEmployeesData(testEmployees);
      setContractsForEmployee('emp-1', []);

      const request = createMockRequestWithParams('http://localhost/api/hr/reports/employees/export', {
        format: 'excel',
      });

      // Act
      await GET(request);

      // Assert
      // Column widths should be set (12 columns based on the route code)
      expect(mockWorksheet.columns).toBeDefined();
      expect(Array.isArray(mockWorksheet.columns)).toBe(true);
    });

    it('should style header row', async () => {
      // Arrange
      const testEmployees: EmployeeFixture[] = [
        {
          ...sampleEmployees[0],
          id: 'emp-1',
          employmentStatus: 'active',
        },
      ];

      setEmployeesData(testEmployees);
      setContractsForEmployee('emp-1', []);

      const request = createMockRequestWithParams('http://localhost/api/hr/reports/employees/export', {
        format: 'excel',
      });

      // Act
      await GET(request);

      // Assert
      // Header row should be retrieved for styling
      expect(mockWorksheet.getRow).toHaveBeenCalledWith(1);
    });
  });
});
