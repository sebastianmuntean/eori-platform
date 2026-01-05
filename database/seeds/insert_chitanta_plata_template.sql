-- Insert email template "Chitanta Plata" if it doesn't exist
-- This template is used for sending payment receipts via email

DO $$
DECLARE
    v_template_id uuid;
BEGIN
    -- Check if template already exists
    SELECT id INTO v_template_id 
    FROM email_templates 
    WHERE name = 'Chitanta Plata';
    
    IF v_template_id IS NULL THEN
        -- Insert the template
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
            'Chitanta Plata',
            'Confirmare Incasare {{payment.number}} - {{parish.name}}',
            '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chitanta Plata</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Confirmare Incasare</h1>
    
    <p>Salut <strong>{{client.name}}</strong>,</p>
    
    <p>Confirmăm înregistrarea plății tale în valoare de <strong>{{payment.amount}} {{payment.currency}}</strong>.</p>
    
    <div style="background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 4px; padding: 20px; margin: 20px 0;">
      <h2 style="color: #2c3e50; margin-top: 0; font-size: 18px;">Detalii Plată:</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Număr Plată:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{payment.number}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Data:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{payment.date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Sumă:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{payment.amount}} {{payment.currency}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Motiv:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">{{payment.reason}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Parohia:</td>
          <td style="padding: 8px 0; color: #333;">{{parish.name}}</td>
        </tr>
      </table>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      Cu respect,<br>
      Echipa {{parish.name}}
    </p>
  </div>
</body>
</html>',
            'Confirmare Incasare {{payment.number}} - {{parish.name}}

Salut {{client.name}},

Confirmăm înregistrarea plății tale în valoare de {{payment.amount}} {{payment.currency}}.

Detalii Plată:
Număr Plată: {{payment.number}}
Data: {{payment.date}}
Sumă: {{payment.amount}} {{payment.currency}}
Motiv: {{payment.reason}}
Parohia: {{parish.name}}

Cu respect,
Echipa {{parish.name}}',
            '["client.name", "client.email", "payment.number", "payment.date", "payment.amount", "payment.currency", "payment.reason", "parish.name"]'::jsonb,
            'predefined',
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Template "Chitanta Plata" created successfully';
    ELSE
        RAISE NOTICE 'Template "Chitanta Plata" already exists, skipping';
    END IF;
END $$;

