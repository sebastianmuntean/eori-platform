/**
 * Shared type definitions for superadmin module
 */

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Array<{
    id: string;
    name: string;
    resource: string;
    action: string;
  }>;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string | null;
}

