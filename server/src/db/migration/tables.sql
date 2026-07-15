
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

create table class_section_relation (
id SERIAL PRIMARY KEY,
class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE RESTRICT,
teacher_id INTEGER REFERENCES teachers(id) ON DELETE RESTRICT,
created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


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