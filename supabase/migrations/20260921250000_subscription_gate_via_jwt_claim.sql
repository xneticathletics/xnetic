-- PERFORMANS DÜZELTMESİ — abonelik kapısı artık JWT claim'inden okunuyor.
--
-- Sorun: 20260921230000'de kapıyı current_club_id()'nin İÇİNE koymuştuk.
-- O fonksiyon ~200 RLS politikasında geçiyor ve eskiden saf bir JWT
-- okumasıydı; Postgres onu politika ifadesine satır içi gömebiliyordu.
-- club_access_blocked() SECURITY DEFINER olduğu için gömülemiyor ve her
-- değerlendirmede club_subscriptions'a gidiyordu. Ölçüm (60 sporcu, 130
-- kullanıcılık küçük demo kulüp):
--     users sorgusu   62ms -> 268ms  (4.3x)
--     athletes        11ms ->  17ms
--     branches       0.2ms -> 1.0ms  (5x)
-- Gerçek boyuttaki bir kulüpte bu saniyelere çıkıyor.
--
-- Çözüm: "engelli mi" bilgisini giriş anında JWT'ye bir claim olarak
-- yazıyoruz. current_club_id() yine SAF bir claim okuması oluyor (tablo
-- erişimi yok, gömülebilir) — kapı duruyor, maliyet sıfıra dönüyor.
--
-- Claim bayatlığı: token yenilenene kadar (Supabase ~1 saat) eski değer
-- taşınır. Süper admin bir kulübü onayladığında yöneticinin beklememesi
-- için istemci, durum "active"e döndüğü anda supabase.auth.refreshSession()
-- çağırıp taze token alıyor (bkz. SubscriptionPendingScreen /
-- SubscriptionPendingPage).

-- 1) Hook'a sub_blocked claim'i eklenir.
-- DİKKAT: Bu fonksiyon bozulursa TÜM girişler bozulur. Mevcut mantık
-- aynen korundu, yalnızca tek bir claim eklendi.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  claims jsonb;
  app_user record;
  v_blocked boolean := false;
begin
  select u.club_id, u.role, u.is_active
    into app_user
    from public.users u
    where u.auth_user_id = (event->>'user_id')::uuid;

  claims := event -> 'claims';

  -- "app_user is not null" KULLANMA — record'un IS NOT NULL testi tüm
  -- alanların dolu olmasını ister; club_id'si NULL olan super_admin'de
  -- sessizce FALSE döner. Doğrusu FOUND.
  if found and app_user.is_active then
    -- Abonelik kapısı: yalnızca club_admin için ve yalnızca kulübün EN SON
    -- abonelik kaydı engelli durumdaysa. Kayıt yoksa (eski kulüpler)
    -- kapatmaz — güvenli taraf.
    if app_user.role = 'club_admin' and app_user.club_id is not null then
      select coalesce(s.status in ('pending_review', 'past_due', 'cancelled'), false)
        into v_blocked
        from public.club_subscriptions s
       where s.club_id = app_user.club_id
       order by s.created_at desc
       limit 1;
      v_blocked := coalesce(v_blocked, false);
    end if;

    claims := jsonb_set(claims, '{club_id}', coalesce(to_jsonb(app_user.club_id), 'null'::jsonb));
    claims := jsonb_set(claims, '{app_role}', coalesce(to_jsonb(app_user.role), 'null'::jsonb));
    claims := jsonb_set(claims, '{sub_blocked}', to_jsonb(v_blocked));
  else
    claims := jsonb_set(claims, '{club_id}', 'null'::jsonb);
    claims := jsonb_set(claims, '{app_role}', 'null'::jsonb);
    claims := jsonb_set(claims, '{sub_blocked}', 'false'::jsonb);
  end if;

  -- Standart "role" claim'ine dokunulmuyor (PostgREST'in bağlantı rolü).
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- 2) current_club_id() yine SAF claim okuması — tablo erişimi yok.
create or replace function public.current_club_id()
returns uuid
language sql stable
set search_path = public
as $$
  select case
    when coalesce((auth.jwt() ->> 'sub_blocked')::boolean, false) then null
    else nullif(auth.jwt() ->> 'club_id', '')::uuid
  end;
$$;

-- 3) club_access_blocked() artık claim'i okuyor (RPC/istemci tarafı için
-- korunuyor, ama artık pahalı değil).
create or replace function public.club_access_blocked()
returns boolean
language sql stable
set search_path = public
as $$
  select coalesce((auth.jwt() ->> 'sub_blocked')::boolean, false);
$$;
revoke all on function public.club_access_blocked() from public, anon;
grant execute on function public.club_access_blocked() to authenticated;
