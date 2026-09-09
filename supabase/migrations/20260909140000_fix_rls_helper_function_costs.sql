-- BULUNAN PERFORMANS SORUNU: kullanıcı "Antrenörler sekmesi yükleniyor
-- simgesi dönüp duruyor, Ana Sayfa'da kulüp bilgileri geç yükleniyor"
-- şikayeti üzerine profillendi. Örnek: club_admin'in antrenör listesi
-- sorgusu (users where role='coach') EXPLAIN ANALYZE'de 1985ms sürüyordu
-- (68 satır için!) — Seq Scan + users tablosundaki TÜM SELECT
-- politikalarının OR'lanmış tek bir filtresi.
--
-- KÖK NEDEN: bu filtredeki her fonksiyonun (is_coach_of_my_athlete,
-- is_parent_of_my_coached_athlete, is_my_coordinated_branch_coach gibi —
-- her biri athletes/groups/group_coaches üzerinde JOIN'li EXISTS
-- sorguları çalıştırıyor) varsayılan Postgres maliyeti (100) ile,
-- is_admin_tier()/current_club_id()/is_super_admin() gibi SADECE JWT
-- claim'i okuyan (hiç tablo erişimi olmayan, gerçekten ucuz) fonksiyonlar
-- AYNI maliyet sınıfındaydı. Planlayıcının "hangi OR koşulunu önce
-- değerlendireyim" kararı için hiçbir ipucu yoktu — bu yüzden PAHALI
-- ilişki-sorgulayan fonksiyonlar SATIR BAŞINA çalışıyordu, ucuz ve
-- çoğu durumda zaten YETERLİ olan "zaten club_admin'sin" kontrolü en
-- sona düşse bile.
--
-- ÇÖZÜM: gerçekten tablo sorgulayan (SECURITY DEFINER, ilişki kontrol
-- eden) TÜM yardımcı fonksiyonlara yüksek bir COST vermek — davranış
-- DEĞİŞMİYOR, sadece Postgres planlayıcısına "bunlar pahalı, mümkünse
-- daha ucuz OR dallarından sonra değerlendir" sinyali veriliyor. Bu,
-- fonksiyon gövdelerine hiç dokunmadan, saf bir planlayıcı ipucu.
alter function public.can_message_recipient(uuid) cost 10000;
alter function public.is_athlete_self_update_safe(uuid, uuid, athlete_status, athlete_type, uuid, uuid, uuid) cost 10000;
alter function public.is_athletes_coach(uuid) cost 10000;
alter function public.is_branch_coordinator() cost 10000;
alter function public.is_branch_moderator(text) cost 10000;
alter function public.is_coach_of_my_athlete(uuid) cost 10000;
alter function public.is_current_user_row(uuid) cost 10000;
alter function public.is_my_athlete(uuid) cost 10000;
alter function public.is_my_branch(text) cost 10000;
alter function public.is_my_coached_group(uuid) cost 10000;
alter function public.is_my_coordinated_athlete(uuid) cost 10000;
alter function public.is_my_coordinated_branch_coach(uuid) cost 10000;
alter function public.is_my_coordinated_group(uuid) cost 10000;
alter function public.is_my_coordinator_branch(text) cost 10000;
alter function public.is_parent_of_my_coached_athlete(uuid) cost 10000;
alter function public.is_self_update_safe(uuid, user_role, uuid, boolean) cost 10000;
alter function public.is_user_in_my_club(uuid) cost 10000;
alter function public.is_valid_notification_recipient(uuid) cost 10000;
alter function public.is_venue_authority(uuid) cost 10000;
