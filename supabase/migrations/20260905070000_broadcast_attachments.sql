-- Süper Admin'in kulüp adminlerine attığı duyuruya da dosya eki eklenebilsin
-- diye announcement-attachments bucket politikalarına is_super_admin() ekler.
-- Süper Admin'in hiçbir kulübe bağlı club_id'si olmadığı için mevcut
-- politikalardaki "u.club_id::text = (storage.foldername(...))[1]" kontrolü
-- ona hiç uymuyordu — is_super_admin() olan çağrılar için bu kontrolü
-- tamamen atlıyoruz (super admin bucket içinde herhangi bir yola yazabilir,
-- pratikte "broadcast/" öneki kullanılıyor).

drop policy if exists "announcement_attachments_insert" on storage.objects;
create policy "announcement_attachments_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'announcement-attachments'
    and (
      public.is_super_admin()
      or exists (
        select 1 from public.users u
        where u.auth_user_id = auth.uid()
          and u.role = 'club_admin'
          and u.club_id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
  );

drop policy if exists "announcement_attachments_update" on storage.objects;
create policy "announcement_attachments_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'announcement-attachments'
    and (
      public.is_super_admin()
      or exists (
        select 1 from public.users u
        where u.auth_user_id = auth.uid()
          and u.role = 'club_admin'
          and u.club_id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
  );

drop policy if exists "announcement_attachments_delete" on storage.objects;
create policy "announcement_attachments_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'announcement-attachments'
    and (
      public.is_super_admin()
      or exists (
        select 1 from public.users u
        where u.auth_user_id = auth.uid()
          and u.role = 'club_admin'
          and u.club_id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
  );
