import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, like, or, desc, asc } from 'drizzle-orm';
import ExcelJS from 'exceljs';

/**
 * GET /api/users/export - Export users to Excel
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/users/export - Exporting users to Excel');

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const approvalStatus = searchParams.get('approvalStatus');

    console.log(`Step 2: Query parameters - search: ${search}, status: ${status}, approvalStatus: ${approvalStatus}`);

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.name || '', `%${search}%`),
          like(users.address || '', `%${search}%`),
          like(users.city || '', `%${search}%`),
          like(users.phone || '', `%${search}%`)
        )!
      );
    }

    // Note: Schema limitations - see users/route.ts comments
    // For now, we'll export all users matching search criteria

    console.log('Step 3: Fetching users from database');
    let query = db.select().from(users);

    if (conditions.length > 0) {
      query = query.where(conditions[0] as any);
    }

    query = query.orderBy(desc(users.createdAt));

    const allUsers = await query;

    console.log(`✓ Found ${allUsers.length} users to export`);

    // Prepare data for Excel
    console.log('Step 4: Preparing Excel data');
    const excelData = allUsers.map((user) => ({
      Nume: user.name || '',
      Email: user.email,
      Adresă: user.address || '',
      Oraș: user.city || '',
      Telefon: user.phone || '',
      Rol: 'N/A', // Schema doesn't have role field yet
      Status: 'N/A', // Schema doesn't have isActive field yet
      'Status Aprobare': 'N/A', // Schema doesn't have approvalStatus field yet
      'Data Creării': user.createdAt ? new Date(user.createdAt).toLocaleDateString('ro-RO') : '',
    }));

    // Create workbook and worksheet
    console.log('Step 5: Creating Excel workbook');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Utilizatori');

    // Add headers
    const headers = Object.keys(excelData[0] || {});
    worksheet.addRow(headers);

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    excelData.forEach((row) => {
      worksheet.addRow(Object.values(row));
    });

    // Set column widths
    worksheet.columns = [
      { width: 30 }, // Nume
      { width: 35 }, // Email
      { width: 35 }, // Adresă
      { width: 20 }, // Oraș
      { width: 15 }, // Telefon
      { width: 15 }, // Rol
      { width: 12 }, // Status
      { width: 18 }, // Status Aprobare
      { width: 15 }, // Data Creării
    ];

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `utilizatori_${timestamp}.xlsx`;

    console.log(`Step 6: Generating Excel file: ${filename}`);

    // Convert to buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();

    console.log(`✓ Excel file generated: ${excelBuffer.length} bytes`);

    // Return file as download
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('❌ Error exporting users:', error);
    logError(error, { endpoint: '/api/users/export', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

