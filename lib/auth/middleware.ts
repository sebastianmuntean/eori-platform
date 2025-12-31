import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { userHasPermission } from "./permissions";
import { UnauthorizedError, ForbiddenError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

/**
 * Middleware to check if user has required permission
 */
export async function requirePermission(
  userId: string | null,
  permissionName: string
): Promise<{ success: boolean; error?: NextResponse }> {
  console.log(`Step 1: Checking permission requirement: ${permissionName}`);
  
  if (!userId) {
    logger.warn("Permission check failed: No user ID");
    return {
      success: false,
      error: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const hasPermission = await userHasPermission(userId, permissionName);
  
  if (!hasPermission) {
    logger.warn("Permission check failed", { userId, permissionName });
    return {
      success: false,
      error: NextResponse.json(
        { success: false, error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  console.log(`✓ Permission check passed: ${permissionName}`);
  return { success: true };
}

/**
 * Extract user ID from request (TODO: Implement JWT token extraction)
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  // TODO: Extract from JWT token or session cookie
  // For now, return null - will be implemented when auth is complete
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    // TODO: Verify and decode JWT token
    return null;
  }
  return null;
}




