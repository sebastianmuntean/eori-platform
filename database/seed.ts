import 'dotenv/config';
import { db } from './client';
import { roles, permissions, rolePermissions, emailTemplates } from './schema';
import { eq, and } from 'drizzle-orm';

console.log('Step 1: Starting database seed...');

// Standard roles
const standardRoles = [
  {
    name: 'superadmin',
    description: 'Super Administrator - Acces complet la toate funcțiile sistemului',
  },
  {
    name: 'admin',
    description: 'Administrator - Gestionare utilizatori, roluri și setări generale',
  },
  {
    name: 'moderator',
    description: 'Moderator - Gestionare conținut și utilizatori limitată',
  },
  {
    name: 'user',
    description: 'Utilizator standard - Acces de bază la platformă',
  },
];

// Standard permissions by resource
const standardPermissions = [
  // Users resource
  { name: 'users.read', resource: 'users', action: 'read', description: 'Vizualizare utilizatori' },
  { name: 'users.write', resource: 'users', action: 'write', description: 'Creare și editare utilizatori' },
  { name: 'users.delete', resource: 'users', action: 'delete', description: 'Ștergere utilizatori' },
  { name: 'users.manage', resource: 'users', action: 'manage', description: 'Gestionare completă utilizatori (include assign roles)' },
  
  // Roles resource
  { name: 'roles.read', resource: 'roles', action: 'read', description: 'Vizualizare roluri' },
  { name: 'roles.write', resource: 'roles', action: 'write', description: 'Creare și editare roluri' },
  { name: 'roles.delete', resource: 'roles', action: 'delete', description: 'Ștergere roluri' },
  { name: 'roles.manage', resource: 'roles', action: 'manage', description: 'Gestionare completă roluri (include assign permissions)' },
  
  // Permissions resource
  { name: 'permissions.read', resource: 'permissions', action: 'read', description: 'Vizualizare permisiuni' },
  { name: 'permissions.write', resource: 'permissions', action: 'write', description: 'Creare și editare permisiuni' },
  { name: 'permissions.delete', resource: 'permissions', action: 'delete', description: 'Ștergere permisiuni' },
  { name: 'permissions.manage', resource: 'permissions', action: 'manage', description: 'Gestionare completă permisiuni' },
  
  // Posts resource
  { name: 'posts.read', resource: 'posts', action: 'read', description: 'Vizualizare postări' },
  { name: 'posts.write', resource: 'posts', action: 'write', description: 'Creare și editare postări' },
  { name: 'posts.delete', resource: 'posts', action: 'delete', description: 'Ștergere postări' },
  { name: 'posts.manage', resource: 'posts', action: 'manage', description: 'Gestionare completă postări (toate postările)' },
  
  // Settings resource
  { name: 'settings.read', resource: 'settings', action: 'read', description: 'Vizualizare setări' },
  { name: 'settings.write', resource: 'settings', action: 'write', description: 'Editare setări' },
  { name: 'settings.manage', resource: 'settings', action: 'manage', description: 'Gestionare completă setări' },
  
  // Reports resource
  { name: 'reports.read', resource: 'reports', action: 'read', description: 'Vizualizare rapoarte' },
  { name: 'reports.write', resource: 'reports', action: 'write', description: 'Creare rapoarte' },
  { name: 'reports.delete', resource: 'reports', action: 'delete', description: 'Ștergere rapoarte' },
  { name: 'reports.manage', resource: 'reports', action: 'manage', description: 'Gestionare completă rapoarte' },
  
  // Profile resource
  { name: 'profile.read', resource: 'profile', action: 'read', description: 'Vizualizare profil' },
  { name: 'profile.write', resource: 'profile', action: 'write', description: 'Editare profil' },
  
  // Superadmin resource
  { name: 'superadmin.access', resource: 'superadmin', action: 'access', description: 'Acces la secțiunea Superadmin' },
  { name: 'superadmin.manage', resource: 'superadmin', action: 'manage', description: 'Gestionare completă configurații Superadmin' },
  
  // Events resource
  { name: 'events.view', resource: 'events', action: 'view', description: 'Vizualizare evenimente' },
  { name: 'events.create', resource: 'events', action: 'create', description: 'Creare evenimente' },
  { name: 'events.edit', resource: 'events', action: 'edit', description: 'Editare evenimente' },
  { name: 'events.delete', resource: 'events', action: 'delete', description: 'Ștergere evenimente' },
  { name: 'events.confirm', resource: 'events', action: 'confirm', description: 'Confirmare evenimente' },
  
  // Notifications resource
  { name: 'notifications.create', resource: 'notifications', action: 'create', description: 'Creare notificări' },
  
  // Documents resource (Registratură)
  { name: 'documents.read', resource: 'documents', action: 'read', description: 'Citire documente' },
  { name: 'documents.create', resource: 'documents', action: 'create', description: 'Creare documente' },
  { name: 'documents.update', resource: 'documents', action: 'update', description: 'Actualizare documente' },
  { name: 'documents.delete', resource: 'documents', action: 'delete', description: 'Ștergere documente' },
  { name: 'documents.route', resource: 'documents', action: 'route', description: 'Rutare documente' },
  { name: 'documents.resolve', resource: 'documents', action: 'resolve', description: 'Rezolvare documente' },
  { name: 'documents.archive', resource: 'documents', action: 'archive', description: 'Arhivare documente' },
  { name: 'documents.view_secret', resource: 'documents', action: 'view_secret', description: 'Vizualizare documente secrete' },
  
  // General Register resource
  { name: 'general_register.resolve_any', resource: 'general_register', action: 'resolve_any', description: 'Solutionare orice document din registrul general' },
];

