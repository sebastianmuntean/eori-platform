import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { leaveRequests, employees, leaveTypes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, sql } from 'drizzle-orm';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const parishId = searchParams.get('parishId');
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const format = searchParams.get('format') || 'excel';

    const conditions = [];
    conditions.push(sql`extract(year from ${leaveRequests.startDate}) = ${year}`);

    const baseQuery = db
      .select({
        leaveTypeId: leaveTypes.id,
        leaveTypeName: leaveTypes.name,
        leaveTypeCode: leaveTypes.code,
        maxDaysPerYear: leaveTypes.maxDaysPerYear,
        totalUsed: sql<number>`coalesce(sum(${leaveRequests.totalDays}) filter (where ${leaveRequests.status} = 'approved'), 0)`,
        totalPending: sql<number>`coalesce(sum(${leaveRequests.totalDays}) filter (where ${leaveRequests.status} = 'pending'), 0)`,
      })
      .from(leaveTypes)
      .leftJoin(leaveRequests, eq(leaveTypes.id, leaveRequests.leaveTypeId));

    let queryWithJoins = baseQuery;
    if (parishId || employeeId) {
      queryWithJoins = queryWithJoins.leftJoin(employees, eq(leaveRequests.employeeId, employees.id));
    }

    if (parishId) {
      conditions.push(eq(employees.parishId, parishId));
    }

    if (employeeId) {
      conditions.push(eq(leaveRequests.employeeId, employeeId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const queryWithWhere = whereClause ? queryWithJoins.where(whereClause) : queryWithJoins;
    const queryWithGroupBy = queryWithWhere.groupBy(leaveTypes.id, leaveTypes.name, leaveTypes.code, leaveTypes.maxDaysPerYear);

    const results = await queryWithGroupBy;

    if (format === 'excel') {
      // Prepare data for Excel
      const excelData = results
        .filter((item) => employeeId || Number(item.totalUsed || 0) > 0 || Number(item.totalPending || 0) > 0)
        .map((item) => ({
          'An': year,
          'Tip Concediu': item.leaveTypeName || '',
          'Cod': item.leaveTypeCode || '',
          'Zile Maxime/An': item.maxDaysPerYear || 'Nelimitat',
          'Zile Folosite': Number(item.totalUsed || 0),
          'Zile În Așteptare': Number(item.totalPending || 0),
          'Zile Rămase': item.maxDaysPerYear ? (item.maxDaysPerYear - Number(item.totalUsed || 0)) : 'N/A',
        }));

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sold Concedii');

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
        { width: 10 }, // An
        { width: 25 }, // Tip Concediu
        { width: 15 }, // Cod
        { width: 18 }, // Zile Maxime/An
        { width: 15 }, // Zile Folosite
        { width: 18 }, // Zile În Așteptare
        { width: 15 }, // Zile Rămase
      ];

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="raport_sold_concedii_${year}.xlsx"`,
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
    logError(error, { endpoint: '/api/hr/reports/leave-balance/export', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

