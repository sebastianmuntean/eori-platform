import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userParishes } from '@/drizzle/schema/auth/user-parishes';
import { users } from '@/drizzle/schema/auth/users';
import { parishes } from '@/drizzle/schema/core/parishes';
import { eq, and } from 'drizzle-orm';
import { createUserParishSchema, userParishQuerySchema } from '@/src/lib/validations/user-parishes';

/**
 * GET /api/user-parishes - List user-parish assignments
 */
export async function GET(request: Request) {
  console.log('GET /api/user-parishes - Fetching user-parish assignments');

  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryResult = userParishQuerySchema.safeParse({
      userId: searchParams.get('userId'),
      parishId: searchParams.get('parishId'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters' },
        { status: 400 }
      );
    }

    const { userId, parishId } = queryResult.data;

    // Build query with joins
    let query = db
      .select({
        id: userParishes.id,
        userId: userParishes.userId,
        parishId: userParishes.parishId,
        isPrimary: userParishes.isPrimary,
        accessLevel: userParishes.accessLevel,
        createdAt: userParishes.createdAt,
        userName: users.name,
        userEmail: users.email,
        parishCode: parishes.code,
        parishName: parishes.name,
      })
      .from(userParishes)
      .leftJoin(users, eq(userParishes.userId, users.id))
      .leftJoin(parishes, eq(userParishes.parishId, parishes.id));

    // Apply filters
    const conditions = [];
    if (userId) {
      conditions.push(eq(userParishes.userId, userId));
    }
    if (parishId) {
      conditions.push(eq(userParishes.parishId, parishId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const items = await query;

    console.log(`✓ Found ${items.length} user-parish assignments`);

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('❌ Error fetching user-parishes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user-parish assignments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user-parishes - Assign a user to a parish
 */
export async function POST(request: Request) {
  console.log('POST /api/user-parishes - Creating user-parish assignment');

  try {
    const body = await request.json();
    
    // Validate request body
    const validation = createUserParishSchema.safeParse(body);
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { userId, parishId, isPrimary, accessLevel } = validation.data;

    // Check if user exists
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilizatorul nu există' },
        { status: 400 }
      );
    }

    // Check if parish exists
    const [parish] = await db
      .select({ id: parishes.id })
      .from(parishes)
      .where(eq(parishes.id, parishId))
      .limit(1);

    if (!parish) {
      return NextResponse.json(
        { success: false, error: 'Parohia nu există' },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const [existing] = await db
      .select({ id: userParishes.id })
      .from(userParishes)
      .where(and(
        eq(userParishes.userId, userId),
        eq(userParishes.parishId, parishId)
      ))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Utilizatorul este deja asociat acestei parohii' },
        { status: 400 }
      );
    }

    // If this is set as primary, unset other primaries for this user
    if (isPrimary) {
      await db
        .update(userParishes)
        .set({ isPrimary: false })
        .where(eq(userParishes.userId, userId));
    }

    // Insert new assignment
    const [newAssignment] = await db
      .insert(userParishes)
      .values({
        userId,
        parishId,
        isPrimary,
        accessLevel,
      })
      .returning();

    console.log(`✓ User-parish assignment created: ${newAssignment.id}`);

    return NextResponse.json(
      { success: true, data: newAssignment },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating user-parish assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user-parish assignment' },
      { status: 500 }
    );
  }
}
