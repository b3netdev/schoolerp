-- Worked example matching the "student_class_relation" usage from the spec:
--   db.table<StudentClassRelation>("student_class_relation").insert(data)
--
-- Shows the full pattern for a *new* academic-year-scoped table: FK to
-- academic_session, an index on academic_year_id (every scoped query
-- filters on it), and a per-year unique constraint so the same student
-- can be re-enrolled in a later year without colliding with past rows.

BEGIN;

CREATE TABLE student_class_relation (
  id               SERIAL PRIMARY KEY,
  student_id       INTEGER NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  class_id         INTEGER NOT NULL REFERENCES classes (id) ON DELETE RESTRICT,
  section_id       INTEGER NOT NULL REFERENCES section (id) ON DELETE RESTRICT,
  -- Trusted from the JWT at write time by the query builder, never from the client.
  academic_year_id INTEGER NOT NULL REFERENCES academic_session (id) ON DELETE RESTRICT,
  status            TEXT NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,

  -- One active class/section assignment per student per academic year.
  CONSTRAINT uq_student_class_relation_student_year
    UNIQUE (student_id, academic_year_id)
);

CREATE INDEX idx_student_class_relation_academic_year_id
  ON student_class_relation (academic_year_id);

CREATE INDEX idx_student_class_relation_class_id
  ON student_class_relation (class_id);

CREATE INDEX idx_student_class_relation_section_id
  ON student_class_relation (section_id);

COMMIT;
