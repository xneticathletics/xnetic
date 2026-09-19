-- Kapsamlı güvenlik taraması (2026-09-19) bulguları. Canlıda gerçek rollerle
-- (veli, sporcu, antrenör, koordinatör, kulüp admini, anon) yapılan
-- denemelerle doğrulandı; her madde aşağıda gerekçesiyle.

-- =====================================================================
-- 1) FONKSİYON YETKİLERİ
-- anon (giriş yapmamış herkes) ve authenticated, cron'a özel fonksiyonları
-- /rest/v1/rpc üzerinden ÇAĞIRABİLİYORDU: send_payment_reminders(),
-- send_birthday_notifications(), send_event_reminders(),
-- send_wellness_reminders(), process_subscription_renewals(),
-- trigger_*_cleanup(). Kimlik doğrulamasız biri tüm kulüplere spam bildirim
-- gönderebilir / abonelik yenileme işini tetikleyebilirdi. Ayrıca
-- count_*() ve badge_tier_thresholds() herhangi bir kullanıcı/sporcu id'si
-- için (başka kulüpler dahil) sayı döndürüyordu.
-- =====================================================================
grant execute on all functions in schema public to authenticated, service_role;

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;

-- Sadece pg_cron (postgres) çalıştırır.
revoke execute on function public.process_subscription_renewals() from authenticated, service_role;
revoke execute on function public.send_birthday_notifications() from authenticated, service_role;
revoke execute on function public.send_event_reminders() from authenticated, service_role;
revoke execute on function public.send_payment_reminders() from authenticated, service_role;
revoke execute on function public.send_wellness_reminders() from authenticated, service_role;
revoke execute on function public.trigger_announcements_cleanup() from authenticated, service_role;
revoke execute on function public.trigger_social_posts_cleanup() from authenticated, service_role;

-- Sadece check_my_badges() (security definer) içeriden çağırır.
revoke execute on function public.count_antrenman_serisi(uuid) from authenticated, service_role;
revoke execute on function public.count_grup_fitness(uuid) from authenticated, service_role;
revoke execute on function public.count_bireysel_fitness(uuid) from authenticated, service_role;
revoke execute on function public.count_kulup_kidem_years(uuid) from authenticated, service_role;
revoke execute on function public.count_sosyal_paylasim(uuid) from authenticated, service_role;
revoke execute on function public.count_magaza_alisverisi(uuid) from authenticated, service_role;
revoke execute on function public.count_mesajlasma(uuid) from authenticated, service_role;
revoke execute on function public.badge_tier_thresholds(uuid, text) from authenticated, service_role;

-- =====================================================================
-- 2) CRON FONKSİYONLARI ESKİ (TOKYO) PROJEYİ ÇAĞIRIYORDU
-- Tokyo->Frankfurt geçişinde bu fonksiyonlardaki proje URL'si ve anon key
-- güncellenmedi: doğum günü/aidat/etkinlik/wellness push'ları ve
-- duyuru/sosyal paylaşım temizliği ESKİ projeye gidiyordu.
-- =====================================================================
do $repoint$
declare
  r record;
  v_def text;
begin
  for r in
    select p.oid
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'process_subscription_renewals', 'send_birthday_notifications', 'send_event_reminders',
        'send_payment_reminders', 'send_wellness_reminders',
        'trigger_announcements_cleanup', 'trigger_social_posts_cleanup'
      )
  loop
    v_def := pg_get_functiondef(r.oid);
    v_def := replace(v_def, 'dfinjohgmtdawkgwnhfj', 'wzyyjilodsrwwqdjiqam');
    v_def := regexp_replace(v_def, 'v_anon_key text := ''[^'']*''', 'v_anon_key text := ''eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6eXlqaWxvZHNyd3dxZGppcWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTkwNDEsImV4cCI6MjEwNTA3NTA0MX0.Mdj3UIk1hMHi_MhITU84I99KZZ7Uj_c-abQIak9Kyu0''');
    execute v_def;
  end loop;
end $repoint$;

-- =====================================================================
-- 3) BİLDİRİM SAHTECİLİĞİ
-- notifications_insert_club, kulüpteki HERKESE (veli/sporcu dahil) başka
-- bir kullanıcıya (admin dahil) İSTEDİĞİ başlık/gövde/event_type/payload
-- ile bildirim (ve push) gönderme izni veriyordu: sahte "şifre sıfırlama"
-- / "hesap silme" / duyuru bildirimi, payload.attachmentUrl ile kimlik
-- avı linki. Artık veli/sporcu sadece meşru, ilgili yönetici/antrenöre
-- giden tiplerde gönderebilir.
-- =====================================================================
create or replace function public.can_send_notification(p_recipient uuid, p_event_type text, p_payload jsonb)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_role text := current_user_role();
  v_r_club uuid;
  v_r_role text;
