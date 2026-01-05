import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { timeEntries, employees } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const format = searchParams.get('format') || 'excel';

    const conditions = [];

    if (dateFrom) {
      conditions.push(gte(timeEntries.entryDate, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(timeEntries.entryDate, dateTo));
    }

    let query = db
      .select({
        timeEntry: timeEntries,
        employee: employees,
      })
      .from(timeEntries)
      .innerJoin(employees, eq(timeEntries.employeeId, employees.id));

    if (parishId) {
      conditions.push(eq(employees.parishId, parishId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    if (whereClause) {
      query = query.where(whereClause);
    }

    const results = await query;

    if (format === 'excel') {
      // Prepare data for Excel
      const excelData = results.map(({ timeEntry, employee }) => ({
        'Data': timeEntry.entryDate ? new Date(timeEntry.entryDate).toLocaleDateString('ro-RO') : '',
        'Angajat': `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
        'Număr Angajat': employee.employeeNumber || '',
        'Ora Intrare': timeEntry.checkInTime ? new Date(timeEntry.checkInTime).toLocaleTimeString('ro-RO') : '',
        'Ora Ieșire': timeEntry.checkOutTime ? new Date(timeEntry.checkOutTime).toLocaleTimeString('ro-RO') : '',
        'Ore Lucrate': Number(timeEntry.workedHours || 0).toFixed(2),
        'Ore Suplimentare': Number(timeEntry.overtimeHours || 0).toFixed(2),
        'Pauză (min)': timeEntry.breakDurationMinutes || 0,
        'Status': timeEntry.status || '',
        'Notițe': timeEntry.notes || '',
      }));

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Pontaje');

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
        { width: 15 }, // Data
        { width: 30 }, // Angajat
        { width: 15 }, // Număr Angajat
        { width: 15 }, // Ora Intrare
        { width: 15 }, // Ora Ieșire
        { width: 15 }, // Ore Lucrate
        { width: 18 }, // Ore Suplimentare
        { width: 15 }, // Pauză (min)
        { width: 15 }, // Status
        { width: 30 }, // Notițe
      ];

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="raport_pontaje_${new Date().toISOString().split('T')[0]}.xlsx"`,
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
    logError(error, { endpoint: '/api/hr/reports/attendance/export', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


