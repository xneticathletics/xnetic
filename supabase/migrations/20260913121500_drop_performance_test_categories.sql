-- "Test Grubu Ekle" isteği yanlış anlaşılmıştı — az önceki
-- performance_test_categories tablosu ("test kategorisi ekleme") yerine
-- kullanıcı aslında sporcu+test seçip ölçüm girilen bir "test seansı"
-- istiyordu (bkz. performance_test_groups migration'ı). Hiç veri
-- işlenmeden (aynı oturumda eklenip hemen kaldırıldı) geri alınıyor.
drop table if exists public.performance_test_categories;
