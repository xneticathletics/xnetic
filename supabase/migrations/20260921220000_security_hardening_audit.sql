-- Yayın öncesi güvenlik taraması (2026-09-21) bulgularının düzeltmeleri.

-- ============================================================
-- 1) custom_access_token_hook'u sıradan kullanıcılar çağıramasın.
-- Bulgu: `authenticated` rolü hook'u çağırabiliyordu; giriş yapmış HERHANGİ
-- bir kullanıcı, parametreye başka birinin auth id'sini yazarak o kişinin
-- app_role ve club_id bilgisini öğrenebiliyordu (kulüpler arası bilgi
-- sızıntısı). Supabase'in kendi önerdiği yapılandırma: hook'u yalnızca
-- supabase_auth_admin çalıştırabilir.
-- DİKKAT: supabase_auth_admin'in yetkisi KORUNMALI — aksi halde giriş
-- tamamen bozulur (bkz. CLAUDE.md'deki Auth Hook notu).
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- ============================================================
-- 2) platform_settings'in banka bilgileri anonim okumaya kapatılsın.
-- Bulgu: platform_settings politikası `true` (herkese açık) ve tablo anon'a
-- SELECT yetkili; böylece anon anahtarını bilen herkes (anahtar uygulamanın
-- içinde ve web sitesinde açıkta) platformun IBAN'ını okuyabiliyordu.
-- Web sitesinin (girişsiz) ihtiyacı yalnızca destek iletişimi ve bakım modu;
-- banka alanları sadece giriş yapmış kullanıcıya açık kalıyor.
revoke select on public.platform_settings from anon;
grant select (id, support_email, support_phone, maintenance_mode, maintenance_message,
              monthly_price_try, yearly_price_try, updated_at)
  on public.platform_settings to anon;

-- ============================================================
-- 3) groups sütun kilidi: NULL'da açık kalma (fail-open) düzeltmesi.
-- Bulgu: `if not public.is_admin_tier()` — is_admin_tier() NULL dönerse
-- (app_role claim'i yoksa) `not NULL` = NULL olur, dal hiç çalışmaz ve TÜM
-- sütun kilitleri atlanır. Diğer kilit tetikleyicileri coalesce(...) ile
-- yazılmış, bu biri atlanmış. Bugün sömürülebilir değil (RLS politikası
-- club_id claim'i olmadan zaten geçilemiyor) ama desen kırılgan.
create or replace function public.groups_lock_non_coordinator_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.role() = 'authenticated' and not coalesce(public.is_admin_tier(), false) then
    new.club_id := old.club_id;
    new.branch := old.branch;
    if not coalesce(public.is_my_coordinated_group(old.id), false) then
      new.name := old.name;
      new.venue_id := old.venue_id;
      new.athlete_type := old.athlete_type;
      new.fixed_schedule := old.fixed_schedule;
    end if;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
revoke all on function public.groups_lock_non_coordinator_columns() from public, anon, authenticated;
