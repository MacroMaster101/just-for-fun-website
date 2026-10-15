-- Storage hardening: enforce file size and MIME type limits on every bucket
-- at the Storage layer, so uploads that skip our API routes (e.g. a signed-in
-- user calling Storage directly with the anon key) are held to the same rules.
-- Limits mirror the checks in the upload routes under src/app/api/.
--
-- Safe to re-run: buckets are upserted and the policy drop is conditional.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- src/app/api/profile/avatar/route.ts (3 MB)
  ('avatars', 'avatars', true, 3145728,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  -- src/app/api/admin/squad/avatar/route.ts (3 MB)
  ('squad-avatars', 'squad-avatars', true, 3145728,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  -- src/app/api/admin/sounds/audio + admin/music/audio. The music route
  -- allows 150 MB, but the Free plan caps every upload at 50 MB anyway.
  ('sound-clips', 'sound-clips', true, 52428800,
    array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
          'audio/ogg', 'audio/webm']),
  -- src/app/api/highlights/route.ts (50 MB). Not created yet in production.
  ('highlights', 'highlights', true, 52428800,
    array['video/mp4', 'video/webm', 'video/quicktime']),
  -- src/app/api/admin/games/logo/route.ts (2 MB). Not created yet in production.
  ('game-logos', 'game-logos', true, 2097152,
    array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets serve files by URL without any policy. This SELECT policy
-- only added the ability for anyone to *list* the bucket through the API,
-- which exposes every user's id (avatars live under <user id>/). The app
-- lists avatars with the service-role client, which bypasses RLS. The
-- owner-only policies ("Owner upload avatars ...") stay as they are.
drop policy if exists "Public read avatars 1oj01fe_0" on storage.objects;
