-- Güvenlik denetiminde bulundu: notifications_insert_club politikası
-- sadece INSERT edenin KENDİ club_id'sinin current_club_id() ile eşleştiğini
-- kontrol ediyordu — recipient_user_id'nin o kulüple (ya da inserter'la)
-- herhangi bir ilişkisi hiç doğrulanmıyordu. Sonuç: bir veli, kendi
-- kulübündeki (ya da club_id alanını doğru doldurduğu sürece TEORİDE
-- herhangi bir kullanıcıya) tamamen alakasız bir antrenöre/kullanıcıya
-- sahte başlık/içerikli bir "bildirim" gönderebiliyordu — bir tür
-- kimlik sahteciliği/sosyal mühendislik açığı. Test kulübündeki bir veli
-- hesabıyla canlıda doğrulandı: alakasız bir antrenöre "SAHTE UYARI"
-- başlıklı sahte bir bildirim başarıyla teslim edildi, temizlendi.
--
-- Düzeltme: normal (süper admin olmayan) gönderenler için artık
-- recipient_user_id'nin ya (a) gönderenle AYNI kulüpte olması, ya da
-- (b) süper admin olması (club_admin'in hesap silme talebini süper admine
-- iletmesi gibi meşru akışlar için) gerekiyor. Süper admin hâlâ
-- kısıtlamasız (platform geneli duyurular için kasıtlı).

drop policy if exists notifications_insert_club on public.notifications;
create policy notifications_insert_club on public.notifications
  for insert
  with check (
    is_super_admin()
    or (
      club_id = current_club_id()
      and exists (
        select 1 from users u
        where u.id = recipient_user_id
        and (u.club_id = current_club_id() or u.role = 'super_admin')
      )
    )
  );
