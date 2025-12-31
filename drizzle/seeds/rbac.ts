/**
 * RBAC Seed Data
 * 
 * System roles and permissions for EORI platform
 */

import { db } from "@/lib/db";
import { roles, permissions, rolePermissions } from "../schema";

/**
 * System roles
 */
export const systemRoles = [
  { 
    name: "episcop", 
    displayName: "Episcop", 
    description: "Administrator principal cu toate permisiunile", 
    isSystem: true 
  },
  { 
    name: "vicar", 
    displayName: "Vicar", 
    description: "Administrator cu permisiuni extinse", 
    isSystem: true 
  },
  { 
    name: "paroh", 
    displayName: "Paroh", 
    description: "Gestionare completă parohie", 
    isSystem: true 
  },
  { 
    name: "secretar", 
    displayName: "Secretar", 
    description: "Registratură și documente", 
    isSystem: true 
  },
  { 
    name: "contabil", 
    displayName: "Contabil", 
    description: "Gestiune financiară", 
    isSystem: true 
  },
  {
    name: "bibliotecar",
    displayName: "Bibliotecar",
    description: "Gestionare bibliotecă parohială",
    isSystem: true
  },
  {
    name: "gestionar",
    displayName: "Gestionar",
    description: "Gestionare stocuri și inventar",
    isSystem: true
  }
];

/**
 * System permissions organized by resource
 */
