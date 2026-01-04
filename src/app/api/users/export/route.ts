import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth } from '@/lib/auth';
import { eq, like, or, desc, and } from 'drizzle-orm';
import ExcelJS from 'exceljs';

/**
 * GET /api/users/export - Export users to Excel
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/users/export - Exporting users to Excel');

  try {
    // Require authentication
    await requireAuth();
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

    // Filter by status (active/inactive)
    if (status === 'active') {
      conditions.push(eq(users.isActive, true));
    } else if (status === 'inactive') {
      conditions.push(eq(users.isActive, false));
    }

    // Filter by approval status
    if (approvalStatus) {
      conditions.push(eq(users.approvalStatus, approvalStatus as 'pending' | 'approved' | 'rejected'));
    }

    console.log('Step 3: Fetching users from database');
    let query = db.select().from(users);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)!);
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
      Rol: user.role || 'N/A',
      Status: user.isActive ? 'Activ' : 'Inactiv',
      'Status Aprobare': user.approvalStatus === 'pending' ? 'În așteptare' : 
                        user.approvalStatus === 'approved' ? 'Aprobat' : 
                        user.approvalStatus === 'rejected' ? 'Respins' : 'N/A',
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

