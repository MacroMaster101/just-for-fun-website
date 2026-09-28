-- Lock the app's tables away from Supabase's public Data API (PostgREST).
--
-- Why: Prisma creates every table in the `public` schema. By default
-- Supabase exposes `public` over its REST API and grants the `anon` and
-- `authenticated` roles access, so anyone holding the (public) anon key
-- could read or write these tables directly, bypassing the app's API
-- routes. For example, inserting a row into "AdminEmail" would make an
-- attacker an admin.
--
-- The app never reads these tables through the Data API: all access goes
-- through Prisma, which connects as the table owner and is not affected
-- by row level security. The browser only uses Supabase Auth, Storage,
-- and a Realtime presence channel, none of which touch these tables.
--
-- Safe to run more than once. Re-run it after `prisma db push` creates new
-- tables. Run it in the Supabase dashboard: SQL Editor -> New query.

-- 1. Row level security on every table in `public`, with no policies:
--    anon/authenticated can't see or change any row. Table owners (Prisma)
--    are unaffected.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.relname);
  END LOOP;
END
$$;

-- 2. Remove the Data API roles' privileges on existing objects...
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- 3. ...and stop future tables created by Prisma from getting them.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- 4. Verify: every row should show rls = true and all access = false.
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls,
  has_table_privilege('anon', c.oid, 'SELECT') AS anon_can_read,
  has_table_privilege('anon', c.oid, 'INSERT') AS anon_can_insert,
  has_table_privilege('authenticated', c.oid, 'INSERT') AS signed_in_can_insert
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
ORDER BY c.relname;
