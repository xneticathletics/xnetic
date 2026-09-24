-- Şifre sıfırlama talebi: e-posta linki akışı uygulamadan kaldırıldı, tek
-- yol artık "talep yöneticiye bildirim olarak gider, yönetici geçici şifre
-- üretip kişiye iletir" (kullanıcı isteği).
--
-- Eşleşme kuralı da genişledi: KULLANICI ADI ya da TELEFON'dan biri
-- tutuyorsa talep iletiliyor — girilen bilginin kişinin giriş yaparken
-- KULLANDIĞI bilgi olması gerekmiyor. Örn. kullanıcı adıyla giriş yapan
-- biri telefonunu yazarsa da (profilindeki numarayla aynıysa) talep gider.
--
-- Eskiden bu eşleştirme edge function'ın içindeydi ve yalnızca
-- users.email = resolveLoginEmail(girdi) karşılaştırması yapıyordu.
-- Buraya taşındı çünkü telefon karşılaştırması rakam normalizasyonu
-- gerektiriyor (profildeki numara "0532-212-12-12" gibi biçimli olabiliyor)
-- ve bu PostgREST filtreleriyle yazılamıyor.

-- Telefon numarasını karşılaştırılabilir hâle getirir: sadece rakamlar,
-- ülke kodu (+90/90) yerel "0..." biçimine çevrilir, 11 haneye kırpılır.
-- src/lib/phoneFormat.ts ve invite-user/index.ts'teki extractPhoneDigits
-- ile birebir aynı kural (kasıtlı kopya — ayrı çalışma ortamları).
create or replace function public.normalize_phone_digits(p_raw text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when d = '' then null
    when length(d) = 12 and left(d, 2) = '90' then left('0' || substr(d, 3), 11)
    when left(d, 1) <> '0' then left('0' || d, 11)
    else left(d, 11)
  end
  from (select regexp_replace(coalesce(p_raw, ''), '\D', '', 'g') as d) t;
$$;

create or replace function public.request_password_reset_notice(p_identifier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_raw text := btrim(coalesce(p_identifier, ''));
  v_digits text;          -- girilen bilgi telefonsa normalize edilmiş rakamlar
  v_phone_email text;     -- tel<rakamlar>@xnetic.local (telefonla giriş yapanlar)
  v_login_email text;     -- usr<kullanıcıadı>@xnetic.local ya da gerçek e-posta
  v_username text;
  v_club_name text;
  r_user record;
  r_admin record;
begin
  if v_raw = '' then return; end if;

  -- En az 9 rakam varsa telefon kabul edilir — istemcideki
  -- resolveLoginEmail ile aynı eşik.
  if length(regexp_replace(v_raw, '\D', '', 'g')) >= 9 then
    v_digits := public.normalize_phone_digits(v_raw);
    if v_digits is not null then
      v_phone_email := 'tel' || v_digits || '@xnetic.local';
    end if;
  end if;

  if position('@' in v_raw) > 0 then
    -- Kulüp yöneticileri web'den GERÇEK e-postayla kaydoluyor; giriş
    -- ekranı artık e-postadan söz etmese de bu hesapların kurtarma yolu
    -- kapanmasın diye e-posta eşleşmesi korunuyor.
    v_login_email := lower(v_raw);
  else
    v_username := lower(regexp_replace(v_raw, '[^a-zA-Z0-9]', '', 'g'));
    if v_username <> '' then
      v_login_email := 'usr' || v_username || '@xnetic.local';
    end if;
  end if;

  -- Aynı numara birden fazla hesapta olabiliyor (ör. veli ile sporcunun
  -- profilinde aynı telefon) — yöneticinin kimi sıfırlayacağını görmesi
  -- için eşleşen her hesap ayrı bir talep olarak iletiliyor, en fazla 3.
  for r_user in
    select u.id, u.name, u.club_id, u.role
    from users u
    where u.is_active
      and (
        (v_login_email is not null and lower(u.email) = v_login_email)
        or (v_phone_email is not null and lower(u.email) = v_phone_email)
        or (v_digits is not null and public.normalize_phone_digits(u.phone) = v_digits)
      )
    order by u.created_at
    limit 3
  loop
    if r_user.role = 'club_admin' then
      -- Yöneticinin KENDİ talebini ancak süper admin karşılayabilir
      -- (bkz. admin-reset-user-password: super_admin yalnızca club_admin
      -- şifresi sıfırlayabiliyor). E-posta akışı kaldırıldığı için
      -- yöneticinin başka kurtarma yolu kalmıyordu.
      select c.name into v_club_name from clubs c where c.id = r_user.club_id;
      for r_admin in
        select u.id from users u where u.role = 'super_admin' and u.is_active
      loop
        perform public.notify_internal(
          r_admin.id, r_user.club_id,
          'Şifre Sıfırlama Talebi',
          concat(coalesce(v_club_name, 'Bir kulüp'), ' kulübünün yöneticisi ', r_user.name,
                 ' (', left(v_raw, 40), ') şifresini sıfırlamanı istiyor.'),
          'password_reset_request',
          jsonb_build_object('requesterId', r_user.id, 'requesterName', r_user.name, 'identifier', left(v_raw, 40))
        );
      end loop;
    else
      for r_admin in
        select u.id from users u
        where u.club_id = r_user.club_id and u.role = 'club_admin' and u.is_active and u.id <> r_user.id
      loop
        perform public.notify_internal(
          r_admin.id, r_user.club_id,
          'Şifre Sıfırlama Talebi',
          concat(r_user.name, ' (', left(v_raw, 40), ') şifresini sıfırlamanı istiyor. ',
                 'Kullanıcılar ekranından yeni bir geçici şifre üretebilirsin.'),
          'password_reset_request',
          jsonb_build_object('requesterId', r_user.id, 'requesterName', r_user.name, 'identifier', left(v_raw, 40))
        );
      end loop;
    end if;
  end loop;
end;
$$;

-- İstemciye KAPALI: hız sınırı edge function'da (request-password-reset-notice)
-- olduğu için doğrudan çağrılabilseydi bot'lar yöneticilere sınırsız sahte
-- talep bildirimi yağdırabilirdi.
revoke all on function public.request_password_reset_notice(text) from public, anon, authenticated;
grant execute on function public.request_password_reset_notice(text) to service_role;
