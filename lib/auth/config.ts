import { db } from "@/lib/db";
import { users } from "@/drizzle/schema/users";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

console.log("Step 1: Loading auth configuration...");

type UserWithoutPassword = Omit<typeof users.$inferSelect, "passwordHash">;

/**
 * Verify user credentials
 */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserWithoutPassword; error?: string }> {
  try {
    console.log(`Step 1: Verifying credentials for email: ${email}`);
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.log("❌ User not found");
      return { success: false, error: "Invalid credentials" };
    }

    if (!user.isActive) {
      console.log("❌ User account is inactive");
      return { success: false, error: "Account is inactive" };
    }

    if (user.approvalStatus !== "approved") {
      console.log("❌ User account not approved");
      return { success: false, error: "Account pending approval" };
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      console.log("❌ Invalid password");
      return { success: false, error: "Invalid credentials" };
    }

    console.log("✓ Credentials verified successfully");
    // Don't return password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword as UserWithoutPassword };
  } catch (error) {
    console.error("❌ Error verifying credentials:", error);
    return { success: false, error: "Authentication failed" };
  }
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  console.log("Step 1: Hashing password...");
  const saltRounds = 12;
  const hashed = await bcrypt.hash(password, saltRounds);
  console.log("✓ Password hashed");
  return hashed;
}

