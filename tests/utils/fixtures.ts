/**
 * Test data fixtures for HR module
 */

export interface EmployeeFixture {
  id: string;
  parishId: string;
  userId: string | null;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  cnp: string | null;
  birthDate: string | null;
  gender: 'male' | 'female' | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  postalCode: string | null;
  departmentId: string | null;
  positionId: string | null;
  hireDate: string;
  employmentStatus: 'active' | 'inactive' | 'on_leave' | 'terminated';
  terminationDate: string | null;
  terminationReason: string | null;
  bankName: string | null;
  iban: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
}

export interface EmploymentContractFixture {
  id: string;
  employeeId: string;
  contractNumber: string;
  contractType: 'indeterminate' | 'determinate' | 'part_time' | 'internship' | 'consultant';
  startDate: string;
  endDate: string | null;
  probationEndDate: string | null;
  baseSalary: string;
  currency: string;
  workingHoursPerWeek: number;
  workLocation: string | null;
  jobDescription: string | null;
  status: 'draft' | 'active' | 'expired' | 'terminated' | 'suspended';
  terminationDate: string | null;
  terminationReason: string | null;
  notes: string | null;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
}

/**
 * Sample employee data
 */
export const sampleEmployees: EmployeeFixture[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    parishId: '550e8400-e29b-41d4-a716-446655440010',
    userId: null,
    employeeNumber: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    cnp: '1234567890123',
    birthDate: '1990-01-15',
    gender: 'male',
    phone: '+40123456789',
    email: 'john.doe@example.com',
    address: '123 Main St',
    city: 'Bucharest',
    county: 'București',
    postalCode: '010001',
    departmentId: null,
    positionId: null,
    hireDate: '2020-01-01',
    employmentStatus: 'active',
    terminationDate: null,
    terminationReason: null,
    bankName: 'BCR',
    iban: 'RO49AAAA1B31007593840000',
    notes: 'Sample employee',
    isActive: true,
    createdAt: new Date('2020-01-01T00:00:00Z'),
    createdBy: null,
    updatedAt: new Date('2020-01-01T00:00:00Z'),
    updatedBy: null,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    parishId: '550e8400-e29b-41d4-a716-446655440010',
    userId: null,
    employeeNumber: 'EMP002',
    firstName: 'Jane',
    lastName: 'Smith',
    cnp: '9876543210987',
    birthDate: '1985-05-20',
    gender: 'female',
    phone: '+40987654321',
    email: 'jane.smith@example.com',
    address: '456 Oak Ave',
    city: 'Cluj-Napoca',
    county: 'Cluj',
    postalCode: '400001',
    departmentId: null,
    positionId: null,
    hireDate: '2019-06-01',
    employmentStatus: 'active',
    terminationDate: null,
    terminationReason: null,
    bankName: 'ING',
    iban: 'RO49BBBB1B31007593840000',
    notes: null,
    isActive: true,
    createdAt: new Date('2019-06-01T00:00:00Z'),
    createdBy: null,
    updatedAt: new Date('2019-06-01T00:00:00Z'),
    updatedBy: null,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    parishId: '550e8400-e29b-41d4-a716-446655440011',
    userId: null,
    employeeNumber: 'EMP003',
    firstName: 'Bob',
    lastName: 'Johnson',
    cnp: '1112223334445',
    birthDate: '1992-08-10',
    gender: 'male',
    phone: '+40111222333',
    email: 'bob.johnson@example.com',
    address: '789 Pine Rd',
    city: 'Timișoara',
    county: 'Timiș',
    postalCode: '300001',
    departmentId: null,
    positionId: null,
    hireDate: '2021-03-15',
    employmentStatus: 'inactive',
    terminationDate: '2023-12-31',
    terminationReason: 'Resignation',
    bankName: 'Raiffeisen',
    iban: 'RO49CCCC1B31007593840000',
    notes: 'Terminated employee',
    isActive: false,
    createdAt: new Date('2021-03-15T00:00:00Z'),
    createdBy: null,
    updatedAt: new Date('2023-12-31T00:00:00Z'),
    updatedBy: null,
  },
];

/**
 * Sample employment contract data
 */
export const sampleEmploymentContracts: EmploymentContractFixture[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440101',
    employeeId: '550e8400-e29b-41d4-a716-446655440001',
    contractNumber: 'CONTRACT-001',
    contractType: 'indeterminate',
    startDate: '2020-01-01',
    endDate: null,
    probationEndDate: '2020-04-01',
    baseSalary: '5000.00',
    currency: 'RON',
    workingHoursPerWeek: 40,
    workLocation: 'Bucharest Office',
    jobDescription: 'Full-time employee',
    status: 'active',
    terminationDate: null,
    terminationReason: null,
    notes: 'Active contract',
    createdAt: new Date('2020-01-01T00:00:00Z'),
    createdBy: null,
    updatedAt: new Date('2020-01-01T00:00:00Z'),
    updatedBy: null,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440102',
    employeeId: '550e8400-e29b-41d4-a716-446655440002',
    contractNumber: 'CONTRACT-002',
    contractType: 'indeterminate',
    startDate: '2019-06-01',
    endDate: null,
    probationEndDate: '2019-09-01',
    baseSalary: '6000.00',
    currency: 'RON',
    workingHoursPerWeek: 40,
    workLocation: 'Cluj Office',
    jobDescription: 'Full-time employee',
    status: 'active',
    terminationDate: null,
    terminationReason: null,
    notes: null,
    createdAt: new Date('2019-06-01T00:00:00Z'),
    createdBy: null,
    updatedAt: new Date('2019-06-01T00:00:00Z'),
    updatedBy: null,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440103',
    employeeId: '550e8400-e29b-41d4-a716-446655440003',
    contractNumber: 'CONTRACT-003',
    contractType: 'determinate',
    startDate: '2021-03-15',
    endDate: '2023-12-31',
    probationEndDate: '2021-06-15',
    baseSalary: '4500.00',
    currency: 'RON',
    workingHoursPerWeek: 40,
    workLocation: 'Timișoara Office',
    jobDescription: 'Fixed-term contract',
    status: 'terminated',
    terminationDate: '2023-12-31',
    terminationReason: 'Contract expired',
    notes: 'Terminated contract',
    createdAt: new Date('2021-03-15T00:00:00Z'),
    createdBy: null,
    updatedAt: new Date('2023-12-31T00:00:00Z'),
    updatedBy: null,
  },
];

/**
 * Get employee by ID
 */
export function getEmployeeById(id: string): EmployeeFixture | undefined {
  return sampleEmployees.find((emp) => emp.id === id);
}

/**
 * Get contracts by employee ID
 */
export function getContractsByEmployeeId(employeeId: string): EmploymentContractFixture[] {
  return sampleEmploymentContracts.filter((contract) => contract.employeeId === employeeId);
}

/**
 * Get active contracts by employee ID
 */
export function getActiveContractsByEmployeeId(employeeId: string): EmploymentContractFixture[] {
  return sampleEmploymentContracts.filter(
    (contract) => contract.employeeId === employeeId && contract.status === 'active'
  );
}

