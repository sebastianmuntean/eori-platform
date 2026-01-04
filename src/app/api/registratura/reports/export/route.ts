import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, isNull, like, or, sql } from 'drizzle-orm';
import ExcelJS from 'exceljs';

/**
 * GET /api/registratura/reports/export - Export documents to Excel
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/registratura/reports/export - Exporting documents to Excel');

  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const documentType = searchParams.get('documentType') as 'incoming' | 'outgoing' | 'internal' | null;
    const status = searchParams.get('status');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null;
    const search = searchParams.get('search') || '';

    // Build query conditions
    const conditions = [isNull(documentRegistry.deletedAt)];

    if (parishId) {
      conditions.push(eq(documentRegistry.parishId, parishId));
    }

    if (documentType) {
      conditions.push(eq(documentRegistry.documentType, documentType));
    }

    if (status) {
      conditions.push(eq(documentRegistry.status, status as any));
    }

    if (year) {
      conditions.push(eq(documentRegistry.registrationYear, year));
    }

    if (search) {
      conditions.push(
        or(
          like(documentRegistry.subject, `%${search}%`),
          like(documentRegistry.content || '', `%${search}%`),
          like(documentRegistry.formattedNumber || '', `%${search}%`),
          like(documentRegistry.senderName || '', `%${search}%`),
          like(documentRegistry.recipientName || '', `%${search}%`)
        )!
      );
    }

    const whereClause = conditions.length > 1 ? and(...conditions as any[]) : conditions[0];

    // Fetch all matching documents
    const documents = await db
      .select()
      .from(documentRegistry)
      .where(whereClause)
      .orderBy(sql`${documentRegistry.registrationDate} DESC NULLS LAST`);

    console.log(`✓ Found ${documents.length} documents to export`);

    // Prepare data for Excel
    const excelData = documents.map((doc) => ({
      'Număr': doc.formattedNumber || '',
      'An': doc.registrationYear || '',
      'Tip': doc.documentType || '',
      'Data Înregistrare': doc.registrationDate ? new Date(doc.registrationDate).toLocaleDateString('ro-RO') : '',
      'Subiect': doc.subject || '',
      'Status': doc.status || '',
      'Prioritate': doc.priority || '',
      'Expeditor': doc.senderName || '',
      'Destinatar': doc.recipientName || '',
      'Număr Extern': doc.externalNumber || '',
      'Data Externă': doc.externalDate ? new Date(doc.externalDate).toLocaleDateString('ro-RO') : '',
      'Termen': doc.dueDate ? new Date(doc.dueDate).toLocaleDateString('ro-RO') : '',
      'Data Rezolvare': doc.resolvedDate ? new Date(doc.resolvedDate).toLocaleDateString('ro-RO') : '',
      'Indicativ Arhivare': doc.fileIndex || '',
      'Secret': doc.isSecret ? 'Da' : 'Nu',
    }));

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Documente');

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
      { width: 15 }, // Număr
      { width: 8 },  // An
      { width: 12 }, // Tip
      { width: 18 }, // Data Înregistrare
      { width: 40 }, // Subiect
      { width: 15 }, // Status
      { width: 12 }, // Prioritate
      { width: 30 }, // Expeditor
      { width: 30 }, // Destinatar
      { width: 15 }, // Număr Extern
      { width: 15 }, // Data Externă
      { width: 15 }, // Termen
      { width: 15 }, // Data Rezolvare
      { width: 18 }, // Indicativ Arhivare
      { width: 10 }, // Secret
    ];

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `documente_${timestamp}.xlsx`;

    console.log(`Step 2: Generating Excel file: ${filename}`);

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
    console.error('❌ Error exporting documents:', error);
    logError(error, { endpoint: '/api/registratura/reports/export', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

