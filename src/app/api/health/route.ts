import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health — DB connectivity probe for production diagnostics
 */
export async function GET() {
  const dbConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const host = (() => {
    try {
      const raw = process.env.DATABASE_URL?.trim() || '';
      return new URL(raw).host || null;
    } catch {
      return null;
    }
  })();

  if (!dbConfigured) {
    return NextResponse.json(
      { ok: false, dbConfigured: false, db: false, host: null },
      { status: 500 }
    );
  }

  try {
    const { db } = await import('@/database/client');
    const result = await db.execute(sql`SELECT 1 as ok`);
    const rows = (result as unknown as { rows?: Array<Record<string, unknown>> })
      .rows;
    const okValue = rows?.[0]?.ok;

    return NextResponse.json({
      ok: true,
      dbConfigured: true,
      db: okValue === 1 || okValue === '1' || Boolean(rows?.length),
      host,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const cause =
      error instanceof Error && 'cause' in error
        ? String((error as Error & { cause?: unknown }).cause)
        : undefined;

    console.error('Health DB check failed:', message, cause);

    return NextResponse.json(
      {
        ok: false,
        dbConfigured: true,
        db: false,
        host,
        error: message,
        cause,
      },
      { status: 500 }
    );
  }
}