// Role-permission mappings
const rolePermissionMappings: Record<string, string[]> = {
  superadmin: standardPermissions.map((p) => p.name), // All permissions
  admin: [
    'users.read',
    'users.write',
    'users.delete',
    'users.manage',
    'roles.read',
    'roles.write',
    'roles.delete',
    'roles.manage',
    'permissions.read',
    'permissions.write',
    'permissions.delete',
    'permissions.manage',
    'settings.read',
    'settings.write',
    'settings.manage',
    'events.view',
    'events.create',
    'events.edit',
    'events.delete',
    'events.confirm',
    'notifications.create',
    'documents.read',
    'documents.create',
    'documents.update',
    'documents.delete',
    'documents.route',
    'documents.resolve',
    'documents.archive',
    'documents.view_secret',
  ],
  moderator: [
    'users.read',
    'users.write',
    'posts.read',
    'posts.write',
    'posts.delete',
    'posts.manage',
    'reports.read',
    'events.view',
    'events.create',
    'events.edit',
    'events.confirm',
    'notifications.create',
    'documents.read',
    'documents.create',
    'documents.update',
    'documents.route',
    'documents.resolve',
  ],
  user: [
    'posts.read',
    'posts.write',
    'profile.read',
    'profile.write',
    'events.view',
  ],
};

async function seedRoles() {
  console.log('Step 2: Seeding roles...');
  
  for (const roleData of standardRoles) {
    const [existing] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, roleData.name))
      .limit(1);

    if (existing) {
      console.log(`✓ Role ${roleData.name} already exists, skipping`);
      continue;
    }

    await db.insert(roles).values(roleData);
    console.log(`✓ Created role: ${roleData.name}`);
  }
  
  console.log('✓ Roles seeding completed');
}

async function seedPermissions() {
  console.log('Step 3: Seeding permissions...');
  
  for (const permData of standardPermissions) {
    const [existing] = await db
      .select()
      .from(permissions)
      .where(eq(permissions.name, permData.name))
      .limit(1);

    if (existing) {
      console.log(`✓ Permission ${permData.name} already exists, skipping`);
      continue;
    }

    await db.insert(permissions).values(permData);
    console.log(`✓ Created permission: ${permData.name}`);
  }
  
  console.log('✓ Permissions seeding completed');
}

