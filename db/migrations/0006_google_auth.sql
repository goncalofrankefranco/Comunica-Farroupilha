ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_unique_idx ON users(google_sub);