begin
  select u.club_id, u.role::text into v_r_club, v_r_role from users u where u.id = p_recipient;
  if v_r_role is null then
    return false;
  end if;

  if v_role in ('club_admin', 'coach') then
    return v_r_club = current_club_id() or v_r_role = 'super_admin';
  elsif v_role in ('parent', 'athlete') then
    return v_r_club = current_club_id()
      and v_r_role in ('club_admin', 'coach')
      and coalesce(p_event_type, '') in (
        'payment_claim', 'session_excuse', 'membership_freeze',
        'event_registration_submitted', 'account_deletion_request'
      )
      and (p_payload is null or not (p_payload ? 'attachmentUrl'));
  end if;
  return false;
end;
$$;
grant execute on function public.can_send_notification(uuid, text, jsonb) to authenticated, service_role;

drop policy if exists notifications_insert_club on public.notifications;
create policy notifications_insert_club on public.notifications for insert to authenticated
  with check (
    is_super_admin()
    or (club_id = current_club_id() and public.can_send_notification(recipient_user_id, event_type, payload))
  );

-- =====================================================================
-- 4) MAĞAZA SİPARİŞİ: DOĞRUDAN INSERT
-- shop_orders_own_insert, veliye tabloya doğrudan satır ekleme izni
-- veriyordu: fiyat (unit_price/total_price) ve status istemciden geliyordu
-- (ücretsiz/"delivered" sipariş, stok düşmeden). Uygulama zaten
-- create_shop_order RPC'sini kullanıyor (fiyatı/stoğu sunucuda hesaplar).
-- =====================================================================
drop policy if exists shop_orders_own_insert on public.shop_orders;

-- =====================================================================
-- 5) GLOBAL KÜTÜPHANE İÇERİĞİ (club_id NULL) DEĞİŞTİRİLEBİLİYORDU
-- Antrenör/koordinatör/kulüp admini, TÜM kulüplerin ortak kullandığı global
-- test (52), egzersiz (156), besin (97) ve tarif (34) satırlarını
-- güncelleyebiliyordu (içerik/video linki bozma). Artık sadece süper admin.
-- =====================================================================
drop policy if exists fitness_exercises_update on public.fitness_exercises;
create policy fitness_exercises_update on public.fitness_exercises for update
  using ((club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator())) or (club_id is null and is_super_admin()))
  with check ((club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator())) or (club_id is null and is_super_admin()));

drop policy if exists nutrition_foods_update on public.nutrition_foods;
create policy nutrition_foods_update on public.nutrition_foods for update
  using ((club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator())) or (club_id is null and is_super_admin()))
  with check ((club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator())) or (club_id is null and is_super_admin()));

drop policy if exists nutrition_recipes_update on public.nutrition_recipes;
create policy nutrition_recipes_update on public.nutrition_recipes for update
  using ((club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator())) or (club_id is null and is_super_admin()))
  with check ((club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator())) or (club_id is null and is_super_admin()));

drop policy if exists performance_test_catalog_update on public.performance_test_catalog;
create policy performance_test_catalog_update on public.performance_test_catalog for update
  using ((club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator())) or (club_id is null and is_super_admin()))
  with check ((club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator())) or (club_id is null and is_super_admin()));

-- =====================================================================
-- 6) clubs: KULÜP ADMİNİ KENDİ KULÜBÜNÜ SİLEBİLİR / PLANINI DEĞİŞTİREBİLİRDİ
-- clubs_admin_write (ALL) kulüp adminine DELETE de veriyordu (sadece bir FK
-- kısıtı tesadüfen engelliyordu) ve plan (trial/starter/pro/enterprise)
-- sütununu kendisi değiştirebiliyordu.
-- =====================================================================
drop policy if exists clubs_admin_write on public.clubs;
create policy clubs_admin_update on public.clubs for update to authenticated
  using (is_super_admin() or (id = current_club_id() and is_admin_tier()))
  with check (is_super_admin() or (id = current_club_id() and is_admin_tier()));
create policy clubs_super_insert on public.clubs for insert to authenticated
  with check (is_super_admin());
create policy clubs_super_delete on public.clubs for delete to authenticated
  using (is_super_admin());

create or replace function public.clubs_lock_plan()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.role() = 'authenticated' and not coalesce(public.is_super_admin(), false) then
    new.plan := old.plan;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_clubs_lock_plan on public.clubs;
create trigger trg_clubs_lock_plan before update on public.clubs
  for each row execute function public.clubs_lock_plan();