async function seedRolePermissions() {
  console.log('Step 4: Seeding role-permission mappings...');
  
  // Get all roles and permissions from database
  const allRoles = await db.select().from(roles);
  const allPermissions = await db.select().from(permissions);
  
  const roleMap = new Map(allRoles.map((r) => [r.name, r.id]));
  const permissionMap = new Map(allPermissions.map((p) => [p.name, p.id]));

  for (const [roleName, permissionNames] of Object.entries(rolePermissionMappings)) {
    const roleId = roleMap.get(roleName);
    if (!roleId) {
      console.log(`❌ Role ${roleName} not found, skipping`);
      continue;
    }

    for (const permissionName of permissionNames) {
      const permissionId = permissionMap.get(permissionName);
      if (!permissionId) {
        console.log(`❌ Permission ${permissionName} not found, skipping`);
        continue;
      }

      // Check if mapping already exists
      const [existing] = await db
        .select()
        .from(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, roleId),
            eq(rolePermissions.permissionId, permissionId)
          )
        )
        .limit(1);

      if (existing) {
        console.log(`✓ Role-permission mapping ${roleName} -> ${permissionName} already exists, skipping`);
        continue;
      }

      await db.insert(rolePermissions).values({
        roleId,
        permissionId,
      });
      console.log(`✓ Created role-permission mapping: ${roleName} -> ${permissionName}`);
    }
  }
  
  console.log('✓ Role-permission mappings seeding completed');
}

