CREATE TABLE IF NOT EXISTS legacy_google_link_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS legacy_google_link_tokens_expires_at_idx
  ON legacy_google_link_tokens(expires_at);
