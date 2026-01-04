-- Add Părinți Protopopi (Archpriest Parents) details for Episcopia Ortodoxă Română a Italiei
-- This migration adds/updates deaneries with the archpriest names

-- First, ensure the diocese for Italy exists
INSERT INTO "dioceses" ("code", "name", "country", "is_active", "created_at", "updated_at")
VALUES ('IT', 'Episcopia Ortodoxă Română a Italiei', 'Italia', true, NOW(), NOW())
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "updated_at" = NOW();

-- Insert/Update deaneries with archpriest names
-- Using INSERT ... ON CONFLICT to handle both new and existing deaneries
-- Lazio I
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'LAZIO-1', 'Lazio I', 'Pr. Cristian Olteanu', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Lazio II
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'LAZIO-2', 'Lazio II', 'Pr. Gabriel Ioniță', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Lazio III
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'LAZIO-3', 'Lazio III', 'Pr. Ștefan Nanu', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Lazio IV
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'LAZIO-4', 'Lazio IV', 'Pr. Lucian Bîrzu', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Lombardia I
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'LOMBARDIA-1', 'Lombardia I', 'Pr. Ștefan Andronache', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Lombardia II
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'LOMBARDIA-2', 'Lombardia II', 'Pr. Pompiliu Nacu', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Lombardia III
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'LOMBARDIA-3', 'Lombardia III', 'Pr. Bogdan Filip', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Piemonte I
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'PIEMONTE-1', 'Piemonte I', 'Pr. Marius Floricu', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Piemonte II
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'PIEMONTE-2', 'Piemonte II', 'Pr. Cătălin Zaharie', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Piemonte III
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'PIEMONTE-3', 'Piemonte III', 'Pr. Ștefan Cristian', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Triveneto I
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'TRIVENETO-1', 'Triveneto I', 'Pr. Avram Matei', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Triveneto II
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'TRIVENETO-2', 'Triveneto II', 'Pr. Gabor Codrea', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Triveneto III
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'TRIVENETO-3', 'Triveneto III', 'Pr. Florin Cherecheș', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Triveneto IV
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'TRIVENETO-4', 'Triveneto IV', 'Pr. Gheorghe Verzea', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Emilia Romagna I
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'EMILIA-ROMAGNA-1', 'Emilia Romagna I', 'Pr. Trandafir Vid', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Emilia Romagna II
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'EMILIA-ROMAGNA-2', 'Emilia Romagna II', 'Pr. Vasile Jora', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Toscana I
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'TOSCANA-1', 'Toscana I', 'Pr. Ioan Bobîrnea', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Toscana II
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'TOSCANA-2', 'Toscana II', 'Pr. Ciprian Calfa', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Liguria
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'LIGURIA', 'Liguria', 'Pr. Constantin Filip', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Umbria Marche
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'UMBRIA-MARCHE', 'Umbria Marche', 'Pr. Petru Heisu', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Abruzzo Molise
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'ABRUZZO-MOLISE', 'Abruzzo Molise', 'Pr. Alin Iarca', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Campania
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'CAMPANIA', 'Campania', 'Pr. Florin Bontea', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Puglia Basilicata
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'PUGLIA-BASILICATA', 'Puglia Basilicata', 'Pr. Ioan Diaconu', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Sicilia
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'SICILIA', 'Sicilia', 'Pr. Nicolae Chilcoș', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Calabria
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'CALABRIA', 'Calabria', 'Pr. Ivan Dobroțchi', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Sardegna
INSERT INTO "deaneries" ("diocese_id", "code", "name", "dean_name", "is_active", "created_at", "updated_at")
SELECT id, 'SARDEGNA', 'Sardegna', 'Pr. Paul Cârlan', true, NOW(), NOW()
FROM "dioceses" WHERE "code" = 'IT'
ON CONFLICT ("diocese_id", "code") DO UPDATE
SET "name" = EXCLUDED."name", "dean_name" = EXCLUDED."dean_name", "updated_at" = NOW();

