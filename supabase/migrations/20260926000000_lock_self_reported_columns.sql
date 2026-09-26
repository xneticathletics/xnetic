-- Güvenlik taraması (2026-09-26): session_excuses/session_rpe/wellness_checkins
-- "own_update" politikaları (is_my_athlete(athlete_id)) WITH CHECK içermiyor
-- — Postgres'te bu, USING'in with_check yerine de kullanılması demek, ama
-- USING sadece "bu satır bana mı ait" diye bakıyor, HANGİ sütunun
-- değiştiğini kısıtlamıyor. Uygulama her zaman upsert ile sadece kendi
-- veri sütununu (reason/rpe/sleep_hours vb.) gönderse de, RLS bunu
-- ZORUNLU kılmıyor: doğrudan bir REST çağrısıyla veli/sporcu kendi
-- kaydının club_id/athlete_id/session_id/checkin_date gibi kimlik
-- sütunlarını değiştirebilirdi (ör. bir mazereti başka bir antrenmana
-- taşımak, ya da club_id'yi current_club_id() ile eşleşen başka bir
-- değere "kaydırmak" — USING her iki tarafta da tekrar kontrol edildiği
-- için başka bir sporcuya/kulübe SIZMA yok, ama kendi kaydını yanlış
-- yere iliştirebilirdi). messages tablosunda AYNI sınıf sorun zaten
-- messages_lock_content_on_update ile çözülmüştü (bkz. trg_messages_lock_
-- content_on_update) — buradaki üç tablo o düzeltmenin kapsamına
-- girmemiş. Admin (is_admin_tier()) bu kilitten muaf — gerektiğinde
-- düzeltme yapabilmeli.

create or replace function public.session_excuses_lock_identity_on_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(public.is_admin_tier(), false) then
    return new;
  end if;
  new.club_id := old.club_id;
  new.session_id := old.session_id;
  new.athlete_id := old.athlete_id;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists trg_session_excuses_lock_identity on public.session_excuses;
create trigger trg_session_excuses_lock_identity
  before update on public.session_excuses
  for each row execute function public.session_excuses_lock_identity_on_update();

create or replace function public.session_rpe_lock_identity_on_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(public.is_admin_tier(), false) then
    return new;
  end if;
  new.club_id := old.club_id;
  new.session_id := old.session_id;
  new.athlete_id := old.athlete_id;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists trg_session_rpe_lock_identity on public.session_rpe;
create trigger trg_session_rpe_lock_identity
  before update on public.session_rpe
  for each row execute function public.session_rpe_lock_identity_on_update();

create or replace function public.wellness_checkins_lock_identity_on_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(public.is_admin_tier(), false) then
    return new;
  end if;
  new.club_id := old.club_id;
  new.athlete_id := old.athlete_id;
  new.checkin_date := old.checkin_date;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists trg_wellness_checkins_lock_identity on public.wellness_checkins;
create trigger trg_wellness_checkins_lock_identity
  before update on public.wellness_checkins
  for each row execute function public.wellness_checkins_lock_identity_on_update();
