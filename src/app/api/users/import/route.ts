import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { hashPassword } from '@/lib/auth';
import { sendUserConfirmationEmail } from '@/lib/email';
import { eq } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import { randomBytes } from 'crypto';

/**
 * Generate a secure verification token
 */
function generateVerificationToken(): string {
  console.log('Step 1: Generating verification token');
  const token = randomBytes(32).toString('hex');
  console.log(`✓ Verification token generated: ${token.substring(0, 8)}...`);
  return token;
}

/**
 * POST /api/users/import - Import users from Excel file
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/users/import - Processing Excel import');

  try {
    console.log('Step 2: Parsing form data');
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`Step 3: Processing file: ${file.name} (${file.size} bytes)`);

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('Step 4: Parsing Excel file');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✓ Found ${data.length} rows in Excel file`);

    const results = {
      total: data.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; email: string; error: string }>,
    };

    console.log('Step 5: Processing rows');
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we skip header

      try {
        console.log(`Step 5.${i + 1}: Processing row ${rowNumber}`);

        // Extract data from row (adjust column names based on your Excel template)
        const email = row.Email || row.email || row['E-mail'] || '';
        const name = row.Name || row.name || row.Nume || '';
        const role = row.Role || row.role || row.Rol || 'paroh'; // Default role
        const address = row.Address || row.address || row['Adresa'] || '';
        const city = row.City || row.city || row['Oraș'] || row['Oras'] || '';
        const phone = row.Phone || row.phone || row['Telefon'] || '';

        // Validate required fields
        if (!email || typeof email !== 'string' || !email.includes('@')) {
          throw new Error('Invalid or missing email');
        }

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
          throw new Error('Invalid or missing name');
        }

        // Validate role against system enum
        const validRoles = ['episcop', 'vicar', 'paroh', 'secretar', 'contabil'];
        if (!validRoles.includes(role)) {
          throw new Error(`Invalid role: ${role}. Valid roles are: ${validRoles.join(', ')}`);
        }

        console.log(`  Row ${rowNumber}: ${email} - ${name} - ${role}`);
        if (address || city || phone) {
          console.log(`  Additional info - Address: ${address}, City: ${city}, Phone: ${phone}`);
        }

        // Check if user already exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser) {
          console.log(`  ⚠️ User with email ${email} already exists, skipping`);
          results.failed++;
          results.errors.push({
            row: rowNumber,
            email,
            error: 'User with this email already exists',
          });
          continue;
        }

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const verificationExpiry = new Date();
        verificationExpiry.setDate(verificationExpiry.getDate() + 7); // 7 days

        // Create temporary password hash
        const tempPassword = randomBytes(16).toString('hex');
        const tempPasswordHash = await hashPassword(tempPassword);

        console.log(`  Step 5.${i + 1}.1: Creating user record`);
        // Insert user with address, city, and phone
        const [newUser] = await db
          .insert(users)
          .values({
            email: email.trim(),
            name: name.trim(),
            passwordHash: tempPasswordHash,
            address: address ? address.trim() : null,
            city: city ? city.trim() : null,
            phone: phone ? phone.trim() : null,
          })
          .returning();

        console.log(`  ✓ User created: ${newUser.id}`);

        // Generate confirmation link
        const locale = 'ro'; // Default locale
        const confirmationLink = `${process.env.APP_URL || 'http://localhost:3050'}/${locale}/confirm-password?token=${verificationToken}`;

        console.log(`  Step 5.${i + 1}.2: Sending confirmation email`);
        // Send confirmation email (async, don't wait)
        sendUserConfirmationEmail(email, name, confirmationLink).catch((error) => {
          console.error(`  ❌ Failed to send email to ${email}:`, error);
        });

        // Store verification token
        await db
          .update(users)
          .set({
            verificationCode: verificationToken,
            verificationCodeExpiry: verificationExpiry,
          })
          .where(eq(users.id, newUser.id));

        results.successful++;
        console.log(`  ✓ Row ${rowNumber} processed successfully`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`  ❌ Error processing row ${rowNumber}:`, errorMessage);
        results.failed++;
        results.errors.push({
          row: rowNumber,
          email: (row.Email || row.email || row['E-mail'] || 'unknown') as string,
          error: errorMessage,
        });
      }
    }

    console.log(`✓ Import completed: ${results.successful} successful, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('❌ Error importing users:', error);
    logError(error, { endpoint: '/api/users/import', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