-- Insert/Update parishes (parohii) associated with each deanery
-- Fiumicino - Lazio I
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'FIUMICINO', 'Fiumicino', 'Pr. Cristian Olteanu', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'LAZIO-1' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Roma Prima Porta - Lazio II
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'ROMA-PRIMA-PORTA', 'Roma Prima Porta', 'Pr. Gabriel Ioniță', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'LAZIO-2' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Aprilia - Lazio III
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'APRILIA', 'Aprilia', 'Pr. Ștefan Nanu', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'LAZIO-3' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Ladispoli - Lazio IV
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'LADISPOLI', 'Ladispoli', 'Pr. Lucian Bîrzu', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'LAZIO-4' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Milano II - Lombardia I
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'MILANO-II', 'Milano II', 'Pr. Ștefan Andronache', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'LOMBARDIA-1' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Milano Nord Monza - Lombardia II
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'MILANO-NORD-MONZA', 'Milano Nord Monza', 'Pr. Pompiliu Nacu', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'LOMBARDIA-2' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Bergamo - Lombardia III
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'BERGAMO', 'Bergamo', 'Pr. Bogdan Filip', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'LOMBARDIA-3' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Moncalieri - Piemonte I
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'MONCALIERI', 'Moncalieri', 'Pr. Marius Floricu', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'PIEMONTE-1' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Alba - Piemonte II
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'ALBA', 'Alba', 'Pr. Cătălin Zaharie', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'PIEMONTE-2' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Novara - Piemonte III
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'NOVARA', 'Novara', 'Pr. Ștefan Cristian', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'PIEMONTE-3' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Venezia I - Triveneto I
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'VENEZIA-I', 'Venezia I', 'Pr. Avram Matei', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'TRIVENETO-1' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Verona I - Triveneto II
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'VERONA-I', 'Verona I', 'Pr. Gabor Codrea', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'TRIVENETO-2' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- San Dona di Piave - Triveneto III
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'SAN-DONA-DI-PIAVE', 'San Dona di Piave', 'Pr. Florin Cherecheș', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'TRIVENETO-3' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Padova I - Triveneto IV
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'PADOVA-I', 'Padova I', 'Pr. Gheorghe Verzea', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'TRIVENETO-4' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Bologna Vest - Emilia Romagna I
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'BOLOGNA-VEST', 'Bologna Vest', 'Pr. Trandafir Vid', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'EMILIA-ROMAGNA-1' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Ferrara - Emilia Romagna II
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'FERRARA', 'Ferrara', 'Pr. Vasile Jora', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'EMILIA-ROMAGNA-2' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Firenze II - Toscana I
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'FIRENZE-II', 'Firenze II', 'Pr. Ioan Bobîrnea', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'TOSCANA-1' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Livorno - Toscana II
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'LIVORNO', 'Livorno', 'Pr. Ciprian Calfa', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'TOSCANA-2' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Genova - Liguria
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'GENOVA', 'Genova', 'Pr. Constantin Filip', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'LIGURIA' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Perugia - Umbria Marche
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'PERUGIA', 'Perugia', 'Pr. Petru Heisu', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'UMBRIA-MARCHE' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Pescara - Abruzzo Molise
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'PESCARA', 'Pescara', 'Pr. Alin Iarca', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'ABRUZZO-MOLISE' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Napoli - Campania
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'NAPOLI', 'Napoli', 'Pr. Florin Bontea', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'CAMPANIA' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Trani - Puglia Basilicata
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'TRANI', 'Trani', 'Pr. Ioan Diaconu', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'PUGLIA-BASILICATA' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Ragusa - Sicilia
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'RAGUSA', 'Ragusa', 'Pr. Nicolae Chilcoș', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'SICILIA' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Catanzaro Crotone - Calabria
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'CATANZARO-CROTONE', 'Catanzaro Crotone', 'Pr. Ivan Dobroțchi', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'CALABRIA' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

-- Cagliari - Sardegna
INSERT INTO "parishes" ("deanery_id", "diocese_id", "code", "name", "priest_name", "is_active", "created_at", "updated_at")
SELECT d.id, d.diocese_id, 'CAGLIARI', 'Cagliari', 'Pr. Paul Cârlan', true, NOW(), NOW()
FROM "deaneries" d
WHERE d."code" = 'SARDEGNA' AND d."diocese_id" = (SELECT id FROM "dioceses" WHERE "code" = 'IT')
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "priest_name" = EXCLUDED."priest_name", "deanery_id" = EXCLUDED."deanery_id", "updated_at" = NOW();

