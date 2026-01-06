-- Seed data for Email Templates - Validation Code for Online Forms
-- Run this after migration 0002_cool_wrecking_crew.sql (which creates email_templates table)
-- This script creates the email template for form validation codes

DO $$
DECLARE
    v_template_id uuid;
BEGIN
    -- Check if template already exists
    SELECT id INTO v_template_id 
    FROM email_templates 
    WHERE name = 'Cod Validare Formular';
    
    IF v_template_id IS NOT NULL THEN
        RAISE NOTICE 'Template "Cod Validare Formular" already exists, skipping...';
        RETURN;
    END IF;
    
    -- Insert the validation code email template
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
END $$;








