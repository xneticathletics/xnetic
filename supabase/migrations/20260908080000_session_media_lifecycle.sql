-- Antrenman fotoğrafları için üç değişiklik:
-- 1) Fotoğraf silme yetkisi daraltılıyor: bugüne kadar o grubu koçlayan
--    HERHANGİ bir antrenör silebiliyordu — artık sadece admin, branş
--    koordinatörü ve salon yetkilisi (venue_coaches).
-- 2) Sporcular kendi grubunun antrenmanına fotoğraf ekleyebilsin.
-- 3) 2 hafta sonra otomatik silinsin — hem veritabanı kaydı hem de
--    Storage'daki gerçek dosya. Bunun için gerçek dosyayı silebilmek
--    (SQL'den doğrudan storage.objects DELETE, arka plandaki dosyayı
--    silmiyor — sadece Storage API/SDK üzerinden .remove() çağrısı
--    siliyor) service-role bir Edge Function gerekiyor; pg_cron sadece
--    onu tetikliyor (delete-club'taki service-role client deseniyle aynı).

-- Silme sırasında gerçek Storage dosya yolunu bilmek için — media_url'de
-- SADECE imzalı URL tutuluyordu, path'i URL'den her seferinde ayrıştırmak
-- kırılgan olurdu. Var olan satırlar için imzalı URL'den path geri
-- çıkarılıyor (best-effort), bundan sonrası uploadSessionPhoto tarafından
-- doğrudan yazılacak.
alter table public.training_session_media add column if not exists storage_path text;
update public.training_session_media
set storage_path = substring(media_url from 'session-media/([^?]+)')
where storage_path is null;

-- Silme: admin + branş koordinatörü + salon yetkilisi (is_my_coordinated_group/
-- is_venue_authority, training_sessions'ın kendi INSERT/DELETE politikalarıyla
-- aynı fonksiyonlar — bkz. 20260907040000_venue_authority_and_session_perms.sql).
-- Sıradan (koordinatör/salon yetkilisi olmayan) antrenörün silme hakkı kaldırıldı.
drop policy if exists "training_session_media_delete" on public.training_session_media;
create policy "training_session_media_delete" on public.training_session_media
  for delete to authenticated
  using (
    club_id = public.current_club_id()
    and exists (
      select 1 from training_sessions ts
      where ts.id = training_session_media.session_id
      and (public.is_admin_tier() or public.is_my_coordinated_group(ts.group_id) or public.is_venue_authority(ts.venue_id))
    )
  );

-- Ekleme: admin + o grubu koçlayan antrenör (değişmedi) + ARTIK o gruptaki
-- sporcunun kendisi de (is_my_athlete benzeri, ama athlete_id yerine
-- session'ın group_id'sinden caller'ın kendi sporcu kaydını arıyor).
drop policy if exists "training_session_media_write" on public.training_session_media;
create policy "training_session_media_write" on public.training_session_media
  for insert to authenticated
  with check (
    club_id = public.current_club_id()
    and exists (
      select 1 from training_sessions ts
      where ts.id = training_session_media.session_id
      and (
        public.is_admin_tier()
        or public.is_my_coached_group(ts.group_id)
        or exists (
          select 1 from athletes a
          where a.group_id = ts.group_id
          and a.athlete_user_id = (select id from users where auth_user_id = auth.uid())
        )
      )
    )
  );

-- Storage tarafında da AYNI iki değişiklik — bugüne kadar sadece SELECT ve
-- INSERT politikası vardı, DELETE hiç yoktu (yani hiç kimse gerçek dosyayı
-- silemiyordu, sadece service-role/cron silebilir).
drop policy if exists "session_media_insert" on storage.objects;
create policy "session_media_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'session-media'
    and exists (
      select 1 from training_sessions s
      where (s.id)::text = (storage.foldername(storage.objects.name))[1]
      and s.club_id = public.current_club_id()
      and (
        public.is_admin_tier()
        or public.is_my_coached_group(s.group_id)
        or exists (
          select 1 from athletes a
          where a.group_id = s.group_id
          and a.athlete_user_id = (select id from users where auth_user_id = auth.uid())
        )
      )
    )
  );

create policy "session_media_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'session-media'
    and exists (
      select 1 from training_sessions s
      where (s.id)::text = (storage.foldername(storage.objects.name))[1]
      and s.club_id = public.current_club_id()
      and (public.is_admin_tier() or public.is_my_coordinated_group(s.group_id) or public.is_venue_authority(s.venue_id))
    )
  );

-- 2 hafta sonra otomatik silme — send_payment_reminders ile aynı günlük
-- pg_cron deseni, ama gerçek iş (Storage'dan dosya silme) SQL'den
-- yapılamadığı için burada sadece service-role Edge Function'ı tetikliyoruz
-- (bkz. supabase/functions/cleanup-old-session-media).
create or replace function public.trigger_session_media_cleanup()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_project_url text := 'https://dfinjohgmtdawkgwnhfj.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaW5qb2hnbXRkYXdrZ3duaGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDMxODYsImV4cCI6MjEwMjYxOTE4Nn0.DphbUJBUFQv2KcOyPu4kWjVf0cRiAR2CI2MEWJ6n7nQ';
begin
  perform net.http_post(
    url := v_project_url || '/functions/v1/cleanup-old-session-media',
    headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_anon_key, 'Authorization', 'Bearer ' || v_anon_key),
    body := '{}'::jsonb
  );
end;
$$;

revoke execute on function public.trigger_session_media_cleanup() from public;

-- Her gün Türkiye saatiyle 10:40'da (UTC 07:40) — diğer günlük cron
-- görevleriyle aynı pencerede, çakışmasın diye kaydırılmış.
select cron.schedule('cleanup-old-session-media-daily', '40 7 * * *', $$select public.trigger_session_media_cleanup();$$);
