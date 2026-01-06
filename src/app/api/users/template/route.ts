import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/users/template - Download Excel template for user import
 * Template includes: Email, Name, Role, Address, City, Phone
 * Role column has data validation (dropdown) with valid roles: episcop, vicar, paroh, secretar, contabil
 */
export async function GET() {
  console.log('Step 1: GET /api/users/template - Generating user import template');

  try {
    // Require authentication
    await requireAuth();
    // Valid roles from system enum
    const validRoles = ['episcop', 'vicar', 'paroh', 'secretar', 'contabil'];
    console.log(`Step 1.1: Valid roles: ${validRoles.join(', ')}`);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    console.log('Step 1.2: Workbook created');

    // Create main worksheet
    const worksheet = workbook.addWorksheet('Utilizatori');
    console.log('Step 1.3: Main worksheet created');

    // Define headers
    const headers = ['Email', 'Name', 'Role', 'Address', 'City', 'Phone'];
    console.log('Step 1.4: Headers defined:', headers);

    // Add headers to worksheet
    worksheet.addRow(headers);
    console.log('Step 1.5: Headers added to worksheet');

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    console.log('Step 1.6: Header row styled');

    // Add example data rows
    const exampleData = [
      ['exemplu@email.com', 'Ion Popescu', 'paroh', 'Str. Principală nr. 1', 'București', '0712345678'],
      ['exemplu2@email.com', 'Maria Ionescu', 'secretar', 'Bd. Unirii nr. 10', 'Cluj-Napoca', '0723456789'],
    ];
    worksheet.addRows(exampleData);
    console.log('Step 1.7: Example data rows added');

    // Set column widths
    worksheet.columns = [
      { width: 30 }, // Email
      { width: 25 }, // Name
      { width: 15 }, // Role
      { width: 35 }, // Address
      { width: 20 }, // City
      { width: 15 }, // Phone
    ];
    console.log('Step 1.8: Column widths set');

    // Create helper sheet with valid roles first (needed for data validation reference)
    const rolesSheet = workbook.addWorksheet('Roluri Valide');
    rolesSheet.addRow(['Roluri Valide în Sistem']);
    rolesSheet.getRow(1).font = { bold: true };
    validRoles.forEach(role => {
      rolesSheet.addRow([role]);
    });
    rolesSheet.columns = [{ width: 20 }];
    console.log('Step 1.9: Helper sheet with valid roles created');

    // Add data validation to Role column (column C, starting from row 2)
    // Using a reference to the roles sheet for better Excel compatibility
    // Column A in roles sheet, rows 2 to 2+validRoles.length (skip header row)
    const rolesRange = `'Roluri Valide'!$A$2:$A$${validRoles.length + 1}`;
    const dataValidation = {
      type: 'list' as const,
      allowBlank: false,
      formulae: [rolesRange],
      showErrorMessage: true,
      errorTitle: 'Valoare invalidă',
      error: `Rolul trebuie să fie unul dintre: ${validRoles.join(', ')}`,
      promptTitle: 'Selectează rolul',
      prompt: `Selectează un rol din listă: ${validRoles.join(', ')}`,
    };
    
    // Apply validation to Role column (column C = index 3, starting from row 2)
    // Apply to rows 2-1000 to cover most use cases
    for (let row = 2; row <= 1000; row++) {
      worksheet.getCell(row, 3).dataValidation = dataValidation;
    }
    console.log('Step 1.10: Data validation applied to Role column (rows 2-1000)');

    // Generate filename with timestamp
    const fileName = `template-import-utilizatori-${new Date().toISOString().split('T')[0]}.xlsx`;
    console.log(`Step 2: Generating Excel buffer for file: ${fileName}`);

    // Convert workbook to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    console.log(`✓ Excel file generated: ${buffer.byteLength} bytes`);

    // Return file as download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('❌ Error generating template:', error);
    logError(error, { endpoint: '/api/users/template', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

