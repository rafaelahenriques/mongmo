-- Owners upload a pop-up's photo instead of pasting a URL.
--
-- `event-images` is public (the photo shows on every event card), holds
-- JPEG/PNG/WebP up to 5 MB, and only owners may add, replace or remove
-- files. The public URL goes into events.image_url as before.
--
-- Also caps challenge photos at 10 MB of images. Idempotent.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-images', 'event-images', true, 5 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

update storage.buckets
  set file_size_limit = 10 * 1024 * 1024,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  where id = 'challenge-photos';

drop policy if exists "event images readable" on storage.objects;
create policy "event images readable" on storage.objects
  for select to authenticated using (bucket_id = 'event-images');

drop policy if exists "event images owner insert" on storage.objects;
create policy "event images owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-images' and public.is_owner());

drop policy if exists "event images owner update" on storage.objects;
create policy "event images owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'event-images' and public.is_owner())
  with check (bucket_id = 'event-images' and public.is_owner());

drop policy if exists "event images owner delete" on storage.objects;
create policy "event images owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-images' and public.is_owner());
