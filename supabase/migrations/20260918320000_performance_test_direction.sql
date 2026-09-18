-- Testlerin "iyi yönü": lower_is_better = true ise DÜŞÜK değer iyidir (süre,
-- hata/düşme sayısı, dinlenik nabız, yağ oranı gibi), false ise YÜKSEK değer
-- iyidir (mesafe, tekrar, kuvvet gibi), NULL ise belirsiz/nötr (boy, kilo, BKİ
-- gibi) — istemci bu durumda birimden tahmin eder. Önceden yön hiç tutulmuyor,
-- sadece birimden (sn) çıkarılıyordu; "Flamingo Denge — düşme sayısı" gibi
-- birimi sn olmayan ama az olması iyi olan testler yanlış (artış = iyi)
-- yorumlanıyordu.
alter table public.performance_test_catalog
  add column if not exists lower_is_better boolean;

-- Testlerin açıklamalarına göre DÜŞÜK değerin iyi olduğu testler.
update public.performance_test_catalog set lower_is_better = true
where name in (
  'Bel-Kalça Oranı', 'Deri Kıvrımı Toplamı (7 Bölge)', 'Vücut Yağ Oranı',
  '5-10-5 Pro Agility Shuttle', '505 Agility Test', 'Arrowhead Çeviklik Testi',
  'Illinois Çeviklik Testi', 'L-Drill (3-Cone Drill)', 'T-Testi', 'Zigzag Testi',
  'Dinlenik Kalp Atım Hızı', 'Flamingo Denge Testi',
  'Thomas Testi (Kalça Fleksör Esnekliği)',
  '10m Sürat (Kalkış Hızı)', '20m Sürat', '30m Sürat', '40m Sürat',
  'Flying 10m Sürat', 'Flying Sprint (20m, uçan start)', 'Tekrarlı Sprint Testi (RSA)'
);

-- YÜKSEK değerin iyi olduğu testler (kuvvet ve sıçrama kategorilerinin
-- tamamı + aşağıdaki dayanıklılık/denge/esneklik testleri).
update public.performance_test_catalog set lower_is_better = false
where category in ('kuvvet', 'sicrama', 'Kuvvet', 'Sıçrama', 'Esneklik')
   or name in (
     'Beep Test (20m Shuttle Run / PACER)', 'Cooper Testi (12 dk Koşu Mesafesi)',
     'Kalp Atım Toparlanma Testi (HRR)', 'Yo-Yo Intermittent Recovery Test',
     'Gözü Kapalı Tek Ayak Denge', 'Stork Denge Testi', 'Y Denge Testi (Y-Balance Test)',
     'Ayak Bileği Dorsifleksiyon Testi', 'Kalça Fleksiyon / Ekstansiyon',
     'Otur-Uzan Testi (Sit and Reach)', 'Esneklik (Otur-Uzan)'
   );

-- Kulübe özel "Hız" kategorisindeki süre testi (30m Sürat) yukarıdaki isim
-- eşleşmesiyle zaten düşük=iyi oldu. Nötr bırakılanlar (lower_is_better NULL):
-- Boy, Kilo, BKİ, Kol Açıklığı, Oturarak Boy, Omuz Esneklik Testi.
