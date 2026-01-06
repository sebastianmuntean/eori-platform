import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { employees, employmentContracts } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, sql } from 'drizzle-orm';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const employmentStatus = searchParams.get('employmentStatus');
    const format = searchParams.get('format') || 'excel';

    const conditions = [];

    if (parishId) {
      conditions.push(eq(employees.parishId, parishId));
    }

    if (employmentStatus) {
      conditions.push(eq(employees.employmentStatus, employmentStatus as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch all employees matching the criteria
    const baseQuery = db.select().from(employees);
    const allEmployees = await (whereClause ? baseQuery.where(whereClause) : baseQuery);

    // Get active contracts for each employee
    const employeesWithContracts = await Promise.all(
      allEmployees.map(async (employee) => {
        const contracts = await db
          .select()
          .from(employmentContracts)
          .where(eq(employmentContracts.employeeId, employee.id));

        const activeContract = contracts.find((c) => c.status === 'active');

        return {
          ...employee,
          hasActiveContract: !!activeContract,
          contractType: activeContract?.contractType || null,
          contractStartDate: activeContract?.startDate || null,
        };
      })
    );

    if (format === 'excel') {
      // Prepare data for Excel
      const excelData = employeesWithContracts.map((emp) => ({
        'Număr Angajat': emp.employeeNumber || '',
        'Nume': `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        'CNP': emp.cnp || '',
        'Email': emp.email || '',
        'Telefon': emp.phone || '',
        'Status': emp.employmentStatus || '',
        'Data Angajare': emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('ro-RO') : '',
        'Contract Activ': emp.hasActiveContract ? 'Da' : 'Nu',
        'Tip Contract': emp.contractType || '',
        'Data Start Contract': emp.contractStartDate ? new Date(emp.contractStartDate).toLocaleDateString('ro-RO') : '',
        'Data Terminare': emp.terminationDate ? new Date(emp.terminationDate).toLocaleDateString('ro-RO') : '',
        'Motiv Terminare': emp.terminationReason || '',
      }));

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Angajați');

      // Add headers
      const headers = Object.keys(excelData[0] || {});
      worksheet.addRow(headers);

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // Add data rows
      excelData.forEach((row) => {
        worksheet.addRow(Object.values(row));
      });

      // Set column widths
      worksheet.columns = [
        { width: 15 }, // Număr Angajat
        { width: 30 }, // Nume
        { width: 15 }, // CNP
        { width: 30 }, // Email
        { width: 15 }, // Telefon
        { width: 15 }, // Status
        { width: 15 }, // Data Angajare
        { width: 15 }, // Contract Activ
        { width: 20 }, // Tip Contract
        { width: 18 }, // Data Start Contract
        { width: 15 }, // Data Terminare
        { width: 30 }, // Motiv Terminare
      ];

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="raport_angajati_${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    } else {
      // PDF export - return JSON for now, can be enhanced with PDF library
      return NextResponse.json({
        success: false,
        error: 'PDF export not yet implemented',
      }, { status: 501 });
    }
  } catch (error) {
    logError(error, { endpoint: '/api/hr/reports/employees/export', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



