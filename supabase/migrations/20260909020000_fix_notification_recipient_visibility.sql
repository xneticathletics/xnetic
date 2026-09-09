-- KRİTİK, GENİŞ ETKİLİ BUG: notifications_insert_club politikası,
-- alıcının GERÇEKTEN var olup olmadığını "exists (select 1 from users u
-- where u.id = recipient_user_id and ...)" ile kontrol ediyordu — ama bu
-- alt sorgu GÖNDERENİN KENDİ users SELECT RLS görünürlüğüne tabi! Yani
-- gönderen, alıcının satırını (users tablosunda) GÖREMİYORSA, bu exists
-- sessizce FALSE dönüyor ve bildirim INSERT'i RLS tarafından reddediliyor.
--
-- Canlıda doğrulandı: bir velinin, kendi sporcusunun DOĞRUDAN koçu
-- OLMAYAN bir branş koordinatörüne (ör. notifyPaymentClaim/
-- notifyRegistrationSubmitted akışlarında olduğu gibi) bildirim
-- göndermesi bugüne kadar RLS tarafından reddediliyordu — ve
-- sendNotification() her zaman .catch(()=>{}) ile hatayı yuttuğu için bu
-- HİÇ fark edilmemişti. Yani aidat "Ödeme Bildirimi" ve etkinlik "Kayıt
-- Bildirimi" gibi admin+koordinatöre giden bildirimler, veli çocuğunun
-- doğrudan koçu olmayan bir koordinatöre denk geldiğinde SESSİZCE hiç
-- ulaşmıyordu.
--
-- Kök düzeltme: "alıcı gerçekten bu kulüpte var mı" kontrolünü SECURITY
-- DEFINER bir fonksiyona taşıyoruz — böylece gönderenin users tablosundaki
-- ALAKASIZ görünürlük kısıtlamalarından etkilenmiyor. Politikanın asıl
-- niyeti zaten hep buydu: "aynı kulüpteki HERKESE bildirim gönderebilirsin"
-- — belirli bir ilişkiye (koçu olması gibi) bağlı değildi.
create or replace function public.is_valid_notification_recipient(p_recipient_id uuid)
returns boolean
language plpgsql
stable security definer
set search_path to 'public'
as $$
begin
  return exists (
    select 1 from users u
    where u.id = p_recipient_id
    and (u.club_id = current_club_id() or u.role = 'super_admin')
  );
end;
$$;

revoke execute on function public.is_valid_notification_recipient(uuid) from public;
grant execute on function public.is_valid_notification_recipient(uuid) to authenticated;

drop policy if exists "notifications_insert_club" on public.notifications;
create policy "notifications_insert_club" on public.notifications
  for insert to authenticated
  with check (
    public.is_super_admin()
    or (club_id = public.current_club_id() and public.is_valid_notification_recipient(recipient_user_id))
  );
