import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/drizzle/schema";

// Lazy initialization to avoid connection during build
let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

function getDatabase() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    console.log("Step 1: Initializing database connection...");
    const connectionString = process.env.DATABASE_URL;
    
    // Disable prefetch as it is not supported for "Transaction" pool mode
    _client = postgres(connectionString, { prepare: false });
    console.log("✓ PostgreSQL client created");
    
    _db = drizzle(_client, { schema });
    console.log("✓ Drizzle ORM initialized with schema");
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return getDatabase()[prop as keyof ReturnType<typeof drizzle>];
  },
});

export type Database = typeof db;
