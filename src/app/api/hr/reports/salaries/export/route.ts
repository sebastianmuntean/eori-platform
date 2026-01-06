import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { salaries, employees } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const periodFrom = searchParams.get('periodFrom');
    const periodTo = searchParams.get('periodTo');
    const status = searchParams.get('status');
    const format = searchParams.get('format') || 'excel';

    const conditions = [];

    if (periodFrom) {
      conditions.push(gte(salaries.salaryPeriod, periodFrom));
    }

    if (periodTo) {
      conditions.push(lte(salaries.salaryPeriod, periodTo));
    }

    if (status) {
      conditions.push(eq(salaries.status, status as any));
    }

    if (parishId) {
      conditions.push(eq(employees.parishId, parishId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const baseQuery = db
      .select({
        salary: salaries,
        employee: employees,
      })
      .from(salaries)
      .innerJoin(employees, eq(salaries.employeeId, employees.id));

    const results = await (whereClause ? baseQuery.where(whereClause) : baseQuery);

    if (format === 'excel') {
      // Prepare data for Excel
      const excelData = results.map(({ salary, employee }) => ({
        'Perioadă': salary.salaryPeriod ? new Date(salary.salaryPeriod).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' }) : '',
        'Angajat': `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
        'Număr Angajat': employee.employeeNumber || '',
        'Salariu de Bază': Number(salary.baseSalary || 0).toFixed(2),
        'Salariu Brut': Number(salary.grossSalary || 0).toFixed(2),
        'Salariu Net': Number(salary.netSalary || 0).toFixed(2),
        'Beneficii': Number(salary.totalBenefits || 0).toFixed(2),
        'Deduceri': Number(salary.totalDeductions || 0).toFixed(2),
        'Zile Lucrate': salary.workedDays || 0,
        'Zile Totale': salary.workingDays || 0,
        'Status': salary.status || '',
        'Data Plată': salary.paidDate ? new Date(salary.paidDate).toLocaleDateString('ro-RO') : '',
        'Referință Plată': salary.paymentReference || '',
      }));

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Salarii');

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
        { width: 20 }, // Perioadă
        { width: 30 }, // Angajat
        { width: 15 }, // Număr Angajat
        { width: 15 }, // Salariu de Bază
        { width: 15 }, // Salariu Brut
        { width: 15 }, // Salariu Net
        { width: 15 }, // Beneficii
        { width: 15 }, // Deduceri
        { width: 12 }, // Zile Lucrate
        { width: 12 }, // Zile Totale
        { width: 15 }, // Status
        { width: 15 }, // Data Plată
        { width: 20 }, // Referință Plată
      ];

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="raport_salarii_${new Date().toISOString().split('T')[0]}.xlsx"`,
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
    logError(error, { endpoint: '/api/hr/reports/salaries/export', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



