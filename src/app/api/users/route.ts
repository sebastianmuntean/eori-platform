import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { hashPassword, requireAuth } from '@/lib/auth';
import { sendUserConfirmationEmail } from '@/lib/email';
import { generateVerificationToken } from '@/lib/auth/tokens';
import { eq, like, or, desc, asc, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['episcop', 'vicar', 'paroh', 'secretar', 'contabil']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional().default('pending'),
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['episcop', 'vicar', 'paroh', 'secretar', 'contabil']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
});

/**
 * GET /api/users - Fetch all users with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/users - Fetching users');

  try {
    // Require authentication
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active' | 'inactive'
    const approvalStatus = searchParams.get('approvalStatus'); // 'pending' | 'approved' | 'rejected'
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log(`Step 2: Query parameters - page: ${page}, pageSize: ${pageSize}, search: ${search}, status: ${status}, approvalStatus: ${approvalStatus}`);

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.name, `%${search}%`),
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

    console.log(`Step 3: Building query with ${conditions.length} conditions`);

    // Build where clause
    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions))
      : undefined;

    // Get total count with conditions
    let countQuery: any = db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    if (whereClause) {
      countQuery = countQuery.where(whereClause);
    }
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    let query: any = db.select().from(users);
    if (whereClause) {
      query = query.where(whereClause);
    }

    // Apply sorting
    if (sortBy === 'createdAt') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(users.createdAt))
        : query.orderBy(asc(users.createdAt));
    } else if (sortBy === 'email') {
      query = sortOrder === 'desc'
        ? query.orderBy(desc(users.email))
        : query.orderBy(asc(users.email));
    }

    const allUsers = await query.limit(pageSize).offset(offset);

    // Remove password hashes from response
    const usersWithoutPasswords = allUsers.map((user: typeof users.$inferSelect) => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    console.log(`✓ Found ${allUsers.length} users (total: ${totalCount})`);

    return NextResponse.json({
      success: true,
      data: usersWithoutPasswords,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    logError(error, { endpoint: '/api/users', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/users - Create a new user
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/users - Creating new user');

  try {
    // Require authentication
    await requireAuth();
    const body = await request.json();
    console.log('Step 2: Validating request body');
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, name, role, address, city, phone, isActive, approvalStatus } = validation.data;

    console.log(`Step 3: Checking if user with email ${email} already exists`);
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      console.log(`❌ User with email ${email} already exists`);
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    console.log('Step 4: Generating verification token');
    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date();
    verificationExpiry.setDate(verificationExpiry.getDate() + 7); // 7 days from now

    console.log('Step 5: Creating temporary password hash');
    // Create a temporary password hash (user will set their own password via confirmation)
    const tempPassword = randomBytes(16).toString('hex');
    const tempPasswordHash = await hashPassword(tempPassword);

    console.log('Step 6: Inserting user into database');
    // Insert user with all fields including role, address, city, phone, isActive, and approvalStatus
    const insertValues: {
      email: string;
      name: string;
      role: 'episcop' | 'vicar' | 'paroh' | 'secretar' | 'contabil';
      passwordHash: string;
      address?: string | null;
      city?: string | null;
      phone?: string | null;
      isActive: boolean;
      approvalStatus: 'pending' | 'approved' | 'rejected';
    } = {
      email,
      name: name || '',
      role: role || 'paroh',
      passwordHash: tempPasswordHash, // Temporary, will be changed via confirmation
      isActive: isActive ?? true,
      approvalStatus: approvalStatus || 'pending',
    };
    
    if (address) insertValues.address = address;
    if (city) insertValues.city = city;
    if (phone) insertValues.phone = phone;
    
    const [newUser] = await db
      .insert(users)
      .values(insertValues)
      .returning();

    console.log(`✓ User created with ID: ${newUser.id}`);

    // Generate confirmation link
    const locale = 'ro'; // Default locale, can be passed from request
    const confirmationLink = `${process.env.APP_URL || 'http://localhost:4058'}/${locale}/confirm-password?token=${verificationToken}`;

    console.log('Step 7: Sending confirmation email');
    // Send confirmation email (async, don't wait)
    sendUserConfirmationEmail(email, name || email, confirmationLink).catch((error) => {
      console.error('❌ Failed to send confirmation email:', error);
      // Don't fail user creation if email fails
    });

    // Store verification token
    await db
      .update(users)
      .set({
        verificationCode: verificationToken,
        verificationCodeExpiry: verificationExpiry,
      })
      .where(eq(users.id, newUser.id));

    console.log(`✓ User created successfully: ${newUser.id}`);
    const { passwordHash, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      {
        success: true,
        data: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating user:', error);
    logError(error, { endpoint: '/api/users', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/users - Update user details
 */
export async function PUT(request: Request) {
  console.log('Step 1: PUT /api/users - Updating user');

  try {
    // Require authentication
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      console.log('❌ Missing user ID');
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('Step 2: Validating request body');
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    console.log(`Step 3: Checking if user ${userId} exists`);
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      console.log(`❌ User with id ${userId} not found`);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (validation.data.email && validation.data.email !== existingUser.email) {
      console.log(`Step 4: Checking if email ${validation.data.email} is available`);
      const [emailUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, validation.data.email))
        .limit(1);

      if (emailUser) {
        console.log(`❌ Email ${validation.data.email} is already taken`);
        return NextResponse.json(
          { success: false, error: 'Email is already taken' },
          { status: 400 }
        );
      }
    }

    console.log('Step 5: Updating user');
    const updateData: {
      updatedAt: Date;
      name?: string;
      email?: string;
      role?: 'episcop' | 'vicar' | 'paroh' | 'secretar' | 'contabil';
      address?: string | null;
      city?: string | null;
      phone?: string | null;
      isActive?: boolean;
      approvalStatus?: 'pending' | 'approved' | 'rejected';
    } = {
      updatedAt: new Date(),
    };

    if (validation.data.name !== undefined) {
      updateData.name = validation.data.name;
    }
    if (validation.data.email !== undefined) {
      updateData.email = validation.data.email;
    }
    if (validation.data.role !== undefined) {
      updateData.role = validation.data.role;
    }
    if (validation.data.address !== undefined) {
      updateData.address = validation.data.address || null;
    }
    if (validation.data.city !== undefined) {
      updateData.city = validation.data.city || null;
    }
    if (validation.data.phone !== undefined) {
      updateData.phone = validation.data.phone || null;
    }
    if (validation.data.isActive !== undefined) {
      updateData.isActive = validation.data.isActive;
    }
    if (validation.data.approvalStatus !== undefined) {
      updateData.approvalStatus = validation.data.approvalStatus;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    console.log(`✓ User updated successfully: ${userId}`);
    const { passwordHash, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    logError(error, { endpoint: '/api/users', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/users - Delete a user (soft delete)
 */
export async function DELETE(request: Request) {
  console.log('Step 1: DELETE /api/users - Deleting user');

  try {
    // Require authentication
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      console.log('❌ Missing user ID');
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`Step 2: Checking if user ${userId} exists`);
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      console.log(`❌ User with id ${userId} not found`);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Step 3: Soft deleting user (setting isActive to false)');
    // Perform soft delete by setting isActive to false
    await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    console.log(`✓ User deleted successfully: ${userId}`);
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    logError(error, { endpoint: '/api/users', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

