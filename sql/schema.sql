-- Smart Campus Facility Booking & Management System
-- Day 2: PostgreSQL data design only. No application/backend code is included here.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL CHECK (char_length(trim(full_name)) >= 2),
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_email_normalized CHECK (email = lower(email)),
    CONSTRAINT users_email_format CHECK (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

CREATE TABLE facilities (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    location VARCHAR(160) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT facilities_name_location_unique UNIQUE (name, location),
    CONSTRAINT facilities_name_not_blank CHECK (char_length(trim(name)) >= 2),
    CONSTRAINT facilities_location_not_blank CHECK (char_length(trim(location)) >= 2)
);

CREATE TABLE bookings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    purpose VARCHAR(500) NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT bookings_valid_interval CHECK (ends_at > starts_at),
    CONSTRAINT bookings_reasonable_length CHECK (ends_at <= starts_at + interval '12 hours'),
    CONSTRAINT bookings_purpose_not_blank CHECK (char_length(trim(purpose)) >= 3),
    CONSTRAINT bookings_review_metadata CHECK (
        (status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
        OR (status IN ('pending', 'cancelled') AND reviewed_by IS NULL AND reviewed_at IS NULL)
    ),
    -- [) lets a booking ending at 11:00 coexist with one starting at 11:00.
    CONSTRAINT approved_booking_times_do_not_overlap EXCLUDE USING gist (
        facility_id WITH =,
        tstzrange(starts_at, ends_at, '[)') WITH &&
    ) WHERE (status = 'approved')
);

CREATE INDEX bookings_facility_time_idx ON bookings (facility_id, starts_at, ends_at);
CREATE INDEX bookings_user_created_idx ON bookings (user_id, created_at DESC);
CREATE INDEX bookings_pending_review_idx ON bookings (created_at) WHERE status = 'pending';

-- Day 3 application rule:
-- before approving a pending request, the API must lock/check the requested interval
-- and gracefully report an exclusion-constraint conflict if another approval wins.
