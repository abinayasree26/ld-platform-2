-- ============================================================
-- device_tokens — FCM push notification device registrations
-- ============================================================
CREATE TABLE IF NOT EXISTS device_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  device     VARCHAR(20) DEFAULT 'web' CHECK (device IN ('web', 'android', 'ios')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id    ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_updated_at ON device_tokens(updated_at);
