-- Bugün eklenen "Hesabımı Sil" özelliğinin (requestAccountDeletion)
-- club_admin → süper admin dalı, gönderilecek bildirimin alıcısını bulmak
-- için "select id from users where role='super_admin'" sorgusu yapıyor.
-- Test ederken fark edildi: club_admin'in süper adminin satırını görmesine
-- izin veren HİÇBİR RLS politikası yoktu (mevcut politikalar ya kendi
-- satırını, ya aynı kulüpteki club_admin'i, ya da SÜPER ADMİN'İN diğer
-- club_admin'leri görmesini kapsıyordu — tersi yoktu). Sonuç: bir
-- club_admin hesap silme talebi gönderdiğinde alıcı sorgusu boş dönüyor,
-- bildirim SESSİZCE hiç gitmiyordu.
--
-- Tek bir süper admin hesabının VAR OLDUĞU zaten gizli bir bilgi değil
-- (uygulamanın kendisi bunu varsayıyor), bu yüzden club_admin'lerin
-- (is_admin_tier()) süper admin satırlarını görebilmesi düşük riskli.
create policy users_admin_select_super_admin on public.users
  for select
  using (is_admin_tier() and role = 'super_admin' and is_active = true);
