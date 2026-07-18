import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

function isLocalDatabase(connectionString: string): boolean {
  return (
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1')
  );
}

function getPoolConfig(): PoolConfig {
  const connectionString = process.env.DATABASE_URL!;

  if (isLocalDatabase(connectionString)) {
    return { connectionString, max: 10 };
  }

  // pg v8 treats sslmode=prefer as verify-full; VPS uses a self-signed cert.
  // Same pattern as energotc — strip query params and configure SSL explicitly.
  const baseUrl = connectionString.split('?')[0]!;
  const rejectUnauthorized =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true';

  return {
    connectionString: baseUrl,
    max: 10,
    ssl: { rejectUnauthorized },
  };
}

const pool = new Pool(getPoolConfig());

export const db = drizzle(pool, { schema });
