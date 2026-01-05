-- Ensure Required Email Templates Exist
-- This script ensures that the two critical email templates exist in the database
-- Templates: "Confirmare Cont" and "Cod Validare Formular"
-- Run this manually before deploying code changes that remove hardcoded HTML fallbacks
--
-- Date: 2024-12-19
-- Purpose: Ensure templates exist before removing hardcoded HTML fallbacks from code

DO $$
DECLARE
    v_template_id uuid;
BEGIN
    -- Template 1: Confirmare Cont (User Account Confirmation)
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

    -- Template 2: Cod Validare Formular (Form Validation Code)
    SELECT id INTO v_template_id 
    FROM email_templates 
    WHERE name = 'Cod Validare Formular';
    
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
            'Cod Validare Formular',
            'Cod de validare - {{form.name}}',
            '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cod de validare</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Cod de validare</h1>
    
    <p>Salut,</p>
    
    <p>Pentru a valida completarea formularului "<strong>{{form.name}}</strong>", te rugăm să introduci următorul cod:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="font-size: 32px; font-weight: bold; text-align: center; background: #f4f4f4; padding: 20px; margin: 20px 0; border-radius: 5px; letter-spacing: 5px; font-family: monospace;">
        {{code}}
      </div>
    </div>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Important:</strong> Acest cod este valabil timp de 15 minute.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      Dacă nu ai completat acest formular, te rugăm să ignori acest email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; margin: 0;">
      Cu respect,<br>
      Echipa Platformă
    </p>
  </div>
</body>
</html>',
            'Cod de validare

Salut,

Pentru a valida completarea formularului "{{form.name}}", te rugăm să introduci următorul cod:

{{code}}

Important: Acest cod este valabil timp de 15 minute.

Dacă nu ai completat acest formular, te rugăm să ignori acest email.

Cu respect,
Echipa Platformă',
            '["form.name", "code"]'::jsonb,
            'predefined',
            true,
            now(),
            now()
        );
        RAISE NOTICE 'Template "Cod Validare Formular" created successfully';
    ELSE
        RAISE NOTICE 'Template "Cod Validare Formular" already exists, skipping...';
    END IF;

    RAISE NOTICE 'All required email templates verified successfully';
END $$;

