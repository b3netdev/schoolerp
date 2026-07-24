
-- users table

CREATE TABLE users (
     id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    role VARCHAR(20),
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
   description TEXT,
    created_At TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_At TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE DEFAULT

)

--class_section relation

CREATE TABLE class_section_relation (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    class_id BIGINT NOT NULL,
    section_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
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
    teacher_id INTEGER NOT NULL,
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



--create students
create table students(
id  serial primary key,
first_name varchar(50) not null,
last_name varchar(50),
email varchar(50) unique,
password text,
status varchar(20) check(status in ('active', 'inactive')),
phone varchar(15),
created_at timestamp without time zone now(),
updated_at timestamp without time zone
);