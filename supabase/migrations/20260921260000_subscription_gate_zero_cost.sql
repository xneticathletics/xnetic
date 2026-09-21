-- PERFORMANS — abonelik kapısının maliyeti sıfıra indiriliyor.
--
-- 20260921250000 kapıyı JWT'ye taşıdı ama current_club_id() İKİ claim
-- okuyordu (sub_blocked + club_id), yani auth.jwt() iki kez ayrıştırılıyordu:
-- users sorgusunda 62.8ms yerine 76.2ms (~13ms fazla). ~200 politikanın
-- sıcak yolu olduğu için bu bile gereksiz.
--
-- Çözüm: kapıyı claim'in KENDİSİNE uygula — engelli yöneticinin token'ına
-- club_id doğrudan NULL yazılıyor. Böylece current_club_id() ilk günkü
-- haline, TEK claim okuyan saf fonksiyona dönüyor (maliyet = 0) ve kapı
-- yine tam olarak çalışıyor.
--
-- Bekleme ekranının (kulüp adı/IBAN, abonelik durumu, "Ödedim" bildirimi)
-- ve 54 tablodaki kiracı tetikleyicisinin gerçek kulüp kimliğine ihtiyacı
-- var; onlar için ayrı bir club_id_raw claim'i yazılıyor. Bu claim sadece
-- 3 politika + 1 tetikleyicide okunuyor, sıcak yolda değil.

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
    if app_user.role = 'club_admin' and app_user.club_id is not null then
      select coalesce(s.status in ('pending_review', 'past_due', 'cancelled'), false)
        into v_blocked
        from public.club_subscriptions s
       where s.club_id = app_user.club_id
       order by s.created_at desc
       limit 1;
      v_blocked := coalesce(v_blocked, false);
    end if;

    -- Sıcak yol: engelliyse club_id'nin KENDİSİ null.
    claims := jsonb_set(claims, '{club_id}',
      case when v_blocked then 'null'::jsonb else coalesce(to_jsonb(app_user.club_id), 'null'::jsonb) end);
    -- Soğuk yol: bekleme ekranı ve kiracı tetikleyicisi için gerçek kimlik.
    claims := jsonb_set(claims, '{club_id_raw}', coalesce(to_jsonb(app_user.club_id), 'null'::jsonb));
    claims := jsonb_set(claims, '{app_role}', coalesce(to_jsonb(app_user.role), 'null'::jsonb));
    claims := jsonb_set(claims, '{sub_blocked}', to_jsonb(v_blocked));
  else
    claims := jsonb_set(claims, '{club_id}', 'null'::jsonb);
    claims := jsonb_set(claims, '{club_id_raw}', 'null'::jsonb);
    claims := jsonb_set(claims, '{app_role}', 'null'::jsonb);
    claims := jsonb_set(claims, '{sub_blocked}', 'false'::jsonb);
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- Sıcak yol: ilk günkü saf hali (tek claim, gömülebilir, maliyet yok).
create or replace function public.current_club_id()
returns uuid
language sql stable
set search_path = public
as $$
  select nullif(auth.jwt() ->> 'club_id', '')::uuid;
$$;

-- Soğuk yol. coalesce: bu göç anında zaten açık olan oturumların
-- token'ında club_id_raw YOK — onlar için eski club_id claim'ine düşer,
-- böylece token yenilenene kadar hiçbir şey bozulmaz.
create or replace function public.current_club_id_raw()
returns uuid
language sql stable
set search_path = public
as $$
  select nullif(coalesce(auth.jwt() ->> 'club_id_raw', auth.jwt() ->> 'club_id'), '')::uuid;
$$;

create or replace function public.club_access_blocked()
returns boolean
language sql stable
set search_path = public
as $$
  select coalesce((auth.jwt() ->> 'sub_blocked')::boolean, false);
$$;
revoke all on function public.club_access_blocked() from public, anon;
grant execute on function public.club_access_blocked() to authenticated;