export const systemPermissions = [
  // System
  { resource: "system", action: "all", displayName: "Acces complet sistem" },
  { resource: "system", action: "admin", displayName: "Administrare sistem" },
  
  // Users
  { resource: "users", action: "create", displayName: "Creare utilizatori" },
  { resource: "users", action: "read", displayName: "Vizualizare utilizatori" },
  { resource: "users", action: "update", displayName: "Editare utilizatori" },
  { resource: "users", action: "delete", displayName: "Ștergere utilizatori" },
  { resource: "users", action: "approve", displayName: "Aprobare utilizatori" },
  
  // Documents
  { resource: "documents", action: "create", displayName: "Înregistrare documente" },
  { resource: "documents", action: "read", displayName: "Vizualizare documente" },
  { resource: "documents", action: "update", displayName: "Editare documente" },
  { resource: "documents", action: "delete", displayName: "Ștergere documente" },
  { resource: "documents", action: "approve", displayName: "Aprobare documente" },
  { resource: "documents", action: "export", displayName: "Export documente" },
  
  // Cemetery
  { resource: "cemetery", action: "create", displayName: "Creare înregistrări cimitir" },
  { resource: "cemetery", action: "read", displayName: "Vizualizare cimitir" },
  { resource: "cemetery", action: "update", displayName: "Editare cimitir" },
  { resource: "cemetery", action: "delete", displayName: "Ștergere din cimitir" },
  { resource: "cemetery", action: "export", displayName: "Export date cimitir" },
  
  // Concessions
  { resource: "concessions", action: "create", displayName: "Creare concesiuni" },
  { resource: "concessions", action: "read", displayName: "Vizualizare concesiuni" },
  { resource: "concessions", action: "update", displayName: "Editare concesiuni" },
  { resource: "concessions", action: "delete", displayName: "Ștergere concesiuni" },
  { resource: "concessions", action: "renew", displayName: "Reînnoire concesiuni" },
  
  // Accounting
  { resource: "accounting", action: "create", displayName: "Creare tranzacții" },
  { resource: "accounting", action: "read", displayName: "Vizualizare contabilitate" },
  { resource: "accounting", action: "update", displayName: "Editare tranzacții" },
  { resource: "accounting", action: "delete", displayName: "Ștergere tranzacții" },
  { resource: "accounting", action: "approve", displayName: "Aprobare tranzacții" },
  { resource: "accounting", action: "export", displayName: "Export rapoarte financiare" },
  
  // Invoices
  { resource: "invoices", action: "create", displayName: "Creare facturi" },
  { resource: "invoices", action: "read", displayName: "Vizualizare facturi" },
  { resource: "invoices", action: "update", displayName: "Editare facturi" },
  { resource: "invoices", action: "delete", displayName: "Anulare facturi" },
  { resource: "invoices", action: "export", displayName: "Export facturi" },
  
  // Inventory
  { resource: "inventory", action: "create", displayName: "Adăugare în stoc" },
  { resource: "inventory", action: "read", displayName: "Vizualizare stocuri" },
  { resource: "inventory", action: "update", displayName: "Actualizare stocuri" },
  { resource: "inventory", action: "delete", displayName: "Eliminare din stoc" },
  { resource: "inventory", action: "transfer", displayName: "Transfer între gestiuni" },
  { resource: "inventory", action: "export", displayName: "Export inventar" },
  
  // Sales
  { resource: "sales", action: "create", displayName: "Înregistrare vânzări" },
  { resource: "sales", action: "read", displayName: "Vizualizare vânzări" },
  { resource: "sales", action: "update", displayName: "Editare vânzări" },
  { resource: "sales", action: "delete", displayName: "Anulare vânzări" },
  
  // Library
  { resource: "library", action: "create", displayName: "Adăugare cărți" },
  { resource: "library", action: "read", displayName: "Vizualizare bibliotecă" },
  { resource: "library", action: "update", displayName: "Editare cărți" },
  { resource: "library", action: "delete", displayName: "Eliminare cărți" },
  { resource: "library", action: "loan", displayName: "Gestionare împrumuturi" },
  
  // Fleet
  { resource: "fleet", action: "create", displayName: "Adăugare vehicule" },
  { resource: "fleet", action: "read", displayName: "Vizualizare parc auto" },
  { resource: "fleet", action: "update", displayName: "Editare vehicule" },
  { resource: "fleet", action: "delete", displayName: "Eliminare vehicule" },
  
  // Fixed Assets
  { resource: "assets", action: "create", displayName: "Adăugare mijloace fixe" },
  { resource: "assets", action: "read", displayName: "Vizualizare mijloace fixe" },
  { resource: "assets", action: "update", displayName: "Editare mijloace fixe" },
  { resource: "assets", action: "delete", displayName: "Casare mijloace fixe" },
  
  // HR
  { resource: "hr", action: "create", displayName: "Adăugare angajați" },
  { resource: "hr", action: "read", displayName: "Vizualizare personal" },
  { resource: "hr", action: "update", displayName: "Editare personal" },
  { resource: "hr", action: "delete", displayName: "Eliminare personal" },
  { resource: "hr", action: "approve_leave", displayName: "Aprobare concedii" },
  
  // Partners
  { resource: "partners", action: "create", displayName: "Adăugare parteneri" },
  { resource: "partners", action: "read", displayName: "Vizualizare parteneri" },
  { resource: "partners", action: "update", displayName: "Editare parteneri" },
  { resource: "partners", action: "delete", displayName: "Eliminare parteneri" },
  
  // Reports
  { resource: "reports", action: "view", displayName: "Vizualizare rapoarte" },
  { resource: "reports", action: "export", displayName: "Export rapoarte" },
  
  // Settings
  { resource: "settings", action: "read", displayName: "Vizualizare setări" },
  { resource: "settings", action: "update", displayName: "Modificare setări" },
];

/**
 * Role to permissions mapping
 */
