-- Branş koordinatörü bir duyuru yayınlayıp kaydediyordu (RLS'e göre
-- yetkisi tam), ama sonra KENDİ Duyurular listesinde hiç göremiyordu —
-- "yayınla" hatasız geçtiği için sanki hiç kaydedilmemiş gibi görünüyordu
-- (2026-09-25, kullanıcı canlıda yaşadı). Kulüp yöneticisi ise HER duyuruyu
-- görüyor (filterAnnouncementsForViewer'da club_admin/super_admin için
-- filtre tamamen bypass ediliyor) — asimetri buradan geliyordu.
--
-- Kök neden: "group" hedefli bir duyurunun target_user_ids'i SADECE o
-- gruptaki sporcu/veli hesaplarından oluşuyor (bkz.
-- getGroupAnnouncementRecipients — antrenör/koordinatör hiç eklenmiyor,
-- kasıtlı: bu duyurular sporcu/veliye hitap ediyor). Koordinatör bir "coach"
-- olduğu için target_user_ids listesinde asla yer almıyor, dolayısıyla
-- kendi gönderdiği duyuru client-side görünürlük filtresinden (bkz.
-- filterAnnouncementsForViewer) HER ZAMAN elenip kendine bile görünmüyordu.
--
-- Çözüm: kim yayınladıysa (author_id) o kişi kendi duyurusunu HER ZAMAN
-- görsün — hedef kitlenin parçası olması gerekmez, tıpkı admin'in tüm
-- duyuruları görmesi gibi. author_id sütunu zaten vardı ama hiç
-- doldurulmuyordu (NULL); artık set_club_id_from_jwt ile aynı desende
-- otomatik dolduruluyor, istemci taraf değişikliği gerekmiyor.
create or replace function public.set_announcement_author_from_jwt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.author_id is null then
    new.author_id := public.my_user_id();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_announcement_author on public.announcements;
create trigger trg_set_announcement_author
  before insert on public.announcements
  for each row execute function public.set_announcement_author_from_jwt();