async function seedEmailTemplates() {
  console.log('Step 5: Seeding email templates...');

  const templates = [
    {
      name: 'Confirmare Cont',
      subject: 'Bun venit în platformă - Confirmă contul tău',
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmă contul tău</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Bun venit în platformă!</h1>
    
    <p>Salut <strong>{{user.name}}</strong>,</p>
    
    <p>Contul tău a fost creat în platformă {{app.name}}. Pentru a activa contul și a-ți seta parola, te rugăm să accesezi link-ul de mai jos:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link.confirmation}}" 
         style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Confirmă contul și setează parola
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      Sau copiază acest link în browser:<br>
      <a href="{{link.confirmation}}" style="color: #007bff; word-break: break-all;">{{link.confirmation}}</a>
    </p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Important:</strong> Link-ul este valabil pentru 7 zile.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      Dacă nu ai solicitat crearea acestui cont, te rugăm să ignori acest email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; margin: 0;">
      Cu respect,<br>
      Echipa {{app.name}}
    </p>
  </div>
</body>
</html>`,
      textContent: `Bun venit în platformă!

Salut {{user.name}},

Contul tău a fost creat în platformă {{app.name}}. Pentru a activa contul și a-ți seta parola, te rugăm să accesezi link-ul de mai jos:

{{link.confirmation}}

Important: Link-ul este valabil pentru 7 zile.

Dacă nu ai solicitat crearea acestui cont, te rugăm să ignori acest email.

Cu respect,
Echipa {{app.name}}`,
      variables: ['user.name', 'user.email', 'link.confirmation', 'app.name'],
      category: 'predefined' as const,
      isActive: true,
    },
    {
      name: 'Recuperare Parolă',
      subject: 'Recuperare parolă - {{app.name}}',
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperare parolă</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Recuperare parolă</h1>
    
    <p>Salut <strong>{{user.name}}</strong>,</p>
    
    <p>Am primit o solicitare de resetare a parolei pentru contul tău asociat cu adresa <strong>{{user.email}}</strong>.</p>
    
    <p>Dacă ai solicitat tu resetarea parolei, te rugăm să accesezi link-ul de mai jos pentru a-ți crea o parolă nouă:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link.reset}}" 
         style="display: inline-block; background-color: #dc3545; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Resetează parola
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      Sau copiază acest link în browser:<br>
      <a href="{{link.reset}}" style="color: #dc3545; word-break: break-all;">{{link.reset}}</a>
    </p>
    
    <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Important:</strong> Link-ul este valabil pentru {{expiry.hours}} ore. După expirarea acestui termen, va trebui să soliciți din nou resetarea parolei.
      </p>
    </div>
    
    <div style="background-color: #f8d7da; border-left: 4px solid #721c24; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Securitate:</strong> Dacă nu ai solicitat resetarea parolei, te rugăm să ignori acest email. Parola ta rămâne neschimbată.
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; margin: 0;">
      Cu respect,<br>
      Echipa {{app.name}}
    </p>
  </div>
</body>
</html>`,
      textContent: `Recuperare parolă

Salut {{user.name}},

Am primit o solicitare de resetare a parolei pentru contul tău asociat cu adresa {{user.email}}.

Dacă ai solicitat tu resetarea parolei, te rugăm să accesezi link-ul de mai jos pentru a-ți crea o parolă nouă:

{{link.reset}}

Important: Link-ul este valabil pentru {{expiry.hours}} ore. După expirarea acestui termen, va trebui să soliciți din nou resetarea parolei.

Securitate: Dacă nu ai solicitat resetarea parolei, te rugăm să ignori acest email. Parola ta rămâne neschimbată.

Cu respect,
Echipa {{app.name}}`,
      variables: ['user.name', 'user.email', 'link.reset', 'expiry.hours', 'app.name'],
      category: 'predefined' as const,
      isActive: true,
    },
    {
      name: 'Notificare Creare Cont',
      subject: 'Notificare - Cont nou creat pentru {{user.name}}',
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificare creare cont</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Notificare creare cont</h1>
    
    <p>Salut <strong>{{admin.name}}</strong>,</p>
    
    <p>Un cont nou a fost creat în platformă {{app.name}}.</p>
    
    <div style="background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 4px; padding: 20px; margin: 20px 0;">
      <h2 style="color: #2c3e50; margin-top: 0; font-size: 18px;">Detalii cont:</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Nume:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{user.name}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Email:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{user.email}}</td>
        </tr>
      </table>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      Utilizatorul va primi un email de confirmare pentru a-și activa contul și a seta parola.
    </p>
    
    <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Informație:</strong> Acest email este trimis automat când un administrator creează un cont nou în sistem.
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; margin: 0;">
      Cu respect,<br>
      Sistemul {{app.name}}
    </p>
  </div>
</body>
</html>`,
      textContent: `Notificare creare cont

Salut {{admin.name}},

Un cont nou a fost creat în platformă {{app.name}}.

Detalii cont:
Nume: {{user.name}}
Email: {{user.email}}

Utilizatorul va primi un email de confirmare pentru a-și activa contul și a seta parola.

Informație: Acest email este trimis automat când un administrator creează un cont nou în sistem.