export const rolePermissionMapping: Record<string, string[]> = {
  episcop: ["system.all"],
  
  vicar: [
    "system.admin",
    "users.create", "users.read", "users.update", "users.approve",
    "documents.create", "documents.read", "documents.update", "documents.approve", "documents.export",
    "cemetery.create", "cemetery.read", "cemetery.update", "cemetery.export",
    "concessions.create", "concessions.read", "concessions.update", "concessions.renew",
    "accounting.create", "accounting.read", "accounting.update", "accounting.approve", "accounting.export",
    "invoices.create", "invoices.read", "invoices.update", "invoices.export",
    "inventory.create", "inventory.read", "inventory.update", "inventory.transfer", "inventory.export",
    "sales.create", "sales.read", "sales.update",
    "library.create", "library.read", "library.update", "library.loan",
    "fleet.create", "fleet.read", "fleet.update",
    "assets.create", "assets.read", "assets.update",
    "hr.create", "hr.read", "hr.update", "hr.approve_leave",
    "partners.create", "partners.read", "partners.update",
    "reports.view", "reports.export",
    "settings.read", "settings.update",
  ],
  
  paroh: [
    "users.read",
    "documents.create", "documents.read", "documents.update", "documents.approve", "documents.export",
    "cemetery.create", "cemetery.read", "cemetery.update", "cemetery.export",
    "concessions.create", "concessions.read", "concessions.update", "concessions.renew",
    "accounting.create", "accounting.read", "accounting.update", "accounting.approve", "accounting.export",
    "invoices.create", "invoices.read", "invoices.update", "invoices.export",
    "inventory.create", "inventory.read", "inventory.update", "inventory.transfer",
    "sales.create", "sales.read", "sales.update",
    "library.create", "library.read", "library.update", "library.loan",
    "fleet.create", "fleet.read", "fleet.update",
    "assets.create", "assets.read", "assets.update",
    "hr.create", "hr.read", "hr.update", "hr.approve_leave",
    "partners.create", "partners.read", "partners.update",
    "reports.view", "reports.export",
    "settings.read", "settings.update",
  ],
  
  secretar: [
    "documents.create", "documents.read", "documents.update", "documents.export",
    "partners.create", "partners.read", "partners.update",
    "reports.view",
  ],
  
  contabil: [
    "accounting.create", "accounting.read", "accounting.update", "accounting.export",
    "invoices.create", "invoices.read", "invoices.update", "invoices.export",
    "concessions.read", "concessions.update",
    "sales.read",
    "inventory.read",
    "partners.read", "partners.update",
    "reports.view", "reports.export",
  ],
  
  bibliotecar: [
    "library.create", "library.read", "library.update", "library.loan",
    "partners.read",
  ],
  
  gestionar: [
    "inventory.create", "inventory.read", "inventory.update", "inventory.transfer",
    "sales.create", "sales.read", "sales.update",
    "partners.read",
  ],
};

/**
 * Seed RBAC data
 */
export async function seedRBAC() {
  console.log("🌱 Seeding RBAC data...");
  
  // Insert roles
  console.log("  📝 Creating roles...");
  const insertedRoles = await db.insert(roles)
    .values(systemRoles)
    .onConflictDoNothing()
    .returning();
  console.log(`  ✓ Created ${insertedRoles.length} roles`);
  
  // Insert permissions
  console.log("  📝 Creating permissions...");
  const permissionData = systemPermissions.map(p => ({
    resource: p.resource,
    action: p.action,
    name: `${p.resource}.${p.action}`,
    displayName: p.displayName,
    description: p.displayName,
    isSystem: true,
  }));
  
  const insertedPermissions = await db.insert(permissions)
    .values(permissionData)
    .onConflictDoNothing()
    .returning();
  console.log(`  ✓ Created ${insertedPermissions.length} permissions`);
  
  // Create role-permission mappings
  console.log("  📝 Creating role-permission mappings...");
  
  // Get all roles and permissions from DB
  const allRoles = await db.select().from(roles);
  const allPermissions = await db.select().from(permissions);
  
  const roleMap = new Map(allRoles.map(r => [r.name, r.id]));
  const permMap = new Map(allPermissions.map(p => [p.name, p.id]));
  
  const rolePermData: Array<{ roleId: string; permissionId: string }> = [];
  
  for (const [roleName, permNames] of Object.entries(rolePermissionMapping)) {
    const roleId = roleMap.get(roleName);
    if (!roleId) continue;
    
    for (const permName of permNames) {
      const permId = permMap.get(permName);
      if (permId) {
        rolePermData.push({ roleId, permissionId: permId });
      }
    }
  }
  
  if (rolePermData.length > 0) {
    await db.insert(rolePermissions)
      .values(rolePermData)
      .onConflictDoNothing();
  }
  
  console.log(`  ✓ Created ${rolePermData.length} role-permission mappings`);
  console.log("✅ RBAC seeding complete!");
}
