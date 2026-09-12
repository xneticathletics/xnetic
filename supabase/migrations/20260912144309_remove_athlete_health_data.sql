-- Kullanıcı kararı: sporcuların sağlık verilerini (kan grubu, alerji,
-- kullandığı ilaçlar, sağlık notu) hem toplamayı hem saklamayı bırakıyoruz
-- — KVKK md. 6 kapsamındaki özel nitelikli kişisel veri, uygulama mağazası
-- incelemesinde ek yük ve gereksiz uyum/hukuki risk yaratıyordu. Kolonlar
-- tamamen kaldırılıyor (sadece boşaltılmıyor) ki ileride yanlışlıkla
-- tekrar veri girilip saklanmasın. Kaldırmadan önce canlıda kontrol
-- edildi: 201 sporcudan sadece 1'inde blood_type doluydu (test verisi),
-- allergies/medications/health_info hiçbirinde dolu değildi — gerçek veri
-- kaybı riski yok. Hiçbir trigger/RLS politikası bu kolonlara referans
-- vermiyordu (canlıda doğrulandı).

alter table public.athletes
  drop column if exists blood_type,
  drop column if exists health_info,
  drop column if exists allergies,
  drop column if exists medications;
