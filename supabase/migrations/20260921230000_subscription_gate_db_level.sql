-- Abonelik kapısını veritabanı seviyesine taşır.
--
-- Bulgu (2026-09-21 taraması): "pending_review"/"past_due"/"cancelled"
-- durumundaki bir kulüp yöneticisi yalnızca İSTEMCİDE durduruluyordu
-- (RootNavigator / ProtectedRoute). API'yi doğrudan çağıran biri kulübünün
-- tüm verisini kullanmaya devam edebiliyordu. Hiçbir RLS politikası abonelik
-- durumuna bakmıyordu.
--
-- Yaklaşım: kapıyı TEK noktaya koyuyoruz — current_club_id(). Bu fonksiyon
-- ~200 politikanın içinde geçtiği için, engelli bir yöneticide NULL dönmesi
-- kulübe ait her sorguyu kapatır. İstemcideki davranışla BİREBİR aynı olsun
-- diye kapı yalnızca club_admin'e uygulanır (antrenör/veli/sporcu etkilenmez).
--
-- İstisna: "bekleme ekranının" kendisi çalışmaya devam etmeli — yönetici
-- kulüp adını/banka bilgisini görebilmeli, abonelik durumunu okuyabilmeli ve
-- "Ödedim" bildirimini gönderebilmeli. Bu üç politika ham JWT claim'ini
-- (current_club_id_raw) kullanacak şekilde ayrıldı.

-- Ham claim — kapıdan etkilenmez.
create or replace function public.current_club_id_raw()
returns uuid
language sql stable
set search_path = public
as $$
  select nullif(auth.jwt() ->> 'club_id', '')::uuid;
$$;

-- Kulübün erişimi kapalı mı? Güvenli tarafta hata verir: abonelik kaydı
-- yoksa (eski kulüpler) ya da durum tanınmıyorsa KAPATMAZ — bu bir gelir
-- kontrolü, güvenlik sınırı değil; yanlış pozitif bir kilit gerçek bir
-- kulübü kilitlemekten daha kötü.
create or replace function public.club_access_blocked()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (
      select s.status in ('pending_review', 'past_due', 'cancelled')
      from public.club_subscriptions s
      where s.club_id = public.current_club_id_raw()
      order by s.created_at desc
      limit 1
    ) and public.current_user_role() = 'club_admin',
    false
  );
$$;
revoke all on function public.club_access_blocked() from public, anon;
grant execute on function public.club_access_blocked() to authenticated;

-- Kapının kendisi.
create or replace function public.current_club_id()
returns uuid
language sql stable
set search_path = public
as $$
  select case when public.club_access_blocked() then null else public.current_club_id_raw() end;
$$;

-- --- Bekleme ekranının ihtiyaç duyduğu üç yol ham claim'e geçiriliyor ---

-- 1) Kulüp bilgisi (ad, IBAN, banka açıklaması) — ödeme yapabilmek için şart.
drop policy if exists clubs_select_all on public.clubs;
create policy clubs_select_all on public.clubs
  for select to authenticated
  using (is_super_admin() or id = public.current_club_id_raw());

-- 2) Abonelik durumu — hangi ekranın gösterileceğini belirliyor.
drop policy if exists club_subscriptions_club_admin_read on public.club_subscriptions;
create policy club_subscriptions_club_admin_read on public.club_subscriptions
  for select to authenticated
  using (club_id = public.current_club_id_raw());

-- 3) "Ödedim, Bildir" bildirimi süper admine gidebilmeli.
drop policy if exists notifications_insert_club on public.notifications;
create policy notifications_insert_club on public.notifications
  for insert to authenticated
  with check (
    is_super_admin()
    or (club_id = public.current_club_id_raw() and can_send_notification(recipient_user_id, event_type, payload))
  );

-- 4) Kiracı bütünlüğü tetikleyicisi (54 tabloda) ham claim kullanmalı.
-- Bu tetikleyicinin işi "başka kulübe satır yazılmasın" — abonelik kapısı
-- DEĞİL. current_club_id() artık engelli yöneticide NULL döndüğü için bu
-- tetikleyici "club_id uyuşmuyor" hatasıyla, bekleme ekranındaki "Ödedim,
-- Bildir" bildirimini de engelliyordu. Kapıyı RLS politikaları zaten
-- uyguluyor (engelli yöneticide her club_id = current_club_id() şartı
-- düşüyor); burada kimlik kontrolü ham claim'le yapılıyor.
create or replace function public.set_club_id_from_jwt()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.club_id is null then
    new.club_id := public.current_club_id_raw();
  elsif new.club_id is distinct from public.current_club_id_raw() and not is_super_admin() then
    raise exception 'club_id uyuşmuyor: başka bir kulübe kayıt eklenemez';
  end if;
  return new;
end;
$$;
