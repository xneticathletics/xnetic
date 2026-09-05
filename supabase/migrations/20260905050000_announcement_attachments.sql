-- Duyurulara isteğe bağlı bir dosya eki (fotoğraf/video/belge) eklenebiliyor
-- artık — max 1 MB (mevcut duyuru oluşturma yetkisiyle aynı: sadece kulüp
-- admini yükleyebilir, bkz. AnnouncementsScreen.tsx'teki role === "club_admin").
alter table public.announcements add column attachment_url text;

insert into storage.buckets (id, name, public, file_size_limit)
values ('announcement-attachments', 'announcement-attachments', true, 1048576)
on conflict (id) do update set file_size_limit = 1048576;

-- storage.objects.name AÇIKÇA nitelenmiş — public.users'ın da kendi "name"
-- kolonu olduğu için bare "name" burada EXISTS alt sorgusunun içindeki
-- users.name'e çözülür, dışarıdaki storage.objects.name'e değil (bkz.
-- security_storage_rls_name_ambiguity_bug memory'si — 2026-09-04'te
-- keşfedilen, tüm coach/club_admin yüklemelerini sessizce engelleyen hata).
create policy "announcement_attachments_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'announcement-attachments'
    and exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.role = 'club_admin'
        and u.club_id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

create policy "announcement_attachments_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'announcement-attachments'
    and exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.role = 'club_admin'
        and u.club_id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

create policy "announcement_attachments_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'announcement-attachments'
    and exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.role = 'club_admin'
        and u.club_id::text = (storage.foldername(storage.objects.name))[1]
    )
  );
