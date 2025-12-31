// Re-export database types from Drizzle schema
export type { Database } from "@/lib/db";

// Additional type helpers can be added here
export type TableNames = 
  | "users"
  | "roles"
  | "permissions"
  | "role_permissions"
  | "user_roles"
  | "user_permission_overrides"
  | "user_resource_access"
  | "parohii"
  | "cimitire"
  | "biblioteca_carti"
  | "parteneri"
  | "enoriasi"
  | "contracte"
  | "articole"
  | "rip"
  | "documente";




