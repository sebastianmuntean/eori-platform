import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, and, isNull, like, or, sql, type SQL } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { addParishFilter } from '@/lib/api-utils/authorization';
import { handleApiRoute } from '@/lib/api-utils/error-handling';

/**
 * GET /api/registry/reports/export - Export documents to Excel
 */
export async function GET(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.DOCUMENTS_VIEW);
    const { userId, user } = await getCurrentUser();

    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const documentType = searchParams.get('documentType') as 'incoming' | 'outgoing' | 'internal' | null;
    const status = searchParams.get('status');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null;
    const search = searchParams.get('search') || '';

    const conditions: SQL[] = [isNull(documentRegistry.deletedAt)];

    if (parishId) {
      conditions.push(eq(documentRegistry.parishId, parishId));
    } else {
      await addParishFilter(conditions, documentRegistry, user?.parishId ?? null, userId ?? undefined);
    }

    if (documentType) {
      conditions.push(eq(documentRegistry.documentType, documentType));
    }

    if (status) {
      conditions.push(eq(documentRegistry.status, status as 'draft' | 'registered' | 'in_work' | 'resolved' | 'archived'));
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

    const whereClause = and(...conditions);

    const documents = await db
      .select()
      .from(documentRegistry)
      .where(whereClause)
      .orderBy(sql`${documentRegistry.registrationDate} DESC NULLS LAST`);

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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Documente');

    const headers = Object.keys(excelData[0] || {});
    worksheet.addRow(headers);

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    excelData.forEach((row) => {
      worksheet.addRow(Object.values(row));
    });

    worksheet.columns = [
      { width: 15 },
      { width: 8 },
      { width: 12 },
      { width: 18 },
      { width: 40 },
      { width: 15 },
      { width: 12 },
      { width: 30 },
      { width: 30 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 18 },
      { width: 10 },
    ];

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `documente_${timestamp}.xlsx`;
    const excelBuffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }, { endpoint: '/api/registry/reports/export', method: 'GET' });
}
