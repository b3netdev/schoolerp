
-- users table

CREATE TABLE users (
     id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    role VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_At TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_At TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE
);


-- Settings model
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  setting_group VARCHAR(100) NOT NULL,
  key VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- section
create table section (
   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
   name VARCHAR(10),
   stream VARCHAR(20),
   display_order INT UNIQUE,
   description TEXT,
    created_At TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_At TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE DEFAULT

)

--class_section relation

CREATE TABLE     (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    class_id BIGINT NOT NULL,
    section_id BIGINT NOT NULL,
    teacher_id BIGINT,
    academic_year_id BIGINT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_class_section_relation_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_class_section_relation_section
        FOREIGN KEY (section_id)
        REFERENCES section(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_class_section_relation_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_class_section_relation_academic_session
        FOREIGN KEY (academic_year_id)
        REFERENCES academic_session(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS public.academic_session (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'inactive',
    default_session BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    CONSTRAINT chk_academic_session_dates
        CHECK (end_date > start_date),

    CONSTRAINT chk_academic_session_status
        CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE public.class_section_relation (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    class_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    teacher_id INTEGER,
    academic_year_id INTEGER NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_class_section_relation_class
        FOREIGN KEY (class_id)
        REFERENCES public.classes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_class_section_relation_section
        FOREIGN KEY (section_id)
        REFERENCES public.section(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_class_section_relation_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES public.teachers(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_class_section_relation_academic_session
        FOREIGN KEY (academic_year_id)
        REFERENCES public.academic_session(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE UNIQUE INDEX
uq_class_section_academic_session
ON public.class_section_relation (
    class_id,
    section_id,
    academic_year_id
)
WHERE deleted_at IS NULL;

CREATE INDEX idx_class_section_relation_class_id
ON public.class_section_relation(class_id);

CREATE INDEX idx_class_section_relation_section_id
ON public.class_section_relation(section_id);

CREATE INDEX idx_class_section_relation_teacher_id
ON public.class_section_relation(teacher_id);

CREATE INDEX idx_class_section_relation_academic_year_id
ON public.class_section_relation(academic_year_id);





-- academic_year table
create table academic_year (
id SERIAL PRIMARY KEY,
name VARCHAR(10),
status VARCHAR(10),
remarks VARCHAR(20),
created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);



-- teacher table

-- sequence generate function

CREATE SEQUENCE IF NOT EXISTS teacher_employee_code_seq
START WITH 1
INCREMENT BY 1;



CREATE TABLE teachers (
 id SERIAL PRIMARY KEY,
    -- Basic teacher details
    employee_code VARCHAR(50) UNIQUE DEFAULT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    password TEXT,
    alternate_phone VARCHAR(20),

    -- Personal details
    gender VARCHAR(20),
    date_of_birth DATE,
    blood_group VARCHAR(10),
    marital_status VARCHAR(30),

    -- Address details
    current_address TEXT,
    permanent_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pincode VARCHAR(20),

    -- Professional details
    qualification VARCHAR(255),
    specialization VARCHAR(255),
    experience_years INTEGER DEFAULT 0,
    joining_date DATE,
    employment_type VARCHAR(50), -- Full Time, Part Time, Contract
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, resigned

    -- Salary / HR details
    basic_salary NUMERIC(12,2),
    bank_name VARCHAR(150),
    bank_account_number VARCHAR(100),
    ifsc_code VARCHAR(50),
    pan_number VARCHAR(50),

    -- Emergency contact
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),

    -- Profile
    profile_image TEXT,
    remarks TEXT,

    -- Timestamps
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE
);



-- stream_table
CREATE TABLE stream (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


--create session table

CREATE TABLE academic_session (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    default_session BOOLEAN NOT NULL DEFAULT FALSE,

    status VARCHAR(20) NOT NULL DEFAULT 'inactive'
        CHECK (status IN ('active', 'inactive')),

    description TEXT,

    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,

    CONSTRAINT valid_academic_session_date_range
        CHECK (end_date > start_date)
);

CREATE UNIQUE INDEX unique_active_academic_session
ON academic_session (status)
WHERE status = 'active'
AND deleted_at IS NULL;





--Subjects table

CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,

    class_section_id INT NOT NULL,
    display_order INT UNIQUE,

    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,

    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NULL,

    CONSTRAINT fk_subjects_class_section
        FOREIGN KEY (class_section_id)
        REFERENCES class_section_relation(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Index for faster filtering/joining by class_section_id
CREATE INDEX idx_subjects_class_section_id
ON subjects(class_section_id);
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_subjects_updated_at
BEFORE UPDATE ON subjects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();



--student_attendence table
CREATE TABLE student_attendence (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    student_id INTEGER NOT NULL,
	academic_year_id INTEGER NOT NULL,
    subject_id INTEGER,

    admin_id INTEGER NULL,
    teacher_id INTEGER NULL,

    class_section_id INTEGER NOT NULL,

    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,

    attended VARCHAR(20)
        DEFAULT null
        CHECK (attended IN ('present', 'absent')),

    created_at TIMESTAMP WITHOUT TIME ZONE
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITHOUT TIME ZONE
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_attendance_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_student_attendance_class_section
        FOREIGN KEY (class_section_id)
        REFERENCES class_section_relation(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_student_attendance_admin
        FOREIGN KEY (admin_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_student_attendance_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(id)
        ON DELETE RESTRICT,

	CONSTRAINT fk_academic_session_id
		FOREIGN KEY (academic_year_id)
		REFERENCES academic_session(id)
		ON DELETE RESTRICT,
    CONSTRAINT fk_student_attendance_subject
FOREIGN KEY (subject_id)
REFERENCES public.subject(id)
CONSTRAINT uq_student_attendance
UNIQUE (
    student_id,
    academic_year_id,
    class_section_id,
    attendance_date
),

    CONSTRAINT chk_attendance_actor
        CHECK (
            (
                admin_id IS NOT NULL
                AND teacher_id IS NULL
            )
            OR
            (
                admin_id IS NULL
                AND teacher_id IS NOT NULL
            )
        )
);



CREATE UNIQUE INDEX uq_student_attendence_daily
ON public.student_attendence (
    student_id,
    academic_year_id,
    class_section_id,
    attendance_date
);