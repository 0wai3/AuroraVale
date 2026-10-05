CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    application_number VARCHAR(30) UNIQUE NOT NULL,

    full_name VARCHAR(150) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,

    organization_name VARCHAR(200),
    organization_type VARCHAR(100),
    representative_role VARCHAR(150),

    preferred_destination VARCHAR(150) NOT NULL,

    passport_status VARCHAR(100) NOT NULL,

    participation_reason TEXT NOT NULL,
    organization_information TEXT,
    additional_information TEXT,

    email_verified BOOLEAN NOT NULL DEFAULT FALSE,

    payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    payment_amount_cents INTEGER NOT NULL DEFAULT 2000,
    payment_currency VARCHAR(3) NOT NULL DEFAULT 'USD',

    participant_status VARCHAR(40) NOT NULL DEFAULT 'application_pending',

    selection_status VARCHAR(40) NOT NULL DEFAULT 'not_selected',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_email
ON applications(email);

CREATE INDEX IF NOT EXISTS idx_applications_country
ON applications(country);

CREATE INDEX IF NOT EXISTS idx_applications_destination
ON applications(preferred_destination);

CREATE INDEX IF NOT EXISTS idx_applications_payment_status
ON applications(payment_status);

CREATE INDEX IF NOT EXISTS idx_applications_participant_status
ON applications(participant_status);

CREATE INDEX IF NOT EXISTS idx_applications_created_at
ON applications(created_at);
CREATE TABLE IF NOT EXISTS email_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    application_id UUID NOT NULL
        REFERENCES applications(id)
        ON DELETE CASCADE,

    code_hash VARCHAR(255) NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    attempts INTEGER NOT NULL DEFAULT 0,

    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_application
ON email_verification_codes(application_id);

CREATE INDEX IF NOT EXISTS idx_email_verification_expires
ON email_verification_codes(expires_at);