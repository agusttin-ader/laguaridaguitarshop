-- SQL to create a simple settings table used by the app's server-side persistence.
-- Run this in your Supabase SQL editor (or psql against your database).

CREATE TABLE IF NOT EXISTS settings (
  id text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Optional: allow the service_role (server) to upsert/select.
-- Supabase handles service role via the key, so no additional grants usually needed.

-- Seed a default site settings row if you want:
INSERT INTO settings (id, payload)
VALUES ('site', '{"featured": [], "heroImage": "/images/homepage.jpeg"}')
ON CONFLICT (id) DO NOTHING;
