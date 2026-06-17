-- KODE Face-ID portal — backend schema.
-- IMPORTANT: this database stores ONLY portal users and audit logs.
-- It never stores member biometric data, face images, or AEOS records —
-- those live exclusively in the AEOS/Suprema system this portal integrates with.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  full_name     TEXT        NOT NULL,
  username      TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL CHECK (role IN ('admin', 'cx_agent')),
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id              BIGSERIAL PRIMARY KEY,
  actor_id        INTEGER     REFERENCES users(id) ON DELETE SET NULL,
  actor_username  TEXT        NOT NULL,            -- denormalized snapshot, survives user deletion
  actor_full_name TEXT        NOT NULL DEFAULT '', -- staff display name at time of action
  action          TEXT        NOT NULL,            -- lookup | upload | bulk_upload | login | user_create | ...
  status          TEXT        NOT NULL CHECK (status IN ('ok', 'err', 'info')),
  detail          TEXT        NOT NULL DEFAULT '',
  target_code     TEXT,                            -- membership code involved (no PII beyond the code)
  carrier_id      TEXT,                            -- AEOS carrier id involved
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id   ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status     ON audit_logs (status);

-- Idempotent upgrades for databases created before actor_full_name existed.
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_full_name TEXT NOT NULL DEFAULT '';
