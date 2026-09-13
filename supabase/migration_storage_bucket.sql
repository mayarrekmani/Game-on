-- Fixes the real performance problem: uploaded photos were being stored
-- as base64 text directly inside database rows (profiles.avatar_url,
-- groups.avatar_url). That text gets duplicated into every row that
-- joins that profile/group — every chat message, every RSVP, every
-- membership row — so one uploaded photo can balloon a normal page load
-- into many megabytes.
--
-- The fix: store the actual file in Supabase Storage (a proper file
-- host) and keep only a short link (a URL) in the database instead.

-- Public bucket: profile/group photos aren't sensitive, so serving them
-- via a plain public URL (no per-request auth check) is simplest and
-- fine here — this matches how they were already effectively public
-- as base64 in every query result anyway.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone signed in can upload a file into this bucket. Uploads are
-- namespaced by folder (e.g. "profiles/<uuid>-name.jpg",
-- "groups/<uuid>-name.jpg") in application code, not enforced here —
-- fine for a small friend-group app; nothing sensitive is being
-- protected by upload permission itself.
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can delete their own uploaded avatars"
  on storage.objects for delete
  using (bucket_id = 'avatars' and owner = auth.uid());
