create policy "Site photos are readable" on storage.objects for select to anon, authenticated
  using (bucket_id = 'site-photos');