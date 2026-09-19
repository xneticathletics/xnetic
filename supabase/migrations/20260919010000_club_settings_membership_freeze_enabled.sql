-- Her kulüp "Kayıt Dondurma"yı kullanmayabilir — Kulüp Ayarları → Gelişmiş
-- Ayarlar → Kayıt Dondurma'dan açılıp kapatılır. Varsayılan AÇIK (mevcut
-- davranış korunur). Kapalıyken yeni kayıt dondurma başlatılamaz; halihazırda
-- oluşturulmuş dondurmalar geçerliliğini korur.
alter table public.club_settings
  add column if not exists membership_freeze_enabled boolean not null default true;
