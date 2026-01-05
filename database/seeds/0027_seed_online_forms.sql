-- Seed data for Online Forms System
-- Run this after migration 0027_add_online_forms_system.sql
-- This script creates 3 example forms with fields and mappings

-- Important: Make sure you have at least one parish and one user in your database
-- If you get errors, check:
-- SELECT COUNT(*) FROM parishes;
-- SELECT COUNT(*) FROM users;

DO $$
DECLARE
    v_parish_id uuid;
    v_user_id uuid;
    v_form1_id uuid;
    v_form2_id uuid;
    v_form3_id uuid;
BEGIN
    -- Get first parish and user
    SELECT id INTO v_parish_id FROM parishes LIMIT 1;
    SELECT id INTO v_user_id FROM users LIMIT 1;
    
    IF v_parish_id IS NULL THEN
        RAISE EXCEPTION 'No parishes found. Please create at least one parish first.';
    END IF;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found. Please create at least one user first.';
    END IF;
    
    -- Form 1: Formular de Contact pentru Registratura
    INSERT INTO online_forms (
        parish_id,
        name,
        description,
        is_active,
        email_validation_mode,
        submission_flow,
        target_module,
        widget_code,
        success_message,
        error_message,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        v_parish_id,
        'Formular de Contact',
        'Formular pentru trimiterea mesajelor către registratura parohiei',
        true,
        'end',
        'review',
        'registratura',
        'contact-' || lower(substring(md5(random()::text) from 1 for 8)),
        'Mulțumim! Mesajul dvs. a fost trimis cu succes și va fi procesat în cel mai scurt timp.',
        'Ne pare rău, a apărut o eroare la trimiterea mesajului. Vă rugăm să încercați din nou.',
        v_user_id,
        NOW(),
        NOW()
    ) RETURNING id INTO v_form1_id;
    
    -- Form 2: Formular de Înregistrare Eveniment
    INSERT INTO online_forms (
        parish_id,
        name,
        description,
        is_active,
        email_validation_mode,
        submission_flow,
        target_module,
        widget_code,
        success_message,
        error_message,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        v_parish_id,
        'Înregistrare Eveniment',
        'Formular pentru înregistrarea evenimentelor bisericești',
        true,
        'start',
        'direct',
        'events',
        'event-' || lower(substring(md5(random()::text) from 1 for 8)),
        'Evenimentul a fost înregistrat cu succes! Veți primi un email de confirmare.',
        'Eroare la înregistrarea evenimentului. Vă rugăm să contactați parohia.',
        v_user_id,
        NOW(),
        NOW()
    ) RETURNING id INTO v_form2_id;
    
    -- Form 3: Formular Partener Nou
    INSERT INTO online_forms (
        parish_id,
        name,
        description,
        is_active,
        email_validation_mode,
        submission_flow,
        target_module,
        widget_code,
        success_message,
        error_message,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        v_parish_id,
        'Formular Partener Nou',
        'Formular pentru înregistrarea unui partener nou',
        true,
        'end',
        'review',
        'partners',
        'partner-' || lower(substring(md5(random()::text) from 1 for 8)),
        'Cererea dvs. a fost trimisă. Veți fi contactat în curând.',
        'Eroare la trimiterea cererii. Vă rugăm să încercați din nou.',
        v_user_id,
        NOW(),
        NOW()
    ) RETURNING id INTO v_form3_id;
    
    -- Fields for Form 1: Formular de Contact
    INSERT INTO online_form_fields (form_id, field_key, field_type, label, placeholder, help_text, is_required, order_index)
    VALUES
        (v_form1_id, 'nume', 'text', 'Nume complet', 'Introduceți numele complet', 'Numele dvs. complet', true, 1),
        (v_form1_id, 'email', 'email', 'Email', 'exemplu@email.com', 'Adresa dvs. de email', true, 2),
        (v_form1_id, 'telefon', 'text', 'Telefon', '07xx xxx xxx', 'Numărul dvs. de telefon (opțional)', false, 3),
        (v_form1_id, 'subiect', 'text', 'Subiect', 'Despre ce doriți să comunicați?', 'Subiectul mesajului', true, 4),
        (v_form1_id, 'mesaj', 'textarea', 'Mesaj', 'Scrieți mesajul aici...', 'Detalii despre cererea dvs.', true, 5);
    
    -- Fields for Form 2: Înregistrare Eveniment
    INSERT INTO online_form_fields (form_id, field_key, field_type, label, placeholder, help_text, is_required, options, order_index)
    VALUES
        (v_form2_id, 'nume_eveniment', 'text', 'Nume Eveniment', 'Botez, Nuntă, etc.', 'Numele evenimentului', true, NULL, 1),
        (v_form2_id, 'data_eveniment', 'date', 'Data Eveniment', NULL, 'Data la care va avea loc evenimentul', true, NULL, 2),
        (v_form2_id, 'locatie', 'text', 'Locație', 'Biserica Parohială', 'Locația evenimentului', true, NULL, 3),
        (v_form2_id, 'tip_eveniment', 'select', 'Tip Eveniment', NULL, 'Selectați tipul evenimentului', true, '[{"value":"botez","label":"Botez"},{"value":"cumunie","label":"Cumunie"},{"value":"nunta","label":"Nuntă"},{"value":"pomana","label":"Pomenă"},{"value":"alta","label":"Alta"}]'::jsonb, 4),
        (v_form2_id, 'numar_persoane', 'number', 'Număr Persoane', '50', 'Numărul estimat de participanți', false, NULL, 5),
        (v_form2_id, 'observatii', 'textarea', 'Observații', 'Detalii suplimentare...', 'Orice informații suplimentare despre eveniment', false, NULL, 6);
    
    -- Fields for Form 3: Formular Partener
    INSERT INTO online_form_fields (form_id, field_key, field_type, label, placeholder, help_text, is_required, order_index)
    VALUES
        (v_form3_id, 'prenume', 'text', 'Prenume', 'Ion', 'Prenumele', true, 1),
        (v_form3_id, 'nume', 'text', 'Nume', 'Popescu', 'Numele de familie', true, 2),
        (v_form3_id, 'companie', 'text', 'Nume Companie', 'S.C. Exemplu S.R.L.', 'Numele companiei (dacă este cazul)', false, 3),
        (v_form3_id, 'cui', 'text', 'CUI', 'RO12345678', 'Codul Unic de Înregistrare (dacă este persoană juridică)', false, 4),
        (v_form3_id, 'cnp', 'text', 'CNP', '1234567890123', 'Codul Numeric Personal (dacă este persoană fizică)', false, 5),
        (v_form3_id, 'adresa', 'textarea', 'Adresă', 'Strada, Număr, Oraș', 'Adresa completă', true, 6),
        (v_form3_id, 'telefon', 'text', 'Telefon', '07xx xxx xxx', 'Număr de telefon', true, 7),
        (v_form3_id, 'email', 'email', 'Email', 'exemplu@email.com', 'Adresa de email', true, 8);
    
    -- Mappings for Form 1: Formular de Contact -> registratura (document_registry)
    INSERT INTO online_form_field_mappings (form_id, field_key, target_table, target_column)
    VALUES
        (v_form1_id, 'subiect', 'document_registry', 'subject'),
        (v_form1_id, 'mesaj', 'document_registry', 'content'),
        (v_form1_id, 'nume', 'document_registry', 'sender_name');
    
    -- Mappings for Form 2: Înregistrare Eveniment -> events (church_events)
    INSERT INTO online_form_field_mappings (form_id, field_key, target_table, target_column)
    VALUES
        (v_form2_id, 'data_eveniment', 'church_events', 'event_date'),
        (v_form2_id, 'locatie', 'church_events', 'location'),
        (v_form2_id, 'observatii', 'church_events', 'notes');
    
    -- Mappings for Form 3: Formular Partener -> partners
    INSERT INTO online_form_field_mappings (form_id, field_key, target_table, target_column)
    VALUES
        (v_form3_id, 'prenume', 'partners', 'first_name'),
        (v_form3_id, 'nume', 'partners', 'last_name'),
        (v_form3_id, 'companie', 'partners', 'company_name'),
        (v_form3_id, 'cui', 'partners', 'cui'),
        (v_form3_id, 'cnp', 'partners', 'cnp'),
        (v_form3_id, 'adresa', 'partners', 'address'),
        (v_form3_id, 'telefon', 'partners', 'phone'),
        (v_form3_id, 'email', 'partners', 'email');
    
    RAISE NOTICE 'Successfully created 3 online forms with fields and mappings!';
END $$;
