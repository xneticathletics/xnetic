-- Sosyal Alan ızgarasındaki küçük önizlemeler (~110px) şimdiye kadar TAM
-- boyutlu fotoğrafın (1600px genişlik, yükleme sırasında zaten küçültülmüş
-- olsa da) kendisini indiriyordu — küçük bir kutuya sığdırmak için tüm
-- veriyi çekmek, "ızgara çok yavaş yükleniyor" şikayetinin asıl nedeniydi.
-- Artık yükleme sırasında AYRICA gerçekten küçük (320px) bir önizleme
-- görseli de üretilip yükleniyor (bkz. src/lib/api/socialPosts.ts), imzalı
-- URL'i bu sütunda tutuluyor. Eski satırlarda thumb_url NULL kalır — ekran
-- bu durumda media_url'e geri döner (davranış hiç bozulmaz, sadece yavaş
-- kalır — yeni paylaşımlardan itibaren hızlanır).
alter table public.social_posts add column if not exists thumb_url text;
