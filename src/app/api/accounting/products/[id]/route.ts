import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { products } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, ne } from 'drizzle-orm';
import { z } from 'zod';

const updateProductSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50).optional(),
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  unit: z.string().max(20).optional(),
  purchasePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Purchase price must be a valid number').optional().nullable(),
  salePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Sale price must be a valid number').optional().nullable(),
  vatRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'VAT rate must be a valid number').optional(),
  barcode: z.string().max(100).optional().nullable(),
  trackStock: z.boolean().optional(),
  minStock: z.string().regex(/^\d+(\.\d{1,3})?$/, 'Min stock must be a valid number').optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/accounting/products/:id - Get product by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    logError(error, { endpoint: '/api/accounting/products/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/accounting/products/:id - Update product
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // If code is being updated, check if it conflicts with another product
    if (data.code && data.code !== existingProduct.code) {
      const [conflictingProduct] = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.parishId, existingProduct.parishId),
            eq(products.code, data.code),
            ne(products.id, id)
          )
        )
        .limit(1);

      if (conflictingProduct) {
        return NextResponse.json(
          { success: false, error: 'Product code already exists for this parish' },
          { status: 400 }
        );
      }
    }

    // Update product
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...data,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    console.error('❌ Error updating product:', error);
    logError(error, { endpoint: '/api/accounting/products/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/accounting/products/:id - Delete product
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete product (cascade will handle related stock_movements)
    await db
      .delete(products)
      .where(eq(products.id, id));

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    logError(error, { endpoint: '/api/accounting/products/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

