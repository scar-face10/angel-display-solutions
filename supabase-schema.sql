-- ============================================================
-- Angels Display Solutions LLP — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create the enquiries table
CREATE TABLE IF NOT EXISTS enquiries (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name   TEXT          NOT NULL,
  customer_email  TEXT          NOT NULL,
  project_brief   TEXT          NOT NULL DEFAULT '',
  status          TEXT          NOT NULL DEFAULT 'New',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- 3. Deny all public SELECT access (customers cannot read enquiries)
CREATE POLICY "No public read"
  ON enquiries
  FOR SELECT
  TO public
  USING (false);

-- 4. Deny all public INSERT access (only the backend service role key can insert)
CREATE POLICY "No public insert"
  ON enquiries
  FOR INSERT
  TO public
  WITH CHECK (false);

-- 5. (Optional) Create an index for faster lookups by email and created_at
CREATE INDEX IF NOT EXISTS enquiries_email_idx     ON enquiries (customer_email);
CREATE INDEX IF NOT EXISTS enquiries_created_idx   ON enquiries (created_at DESC);

-- ============================================================
-- After running this, go to:
--   Supabase → Settings → API
-- Copy:
--   • Project URL   → SUPABASE_URL env var
--   • service_role key → SUPABASE_SERVICE_KEY env var  (keep secret!)
-- ============================================================
