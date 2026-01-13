-- Script SQL simplu pentru copierea utilizatorilor în Neon
-- 
-- ATENȚIE: Acest script șterge utilizatorii existenți din Neon!
-- 
-- Pași:
--   1. Rulează pe baza LOCALĂ: psql $LOCAL_DB_URL -f database/scripts/generate_users_insert.sql -o users_insert.sql
--   2. Rulează users_insert.sql pe baza Neon: psql $NEON_DB_URL -f users_insert.sql
--
-- SAU folosește scriptul de mai jos direct pe Neon (dacă ai acces la ambele baze)

-- Opțiune simplă: Șterge și inserează manual sau folosește scriptul de generare

-- Șterge datele existente (opțional - comentează dacă vrei să păstrezi)
-- DELETE FROM user_roles;
-- DELETE FROM sessions;
-- DELETE FROM users;

-- Apoi rulează fișierul users_insert.sql generat de generate_users_insert.sql

