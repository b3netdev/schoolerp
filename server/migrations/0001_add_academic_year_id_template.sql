-- Template: adding academic_year_id to an existing table.
-- Copy this per table (e.g. student_class_relation, fee_payment, attendance, ...).
-- Replace <TABLE> and adjust the natural-key columns in the UNIQUE constraint.

BEGIN;

ALTER TABLE <TABLE>
  ADD COLUMN academic_year_id INTEGER;

-- Backfill existing rows to the current default session before enforcing NOT NULL.
-- Adjust to whatever is correct for historical data in <TABLE>.
UPDATE <TABLE> t
   SET academic_year_id = s.id
  FROM academic_session s
 WHERE t.academic_year_id IS NULL
   AND s.default_session = true;

ALTER TABLE <TABLE>
  ALTER COLUMN academic_year_id SET NOT NULL;

ALTER TABLE <TABLE>
  ADD CONSTRAINT fk_<TABLE>_academic_year
  FOREIGN KEY (academic_year_id)
  REFERENCES academic_session (id)
  ON DELETE RESTRICT;

-- Every scoped query filters on this column, so it must be indexed.
CREATE INDEX idx_<TABLE>_academic_year_id
  ON <TABLE> (academic_year_id);

COMMIT;
