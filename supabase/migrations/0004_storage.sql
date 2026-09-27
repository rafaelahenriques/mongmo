-- Storage bucket for challenge photos (Capture/Discovery challenge types).
-- Public read (per-event gallery), writes restricted to the uploader's own
-- folder: challenge-photos/<user_id>/<file>.

insert into storage.buckets (id, name, public)
values ('challenge-photos', 'challenge-photos', true)
on conflict (id) do nothing;

create policy "challenge photos readable" on storage.objects
  for select to authenticated using (bucket_id = 'challenge-photos');

create policy "challenge photos insert own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'challenge-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
