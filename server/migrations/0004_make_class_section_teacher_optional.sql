-- Allows a class-section relation to be created without a teacher assigned yet.

BEGIN;

ALTER TABLE class_section_relation
  ALTER COLUMN teacher_id DROP NOT NULL;

COMMIT;
