-- Seed data for Email Templates - All predefined templates
-- Run this after migration 0002_cool_wrecking_crew.sql (which creates email_templates table)
-- This script creates all predefined email templates used in the platform

DO $$
DECLARE
    v_template_id uuid;
BEGIN
    -- Template 1: Confirmare Cont
    SELECT id INTO v_template_id 
    FROM email_templates 
    WHERE name = 'Confirmare Cont';
    
    IF v_template_id IS NULL THEN
        INSERT INTO email_templates (
            id,
            name,
            subject,
            html_content,
            text_content,
            variables,
            category,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Confirmare Cont',
            'Bun venit în platformă - Confirmă contul tău',
            '<!DOCTYPE html>
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
</html>',
            'Bun venit în platformă!

Salut {{user.name}},

Contul tău a fost creat în platformă {{app.name}}. Pentru a activa contul și a-ți seta parola, te rugăm să accesezi link-ul de mai jos:

{{link.confirmation}}

Important: Link-ul este valabil pentru 7 zile.

Dacă nu ai solicitat crearea acestui cont, te rugăm să ignori acest email.

Cu respect,
Echipa {{app.name}}',
            '["user.name", "user.email", "link.confirmation", "app.name"]'::jsonb,
            'predefined',
            true,
            now(),
            now()
        );
        RAISE NOTICE 'Template "Confirmare Cont" created successfully';
    ELSE
        RAISE NOTICE 'Template "Confirmare Cont" already exists, skipping...';
    END IF;

    -- Template 2: Recuperare Parolă
    SELECT id INTO v_template_id 
    FROM email_templates 
    WHERE name = 'Recuperare Parolă';
    
    IF v_template_id IS NULL THEN
        INSERT INTO email_templates (
            id,
            name,
            subject,
            html_content,
            text_content,
            variables,
            category,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Recuperare Parolă',
            'Recuperare parolă - {{app.name}}',
            '<!DOCTYPE html>
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
</html>',
            'Recuperare parolă

Salut {{user.name}},

Am primit o solicitare de resetare a parolei pentru contul tău asociat cu adresa {{user.email}}.

Dacă ai solicitat tu resetarea parolei, te rugăm să accesezi link-ul de mai jos pentru a-ți crea o parolă nouă:

{{link.reset}}

Important: Link-ul este valabil pentru {{expiry.hours}} ore. După expirarea acestui termen, va trebui să soliciți din nou resetarea parolei.

Securitate: Dacă nu ai solicitat resetarea parolei, te rugăm să ignori acest email. Parola ta rămâne neschimbată.

Cu respect,
Echipa {{app.name}}',
            '["user.name", "user.email", "link.reset", "expiry.hours", "app.name"]'::jsonb,
            'predefined',
            true,
            now(),
            now()
        );
        RAISE NOTICE 'Template "Recuperare Parolă" created successfully';
    ELSE
        RAISE NOTICE 'Template "Recuperare Parolă" already exists, skipping...';
    END IF;

    -- Template 3: Notificare Creare Cont
    SELECT id INTO v_template_id 
    FROM email_templates 
    WHERE name = 'Notificare Creare Cont';
    
    IF v_template_id IS NULL THEN
        INSERT INTO email_templates (
            id,
            name,
            subject,
            html_content,
            text_content,
            variables,
            category,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Notificare Creare Cont',
            'Notificare - Cont nou creat pentru {{user.name}}',
            '<!DOCTYPE html>
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
</html>',
            'Notificare creare cont

Salut {{admin.name}},

Un cont nou a fost creat în platformă {{app.name}}.

Detalii cont:
Nume: {{user.name}}
Email: {{user.email}}

Utilizatorul va primi un email de confirmare pentru a-și activa contul și a seta parola.

Informație: Acest email este trimis automat când un administrator creează un cont nou în sistem.

Cu respect,
Sistemul {{app.name}}',
            '["admin.name", "user.name", "user.email", "app.name"]'::jsonb,
            'predefined',
            true,
            now(),
            now()
        );
        RAISE NOTICE 'Template "Notificare Creare Cont" created successfully';
    ELSE
        RAISE NOTICE 'Template "Notificare Creare Cont" already exists, skipping...';
    END IF;

    -- Template 4: Confirmare Eveniment
    SELECT id INTO v_template_id 
    FROM email_templates 
    WHERE name = 'Confirmare Eveniment';
    
    IF v_template_id IS NULL THEN
        INSERT INTO email_templates (
            id,
            name,
            subject,
            html_content,
            text_content,
            variables,
            category,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Confirmare Eveniment',
            'Confirmare eveniment - {{event.typeLabel}}',
            '<!DOCTYPE html>
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
</html>',
            'Confirmare eveniment

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
{{event.parishName}}',
            '["recipient.name", "recipient.email", "event.typeLabel", "event.date", "event.location", "event.priestName", "event.parishName", "event.notes"]'::jsonb,
            'predefined',
            true,
            now(),
            now()
        );
        RAISE NOTICE 'Template "Confirmare Eveniment" created successfully';
    ELSE
        RAISE NOTICE 'Template "Confirmare Eveniment" already exists, skipping...';
    END IF;

    -- Template 5: Reminder Eveniment
    SELECT id INTO v_template_id 
    FROM email_templates 
    WHERE name = 'Reminder Eveniment';
    
    IF v_template_id IS NULL THEN
        INSERT INTO email_templates (
            id,
            name,
            subject,
            html_content,
            text_content,
            variables,
            category,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Reminder Eveniment',
            'Reminder - {{event.typeLabel}} pe {{event.date}}',
            '<!DOCTYPE html>
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
</html>',
            'Reminder eveniment

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
{{event.parishName}}',
            '["recipient.name", "recipient.email", "event.typeLabel", "event.date", "event.location", "event.priestName", "event.parishName", "event.notes", "event.daysUntil"]'::jsonb,
            'predefined',
            true,
            now(),
            now()
        );
        RAISE NOTICE 'Template "Reminder Eveniment" created successfully';
    ELSE
        RAISE NOTICE 'Template "Reminder Eveniment" already exists, skipping...';
    END IF;

    -- Template 6: Anulare Eveniment
    SELECT id INTO v_template_id 
    FROM email_templates 
    WHERE name = 'Anulare Eveniment';
    
    IF v_template_id IS NULL THEN
        INSERT INTO email_templates (
            id,
            name,
            subject,
            html_content,
            text_content,
            variables,
            category,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Anulare Eveniment',
            'Anulare eveniment - {{event.typeLabel}}',
            '<!DOCTYPE html>
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
</html>',
            'Anulare eveniment

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
{{event.parishName}}',
            '["recipient.name", "recipient.email", "event.typeLabel", "event.date", "event.location", "event.parishName", "cancellationReason"]'::jsonb,
            'predefined',
            true,
            now(),
            now()
        );
        RAISE NOTICE 'Template "Anulare Eveniment" created successfully';
    ELSE
        RAISE NOTICE 'Template "Anulare Eveniment" already exists, skipping...';
    END IF;

    RAISE NOTICE 'All email templates seeding completed';
END $$;








