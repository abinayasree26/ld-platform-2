-- FR-01: Email/phone OTP login
-- Stores short-lived OTP codes for passwordless login (students/parents)

CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier  VARCHAR(255) NOT NULL,  -- email or phone, lowercased/trimmed
  code_hash   VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  consumed    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_identifier ON otp_codes(identifier, created_at DESC);
