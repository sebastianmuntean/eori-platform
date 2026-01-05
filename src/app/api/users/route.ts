import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { hashPassword, requireAuth } from '@/lib/auth';
import { sendUserConfirmationEmail } from '@/lib/email';
import { generateVerificationToken } from '@/lib/auth/tokens';
import { logCreate, logUpdate, logDelete, extractIpAddress, extractUserAgent } from '@/lib/audit/audit-logger';
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
 * @openapi
 * /api/users:
 *   get:
 *     summary: Fetch all users with pagination, filtering, and sorting
 *     description: |
 *       Retrieves a paginated list of users with optional filtering and sorting.
 *       Requires authentication.
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Page number (1-indexed)
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: pageSize
 *         in: query
 *         description: Number of items per page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - name: search
 *         in: query
 *         description: Search query (searches email, name, address, city, phone)
 *         required: false
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         description: Filter by active status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *       - name: approvalStatus
 *         in: query
 *         description: Filter by approval status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - name: sortBy
 *         in: query
 *         description: Field to sort by
 *         required: false
 *         schema:
 *           type: string
 *           enum: [createdAt, email]
 *           default: createdAt
 *       - name: sortOrder
 *         in: query
 *         description: Sort order
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *             example:
 *               success: true
 *               data:
 *                 - id: "123e4567-e89b-12d3-a456-426614174000"
 *                   email: "user@example.com"
 *                   name: "John Doe"
 *                   role: "paroh"
 *                   isActive: true
 *                   approvalStatus: "approved"
 *               pagination:
 *                 page: 1
 *                 pageSize: 10
 *                 total: 100
 *                 totalPages: 10
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @openapi
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: |
 *       Creates a new user account. The user will receive a confirmation email
 *       to set their password. Requires authentication.
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [episcop, vicar, paroh, secretar, contabil]
 *                 example: paroh
 *               address:
 *                 type: string
 *                 example: "123 Main St"
 *               city:
 *                 type: string
 *                 example: "Bucharest"
 *               phone:
 *                 type: string
 *                 example: "+40123456789"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               approvalStatus:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *                 default: pending
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: "User created successfully. Confirmation email sent."
 *       400:
 *         description: Invalid input or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "User with this email already exists"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/users - Creating new user');

  try {
    // Require authentication
    const { userId } = await requireAuth();
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
    
    // Log audit event for user creation
    logCreate(
      userId,
      'user',
      newUser.id,
      {
        ipAddress: extractIpAddress(request),
        userAgent: extractUserAgent(request),
        requestMethod: 'POST',
        endpoint: '/api/users',
      }
    ).catch((err) => {
      console.error('Failed to log user creation audit event:', err);
    });
    
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
    const { userId: currentUserId } = await requireAuth();
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
    
    // Capture before state for audit log
    const beforeState = {
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      address: existingUser.address,
      city: existingUser.city,
      phone: existingUser.phone,
      isActive: existingUser.isActive,
      approvalStatus: existingUser.approvalStatus,
    };
    
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
    
    // Log audit event for user update with before/after state
    const afterState = {
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      address: updatedUser.address,
      city: updatedUser.city,
      phone: updatedUser.phone,
      isActive: updatedUser.isActive,
      approvalStatus: updatedUser.approvalStatus,
    };
    
    logUpdate(
      currentUserId,
      'user',
      userId,
      { before: beforeState, after: afterState },
      {
        ipAddress: extractIpAddress(request),
        userAgent: extractUserAgent(request),
        requestMethod: 'PUT',
        endpoint: '/api/users',
      }
    ).catch((err) => {
      console.error('Failed to log user update audit event:', err);
    });
    
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
    const { userId: currentUserId } = await requireAuth();
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
    
    // Log audit event for user deletion
    logDelete(
      currentUserId,
      'user',
      userId,
      {
        ipAddress: extractIpAddress(request),
        userAgent: extractUserAgent(request),
        requestMethod: 'DELETE',
        endpoint: '/api/users',
        metadata: {
          softDelete: true,
          previousState: {
            isActive: existingUser.isActive,
          },
        },
      }
    ).catch((err) => {
      console.error('Failed to log user deletion audit event:', err);
    });
    
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

