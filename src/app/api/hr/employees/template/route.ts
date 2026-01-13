import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';

/**
 * GET /api/hr/employees/template - Download Excel template for employee import
 */
export async function GET() {
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

    // Create workbook
    const workbook = new ExcelJS.Workbook();

    // Create main worksheet
    const worksheet = workbook.addWorksheet('Angajați');

    // Define headers (Romanian)
    const headers = [
      'Parohia',
      'Număr Angajat',
      'Prenume',
      'Nume',
      'CNP',
      'Data Nașterii',
      'Gen',
      'Telefon',
      'Email',
      'Adresă',
      'Oraș',
      'Județ',
      'Cod Poștal',
      'Departament',
      'Post',
      'Data Angajării',
      'Status Angajare',
      'Nume Bancă',
      'IBAN',
      'Observații',
    ];

    // Add headers to worksheet
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

    // Add example data rows
    const exampleData = [
      [
        'Parohia Exemplu',
        'EMP001',
        'Ion',
        'Popescu',
        '1234567890123',
        '15.05.1985',
        'Masculin',
        '0712345678',
        'ion.popescu@exemplu.com',
        'Str. Principală nr. 1',
        'București',
        'București',
        '010001',
        'Administrație',
        'Secretar',
        '01.01.2020',
        'Activ',
        'BCR',
        'RO49AAAA1B31007593840000',
        'Angajat de bază',
      ],
      [
        'Parohia Exemplu',
        'EMP002',
        'Maria',
        'Ionescu',
        '2345678901234',
        '20.08.1990',
        'Feminin',
        '0723456789',
        'maria.ionescu@exemplu.com',
        'Bd. Unirii nr. 10',
        'Cluj-Napoca',
        'Cluj',
        '400001',
        'Contabilitate',
        'Contabil',
        '15.03.2021',
        'Activ',
        'ING',
        'RO12INGB0000999900444477',
        '',
      ],
    ];
    worksheet.addRows(exampleData);

    // Set column widths
    worksheet.columns = [
      { width: 25 }, // Parohia
      { width: 15 }, // Număr Angajat
      { width: 15 }, // Prenume
      { width: 15 }, // Nume
      { width: 15 }, // CNP
      { width: 15 }, // Data Nașterii
      { width: 12 }, // Gen
      { width: 15 }, // Telefon
      { width: 30 }, // Email
      { width: 30 }, // Adresă
      { width: 20 }, // Oraș
      { width: 15 }, // Județ
      { width: 12 }, // Cod Poștal
      { width: 20 }, // Departament
      { width: 20 }, // Post
      { width: 15 }, // Data Angajării
      { width: 15 }, // Status Angajare
      { width: 15 }, // Nume Bancă
      { width: 30 }, // IBAN
      { width: 30 }, // Observații
    ];

    // Add data validation for Gender column (column G, index 7)
    const genderValidation = {
      type: 'list' as const,
      allowBlank: true,
      formulae: ['"Masculin,Feminin,Altul"'],
      showErrorMessage: true,
      errorTitle: 'Valoare invalidă',
      error: 'Genul trebuie să fie: Masculin, Feminin sau Altul',
      promptTitle: 'Selectează genul',
      prompt: 'Selectează un gen din listă: Masculin, Feminin sau Altul',
    };

    // Add data validation for Employment Status column (column Q, index 17)
    const statusValidation = {
      type: 'list' as const,
      allowBlank: true,
      formulae: ['"Activ,În Concediu,Terminat,Pensionat"'],
      showErrorMessage: true,
      errorTitle: 'Valoare invalidă',
      error: 'Statusul trebuie să fie: Activ, În Concediu, Terminat sau Pensionat',
      promptTitle: 'Selectează statusul',
      prompt: 'Selectează un status din listă: Activ, În Concediu, Terminat sau Pensionat',
    };

    // Apply validation to rows 2-1000
    for (let row = 2; row <= 1000; row++) {
      worksheet.getCell(row, 7).dataValidation = genderValidation; // Gen
      worksheet.getCell(row, 17).dataValidation = statusValidation; // Status Angajare
    }

    // Add instructions sheet
    const instructionsSheet = workbook.addWorksheet('Instrucțiuni');
    instructionsSheet.addRow(['Instrucțiuni pentru Import Angajați']);
    instructionsSheet.getRow(1).font = { bold: true, size: 14 };
    instructionsSheet.addRow([]);
    instructionsSheet.addRow(['Câmpuri obligatorii:']);
    instructionsSheet.addRow(['- Parohia (trebuie să existe în sistem)']);
    instructionsSheet.addRow(['- Număr Angajat (trebuie să fie unic)']);
    instructionsSheet.addRow(['- Prenume']);
    instructionsSheet.addRow(['- Nume']);
    instructionsSheet.addRow(['- Data Angajării (format: DD.MM.YYYY sau YYYY-MM-DD)']);
    instructionsSheet.addRow([]);
    instructionsSheet.addRow(['Câmpuri opționale:']);
    instructionsSheet.addRow(['- CNP (trebuie să fie unic dacă este completat)']);
    instructionsSheet.addRow(['- Data Nașterii (format: DD.MM.YYYY sau YYYY-MM-DD)']);
    instructionsSheet.addRow(['- Gen: Masculin, Feminin sau Altul']);
    instructionsSheet.addRow(['- Telefon, Email, Adresă, Oraș, Județ, Cod Poștal']);
    instructionsSheet.addRow(['- Departament (trebuie să existe în sistem pentru parohia selectată)']);
    instructionsSheet.addRow(['- Post (trebuie să existe în sistem pentru parohia selectată)']);
    instructionsSheet.addRow(['- Status Angajare: Activ, În Concediu, Terminat, Pensionat']);
    instructionsSheet.addRow(['- Nume Bancă, IBAN, Observații']);
    instructionsSheet.addRow([]);
    instructionsSheet.addRow(['Note:']);
    instructionsSheet.addRow(['- Parohia, Departamentul și Postul trebuie să existe în sistem']);
    instructionsSheet.addRow(['- Numărul de angajat trebuie să fie unic']);
    instructionsSheet.addRow(['- CNP-ul trebuie să fie unic dacă este completat']);
    instructionsSheet.addRow(['- Data Nașterii și Data Angajării pot fi în format DD.MM.YYYY sau YYYY-MM-DD']);

    // Set column width for instructions
    instructionsSheet.columns = [{ width: 80 }];

    // Generate filename with timestamp
    const fileName = `template-import-angajati-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Convert workbook to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return file as download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employees/template', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