-- =====================================================================
-- 7) SPORCU HESAP BAĞLANTILARI (parent_user_id / athlete_user_id)
-- Herhangi bir antrenör kendi sporcularının veli/sporcu hesap bağlantısını
-- değiştirebiliyordu (kendini veli olarak bağlama gibi). Sadece yönetici
-- ve branş koordinatörü (kendi branşındaki sporcular) değiştirebilir.
-- =====================================================================
create or replace function public.athletes_lock_link_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.role() = 'authenticated'
     and not coalesce(public.is_admin_tier(), false)
     and not coalesce(public.is_super_admin(), false)
     and not coalesce(public.is_my_coordinated_athlete(old.id), false)
     and (new.parent_user_id is distinct from old.parent_user_id
          or new.athlete_user_id is distinct from old.athlete_user_id)
  then
    raise exception 'Hesap bağlantısını sadece yönetici veya branş koordinatörü değiştirebilir.';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_athletes_lock_link_columns on public.athletes;
create trigger trg_athletes_lock_link_columns before update on public.athletes
  for each row execute function public.athletes_lock_link_columns();

-- =====================================================================
-- 8) KAYIT DONDURMA KULÜP AYARI SUNUCUDA DA ZORUNLU
-- Kulüp Kayıt Dondurma'yı kapatınca (Gelişmiş Ayarlar) arayüz gizleniyor
-- ama veli doğrudan tabloya satır ekleyerek atlatabilirdi.
-- =====================================================================
create or replace function public.membership_freezes_require_enabled()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_club uuid := coalesce(new.club_id, current_club_id());
  v_enabled boolean;
begin
  select coalesce((select cs.membership_freeze_enabled from club_settings cs where cs.club_id = v_club), true) into v_enabled;
  if not v_enabled and auth.role() = 'authenticated' then
    raise exception 'Bu kulüpte Kayıt Dondurma kapalı.';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_membership_freezes_require_enabled on public.membership_freezes;
create trigger trg_membership_freezes_require_enabled before insert on public.membership_freezes
  for each row execute function public.membership_freezes_require_enabled();

-- =====================================================================
-- 9) coach_branches: ONBOARDING'DE BAŞKA KULÜBÜN BRANŞINA BAĞLANMA
-- Onboarding'deki antrenör, branch_id için kulüp kontrolü olmadan satır
-- ekleyebiliyordu (başka bir kulübün branş id'si).
-- =====================================================================
drop policy if exists coach_branches_self_onboarding_write on public.coach_branches;
create policy coach_branches_self_onboarding_write on public.coach_branches for all to authenticated
  using (coach_id = my_user_id() and not my_onboarding_completed())
  with check (
    coach_id = my_user_id() and not my_onboarding_completed()
    and exists (select 1 from public.branches b where b.id = coach_branches.branch_id and b.club_id = current_club_id())
  );

-- =====================================================================
-- 10) DEPOLAMA (STORAGE)
-- public-pages: herhangi bir giriş yapmış kullanıcı, sınırsız boyut/tipte
-- dosyayı HERKESE AÇIK bir bucket'a yükleyebiliyordu (ücretsiz dosya
-- barındırma/kimlik avı). Kodda hiç kullanılmıyor — politika kaldırıldı.
-- social-posts: veli paylaşım yapamıyor ama 50 MB'a kadar dosya
-- yükleyebiliyordu — veli yükleyemez.
-- Tüm bucket'lara boyut/tür sınırı (HTML/script gibi tehlikeli tür
-- barındırmayı önler).
-- =====================================================================
drop policy if exists "Giriş yapan kullanıcılar public-pages'e yükleyebilir" on storage.objects;

drop policy if exists social_posts_storage_insert on storage.objects;
create policy social_posts_storage_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'social-posts'
    and (storage.foldername(name))[1] = (current_club_id())::text
    and (storage.foldername(name))[2] = (select (users.id)::text from public.users where users.auth_user_id = auth.uid())
    and current_user_role() <> 'parent'
  );

update storage.buckets set file_size_limit = 2097152,  allowed_mime_types = array['image/*'] where id = 'club-logos';
update storage.buckets set file_size_limit = 5242880,  allowed_mime_types = array['image/*'] where id = 'athlete-photos';
update storage.buckets set file_size_limit = 5242880,  allowed_mime_types = array['image/*'] where id = 'user-photos';
update storage.buckets set file_size_limit = 8388608,  allowed_mime_types = array['image/*'] where id = 'shop-photos';
update storage.buckets set file_size_limit = 2097152,  allowed_mime_types = array['image/*'] where id = 'event-banners';
update storage.buckets set file_size_limit = 5242880,  allowed_mime_types = array['image/*', 'application/pdf'] where id = 'public-pages';
update storage.buckets set file_size_limit = 52428800 where id = 'session-media';
update storage.buckets set allowed_mime_types = array['video/*'] where id in ('fitness-exercise-videos', 'performance-test-videos');
update storage.buckets set allowed_mime_types = array['application/pdf'] where id = 'nutrition-pdfs';
