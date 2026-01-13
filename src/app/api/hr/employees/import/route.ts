import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { employees, parishes, departments, positions } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import ExcelJS from 'exceljs';

// File upload validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];
const VALID_EXTENSIONS = ['.xlsx', '.xls'];

/**
 * POST /api/hr/employees/import - Import employees from Excel file
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const hasPermission = await checkPermission('hr.employees.create');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type (MIME type)
    if (file.type && !VALID_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only Excel files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !VALID_EXTENSIONS.includes(`.${fileExtension}`)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file extension. Only .xlsx and .xls files are allowed.' },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();

    // Parse Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.worksheets[0];

    // Convert worksheet to JSON array
    const data: any[] = [];
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];

    // Extract headers from first row
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      headers[colNumber] = cell.value?.toString() || '';
    });

    // Process data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      const rowData: any = {};
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const header = headers[colNumber] || '';
        if (header) {
          rowData[header] = cell.value?.toString() || '';
        }
      });
      if (Object.keys(rowData).length > 0) {
        data.push(rowData);
      }
    });

    const results = {
      total: data.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; employeeNumber: string; error: string }>,
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we skip header

      try {
        // Extract data from row (support both Romanian and English column names)
        const parishName = row['Parohia'] || row['Parish'] || row.parish || '';
        const employeeNumber = row['Număr Angajat'] || row['Employee Number'] || row.employeeNumber || '';
        const firstName = row['Prenume'] || row['First Name'] || row.firstName || '';
        const lastName = row['Nume'] || row['Last Name'] || row.lastName || '';
        const cnp = row['CNP'] || row.cnp || '';
        const birthDate = row['Data Nașterii'] || row['Birth Date'] || row.birthDate || '';
        const gender = row['Gen'] || row['Gender'] || row.gender || '';
        const phone = row['Telefon'] || row['Phone'] || row.phone || '';
        const email = row['Email'] || row.email || '';
        const address = row['Adresă'] || row['Address'] || row.address || '';
        const city = row['Oraș'] || row['City'] || row.city || '';
        const county = row['Județ'] || row['County'] || row.county || '';
        const postalCode = row['Cod Poștal'] || row['Postal Code'] || row.postalCode || '';
        const departmentName = row['Departament'] || row['Department'] || row.department || '';
        const positionTitle = row['Post'] || row['Position'] || row.position || '';
        const hireDate = row['Data Angajării'] || row['Hire Date'] || row.hireDate || '';
        const employmentStatus = row['Status Angajare'] || row['Employment Status'] || row.employmentStatus || 'active';
        const bankName = row['Nume Bancă'] || row['Bank Name'] || row.bankName || '';
        const iban = row['IBAN'] || row.iban || '';
        const notes = row['Observații'] || row['Notes'] || row.notes || '';

        // Validate required fields
        if (!parishName || typeof parishName !== 'string' || parishName.trim().length === 0) {
          throw new Error('Parish name is required');
        }

        if (!employeeNumber || typeof employeeNumber !== 'string' || employeeNumber.trim().length === 0) {
          throw new Error('Employee number is required');
        }

        if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
          throw new Error('First name is required');
        }

        if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
          throw new Error('Last name is required');
        }

        if (!hireDate || typeof hireDate !== 'string' || hireDate.trim().length === 0) {
          throw new Error('Hire date is required');
        }

        // Find parish by name
        const [parish] = await db
          .select()
          .from(parishes)
          .where(eq(parishes.name, parishName.trim()))
          .limit(1);

        if (!parish) {
          throw new Error(`Parish "${parishName}" not found`);
        }

        // Check for duplicate employee number
        const [existingEmployee] = await db
          .select()
          .from(employees)
          .where(eq(employees.employeeNumber, employeeNumber.trim()))
          .limit(1);

        if (existingEmployee) {
          throw new Error('Employee number already exists');
        }

        // Check for duplicate CNP if provided
        if (cnp && cnp.trim()) {
          const [existingCnp] = await db
            .select()
            .from(employees)
            .where(eq(employees.cnp, cnp.trim()))
            .limit(1);

          if (existingCnp) {
            throw new Error('CNP already exists');
          }
        }

        // Find department if provided
        let departmentId: string | null = null;
        if (departmentName && departmentName.trim()) {
          const [department] = await db
            .select()
            .from(departments)
            .where(and(
              eq(departments.name, departmentName.trim()),
              eq(departments.parishId, parish.id)
            ))
            .limit(1);
          departmentId = department?.id || null;
        }

        // Find position if provided
        let positionId: string | null = null;
        if (positionTitle && positionTitle.trim()) {
          const [position] = await db
            .select()
            .from(positions)
            .where(and(
              eq(positions.title, positionTitle.trim()),
              eq(positions.parishId, parish.id)
            ))
            .limit(1);
          positionId = position?.id || null;
        }

        // Normalize gender
        let normalizedGender: 'male' | 'female' | 'other' | null = null;
        if (gender) {
          const genderLower = gender.toLowerCase().trim();
          if (genderLower === 'masculin' || genderLower === 'male' || genderLower === 'm') {
            normalizedGender = 'male';
          } else if (genderLower === 'feminin' || genderLower === 'female' || genderLower === 'f') {
            normalizedGender = 'female';
          } else if (genderLower === 'altul' || genderLower === 'other') {
            normalizedGender = 'other';
          }
        }

        // Normalize employment status
        let normalizedStatus: 'active' | 'on_leave' | 'terminated' | 'retired' = 'active';
        if (employmentStatus) {
          const statusLower = employmentStatus.toLowerCase().trim();
          if (statusLower === 'activ' || statusLower === 'active') {
            normalizedStatus = 'active';
          } else if (statusLower === 'în concediu' || statusLower === 'on_leave' || statusLower === 'on leave') {
            normalizedStatus = 'on_leave';
          } else if (statusLower === 'terminat' || statusLower === 'terminated' || statusLower === 'încheiat') {
            normalizedStatus = 'terminated';
          } else if (statusLower === 'pensionat' || statusLower === 'retired') {
            normalizedStatus = 'retired';
          }
        }

        // Parse dates (support multiple formats)
        let parsedBirthDate: string | null = null;
        if (birthDate && birthDate.trim()) {
          // Try to parse date - support DD.MM.YYYY, YYYY-MM-DD, etc.
          const dateStr = birthDate.trim();
          if (dateStr.includes('.')) {
            // DD.MM.YYYY format
            const parts = dateStr.split('.');
            if (parts.length === 3) {
              parsedBirthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          } else if (dateStr.includes('-')) {
            // YYYY-MM-DD format
            parsedBirthDate = dateStr;
          }
        }

        let parsedHireDate: string | null = null;
        if (hireDate && hireDate.trim()) {
          const dateStr = hireDate.trim();
          if (dateStr.includes('.')) {
            // DD.MM.YYYY format
            const parts = dateStr.split('.');
            if (parts.length === 3) {
              parsedHireDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          } else if (dateStr.includes('-')) {
            // YYYY-MM-DD format
            parsedHireDate = dateStr;
          }
        }

        if (!parsedHireDate) {
          throw new Error('Invalid hire date format. Use DD.MM.YYYY or YYYY-MM-DD');
        }

        // Validate email if provided
        if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          throw new Error('Invalid email address');
        }

        // Create employee
        const [newEmployee] = await db
          .insert(employees)
          .values({
            parishId: parish.id,
            employeeNumber: employeeNumber.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            cnp: cnp && cnp.trim() ? cnp.trim() : null,
            birthDate: parsedBirthDate,
            gender: normalizedGender,
            phone: phone && phone.trim() ? phone.trim() : null,
            email: email && email.trim() ? email.trim() : null,
            address: address && address.trim() ? address.trim() : null,
            city: city && city.trim() ? city.trim() : null,
            county: county && county.trim() ? county.trim() : null,
            postalCode: postalCode && postalCode.trim() ? postalCode.trim() : null,
            departmentId,
            positionId,
            hireDate: parsedHireDate,
            employmentStatus: normalizedStatus,
            bankName: bankName && bankName.trim() ? bankName.trim() : null,
            iban: iban && iban.trim() ? iban.trim() : null,
            notes: notes && notes.trim() ? notes.trim() : null,
            isActive: true,
            createdBy: userId,
          })
          .returning();

        results.successful++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.failed++;
        results.errors.push({
          row: rowNumber,
          employeeNumber: (row['Număr Angajat'] || row['Employee Number'] || row.employeeNumber || 'unknown') as string,
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employees/import', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