Cu respect,
Sistemul {{app.name}}`,
      variables: ['admin.name', 'user.name', 'user.email', 'app.name'],
      category: 'predefined' as const,
      isActive: true,
    },
    {
      name: 'Confirmare Eveniment',
      subject: 'Confirmare eveniment - {{event.typeLabel}}',
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmare eveniment</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Confirmare eveniment</h1>
    
    <p>Salut <strong>{{recipient.name}}</strong>,</p>
    
    <p>Evenimentul tău a fost confirmat cu succes!</p>
    
    <div style="background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 4px; padding: 20px; margin: 20px 0;">
      <h2 style="color: #2c3e50; margin-top: 0; font-size: 18px;">Detalii eveniment:</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Tip:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{event.typeLabel}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Data:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{event.date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Locație:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{event.location}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Preot:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{event.priestName}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Parohie:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{event.parishName}}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #e7f3ff; border-left: 4px solid #007bff; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Observații:</strong><br>
        {{event.notes}}
      </p>
    </div>
    
    <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Informație:</strong> Evenimentul tău este confirmat și programat. Te așteptăm cu nerăbdare!
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; margin: 0;">
      Cu respect,<br>
      {{event.parishName}}
    </p>
  </div>
</body>
</html>`,
      textContent: `Confirmare eveniment

Salut {{recipient.name}},

Evenimentul tău a fost confirmat cu succes!

Detalii eveniment:
Tip: {{event.typeLabel}}
Data: {{event.date}}
Locație: {{event.location}}
Preot: {{event.priestName}}
Parohie: {{event.parishName}}

Observații:
{{event.notes}}

Informație: Evenimentul tău este confirmat și programat. Te așteptăm cu nerăbdare!

Cu respect,
{{event.parishName}}`,
      variables: ['recipient.name', 'recipient.email', 'event.typeLabel', 'event.date', 'event.location', 'event.priestName', 'event.parishName', 'event.notes'],
      category: 'predefined' as const,
      isActive: true,
    },
    {
      name: 'Reminder Eveniment',
      subject: 'Reminder - {{event.typeLabel}} pe {{event.date}}',
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reminder eveniment</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Reminder eveniment</h1>
    
    <p>Salut <strong>{{recipient.name}}</strong>,</p>
    
    <p>Acest este un reminder că evenimentul tău este programat pentru <strong>{{event.date}}</strong>.</p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Evenimentul va avea loc peste {{event.daysUntil}} zile.</strong>
      </p>
    </div>
    
    <div style="background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 4px; padding: 20px; margin: 20px 0;">
      <h2 style="color: #2c3e50; margin-top: 0; font-size: 18px;">Detalii eveniment:</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Tip:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{event.typeLabel}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Data:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{event.date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Locație:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{event.location}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Preot:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{event.priestName}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Parohie:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{event.parishName}}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #e7f3ff; border-left: 4px solid #007bff; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Observații:</strong><br>
        {{event.notes}}
      </p>
    </div>
    
    <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Te rugăm să fii prezent la timp!</strong> Dacă ai întrebări sau modificări, te rugăm să ne contactezi cât mai curând.
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; margin: 0;">
      Cu respect,<br>
      {{event.parishName}}
    </p>
  </div>
</body>
</html>`,
      textContent: `Reminder eveniment

Salut {{recipient.name}},

Acest este un reminder că evenimentul tău este programat pentru {{event.date}}.

Evenimentul va avea loc peste {{event.daysUntil}} zile.

Detalii eveniment:
Tip: {{event.typeLabel}}
Data: {{event.date}}
Locație: {{event.location}}
Preot: {{event.priestName}}
Parohie: {{event.parishName}}

Observații:
{{event.notes}}

Te rugăm să fii prezent la timp! Dacă ai întrebări sau modificări, te rugăm să ne contactezi cât mai curând.

Cu respect,
{{event.parishName}}`,
      variables: ['recipient.name', 'recipient.email', 'event.typeLabel', 'event.date', 'event.location', 'event.priestName', 'event.parishName', 'event.notes', 'event.daysUntil'],
      category: 'predefined' as const,
      isActive: true,
    },
    {
      name: 'Anulare Eveniment',
      subject: 'Anulare eveniment - {{event.typeLabel}}',
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anulare eveniment</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Anulare eveniment</h1>
    
    <p>Salut <strong>{{recipient.name}}</strong>,</p>
    
    <p>Ne pare rău să te informăm că evenimentul programat a fost anulat.</p>
    
    <div style="background-color: #f8d7da; border-left: 4px solid #721c24; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Eveniment anulat:</strong> {{event.typeLabel}} programat pentru {{event.date}}
      </p>
    </div>
    
    <div style="background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 4px; padding: 20px; margin: 20px 0;">
      <h2 style="color: #2c3e50; margin-top: 0; font-size: 18px;">Detalii eveniment anulat:</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Tip:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{event.typeLabel}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Data:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{event.date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Locație:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{event.location}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Parohie:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{event.parishName}}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Motiv anulare:</strong><br>
        {{cancellationReason}}
      </p>
    </div>
    
    <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Informație:</strong> Dacă dorești să programezi un nou eveniment sau ai întrebări, te rugăm să ne contactezi.
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; margin: 0;">
      Cu respect,<br>
      {{event.parishName}}
    </p>
  </div>
</body>
</html>`,
      textContent: `Anulare eveniment

Salut {{recipient.name}},

Ne pare rău să te informăm că evenimentul programat a fost anulat.

Eveniment anulat: {{event.typeLabel}} programat pentru {{event.date}}

Detalii eveniment anulat:
Tip: {{event.typeLabel}}
Data: {{event.date}}
Locație: {{event.location}}
Parohie: {{event.parishName}}

Motiv anulare:
{{cancellationReason}}

Informație: Dacă dorești să programezi un nou eveniment sau ai întrebări, te rugăm să ne contactezi.

Cu respect,
{{event.parishName}}`,
      variables: ['recipient.name', 'recipient.email', 'event.typeLabel', 'event.date', 'event.location', 'event.parishName', 'cancellationReason'],
      category: 'predefined' as const,
      isActive: true,
    },
    {
      name: 'Chitanta Plata',
      subject: 'Chitanță plată - {{payment.number}}',
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chitanță plată</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Chitanță plată</h1>
    
    <p>Salut <strong>{{client.name}}</strong>,</p>
    
    <p>Confirmăm primirea plății în valoare de <strong>{{payment.amount}}</strong>.</p>
    
    <div style="background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 4px; padding: 20px; margin: 20px 0;">
      <h2 style="color: #2c3e50; margin-top: 0; font-size: 18px;">Detalii plată:</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Număr chitanță:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{payment.number}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Data:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{payment.date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Suma:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333; font-size: 18px; font-weight: bold; color: #28a745;">{{payment.amount}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Motiv:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{payment.reason}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Parohie:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{parish.name}}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Plata a fost înregistrată cu succes!</strong> Această chitanță confirmă primirea sumei menționate mai sus.
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; margin: 0;">
      Cu respect,<br>
      {{parish.name}}
    </p>
  </div>
</body>
</html>`,
      textContent: `Chitanță plată

Salut {{client.name}},

Confirmăm primirea plății în valoare de {{payment.amount}}.

Detalii plată:
Număr chitanță: {{payment.number}}
Data: {{payment.date}}
Suma: {{payment.amount}}
Motiv: {{payment.reason}}
Parohie: {{parish.name}}

Plata a fost înregistrată cu succes! Această chitanță confirmă primirea sumei menționate mai sus.

Cu respect,
{{parish.name}}`,
      variables: ['client.name', 'client.email', 'payment.number', 'payment.date', 'payment.amount', 'payment.currency', 'payment.reason', 'parish.name'],
      category: 'predefined' as const,
      isActive: true,
    },
  ];

  for (const templateData of templates) {
    const [existing] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, templateData.name))
      .limit(1);

    if (existing) {
      console.log(`✓ Template "${templateData.name}" already exists, skipping`);
      continue;
    }

    await db.insert(emailTemplates).values(templateData);
    console.log(`✓ Created email template: ${templateData.name}`);
  }

  console.log('✓ Email templates seeding completed');
}

async function seed() {
  try {
    console.log('Step 1: Starting database seed...');
    
    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();
    await seedEmailTemplates();
    
    console.log('✓ Database seed completed successfully!');
    console.log('Note: Register configurations should be seeded using migration 0028_seed_register_configurations.sql');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seed failed:', error);
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed();
}

export { seed };

