-- Migration: Fix foreign key constraints on dioceses to allow cascade delete
-- This allows deleting dioceses even when they have related deaneries and parishes
-- Related records will be automatically deleted when the diocese is deleted

-- Drop existing foreign key constraints
ALTER TABLE "deaneries" 
DROP CONSTRAINT IF EXISTS "deaneries_diocese_id_dioceses_id_fk";

ALTER TABLE "parishes" 
DROP CONSTRAINT IF EXISTS "parishes_diocese_id_dioceses_id_fk";

-- Recreate foreign key constraints with CASCADE delete
ALTER TABLE "deaneries" 
ADD CONSTRAINT "deaneries_diocese_id_dioceses_id_fk" 
FOREIGN KEY ("diocese_id") 
REFERENCES "public"."dioceses"("id") 
ON DELETE CASCADE 
ON UPDATE NO ACTION;

ALTER TABLE "parishes" 
ADD CONSTRAINT "parishes_diocese_id_dioceses_id_fk" 
FOREIGN KEY ("diocese_id") 
REFERENCES "public"."dioceses"("id") 
ON DELETE CASCADE 
ON UPDATE NO ACTION;



