-- Student module: minimal `students` table + `student_meta` for extended
-- profile fields, `student_class_relation` for per-academic-year class/section
-- enrollment, and `student_refresh_tokens` for the student portal's
-- refresh-token login flow.

BEGIN;

-- Same pattern as teacher_employee_code_seq, used for auto-generated student_code.
CREATE SEQUENCE IF NOT EXISTS student_student_code_seq
  START WITH 1
  INCREMENT BY 1;

CREATE TABLE students (
  id SERIAL PRIMARY KEY,

  student_code VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'active',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,

  CONSTRAINT chk_students_status CHECK (status IN ('active', 'inactive')),
  CONSTRAINT uq_students_student_code UNIQUE (student_code)
);

-- Login identifiers: unique only among non-deleted rows, and only when present
-- (a student may legitimately have no email or no phone on file).
CREATE UNIQUE INDEX uq_students_email
  ON students (email)
  WHERE deleted_at IS NULL AND email IS NOT NULL;

CREATE UNIQUE INDEX uq_students_phone
  ON students (phone)
  WHERE deleted_at IS NULL AND phone IS NOT NULL;

CREATE INDEX idx_students_deleted_at ON students (deleted_at);

-- Extended/optional profile data, kept off the minimal `students` table.
-- Dynamic key/value design (EAV) so new fields (gender, blood group,
-- guardian info, or anything an admin wants later) never require a schema
-- migration — just a new meta_key.
CREATE TABLE student_meta (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  student_id INTEGER NOT NULL,

  meta_key VARCHAR(150) NOT NULL,
  meta_value TEXT NULL,
  meta_type VARCHAR(30) NOT NULL DEFAULT 'string',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,

  CONSTRAINT fk_student_meta_student
    FOREIGN KEY (student_id)
    REFERENCES students (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT uq_student_meta_key
    UNIQUE (student_id, meta_key),

  CONSTRAINT chk_student_meta_type
    CHECK (
      meta_type IN (
        'string',
        'number',
        'boolean',
        'date',
        'json',
        'jsonb',
        'text'
      )
    )
);

CREATE INDEX idx_student_meta_student_id ON student_meta (student_id);

-- Per-academic-year class/section enrollment. Points at an existing
-- class_section_relation row (class + section + teacher for a year) instead
-- of duplicating class_id/section_id here — a student can only be assigned
-- to a class/section pairing that already exists as an actual relation.
-- academic_year_id is populated automatically by the query builder from the
-- authenticated admin's JWT — never passed manually from a controller.
CREATE TABLE student_class_relation (
  id SERIAL PRIMARY KEY,

  student_id INTEGER NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  class_section_id INTEGER NOT NULL REFERENCES class_section_relation (id) ON DELETE RESTRICT,
  academic_year_id INTEGER NOT NULL REFERENCES academic_session (id) ON DELETE RESTRICT,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- One active class/section assignment per student per academic year.
CREATE UNIQUE INDEX uq_student_class_relation_student_year
  ON student_class_relation (student_id, academic_year_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_student_class_relation_student_id ON student_class_relation (student_id);
CREATE INDEX idx_student_class_relation_class_section_id ON student_class_relation (class_section_id);
CREATE INDEX idx_student_class_relation_academic_year_id ON student_class_relation (academic_year_id);

-- Refresh-token rotation store for the student portal's login flow. Only the
-- sha256 hash of the raw token is ever stored.
CREATE TABLE student_refresh_tokens (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students (id) ON DELETE CASCADE,

  token_hash VARCHAR(128) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_student_refresh_tokens_token_hash UNIQUE (token_hash)
);

CREATE INDEX idx_student_refresh_tokens_student_id ON student_refresh_tokens (student_id);

COMMIT;
