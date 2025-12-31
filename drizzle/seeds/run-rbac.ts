/**
 * Script to run RBAC seeding
 * 
 * Usage: npm run db:seed:rbac
 */

import "dotenv/config";
import { seedRBAC } from "./rbac";

async function main() {
  try {
    await seedRBAC();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding RBAC:", error);
    process.exit(1);
  }
}

main();
