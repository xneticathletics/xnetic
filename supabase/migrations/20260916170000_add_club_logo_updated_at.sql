-- Kulüp logosu değiştirildiğinde Ana Sayfa/diğer ekranlarda güncel
-- görünmüyordu — getClubLogoUrl() bilerek SABİT bir URL döndürüyor
-- (performans için, bkz. clubLogo.ts yorumu), bu da doğru bir tasarım
-- ama dosya değiştiğinde React Native'in <Image> önbelleği "URL aynı,
-- yeniden indirmeye gerek yok" diyip eski logoyu göstermeye devam
-- ediyordu. Gerçek yükleme zamanını tutan bu kolon, URL'e "?v=..." olarak
-- eklenerek SADECE gerçekten yeni bir logo yüklendiğinde önbelleği
-- kırıyor (her render'da değil).
alter table public.clubs add column if not exists logo_updated_at timestamptz;
