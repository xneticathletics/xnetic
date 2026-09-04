-- iyzico entegrasyonu hazır olana kadar kulüp abonelik ödemesi Havale/EFT +
-- Süper Admin onayıyla yürüyor (aynı, kulüp içi aidat ödemesinde zaten
-- kullanılan Havale/EFT + "Ödedim, Bildir" + admin onayı deseni). Yeni kulüp
-- kaydında status artık 'mock_paid' değil 'pending_review' ile başlıyor —
-- club_subscriptions'ta status zaten serbest text (check constraint yok),
-- yeni değer için şema değişikliği gerekmiyor.

-- Onaylanınca abonelik döneminin ne zaman biteceğini takip edebilmek için.
alter table public.club_subscriptions add column if not exists current_period_end timestamptz;

-- Kulüp admini kendi kulübünün abonelik durumunu görebilsin (salt okunur) —
-- şu ana kadar sadece süper admin erişebiliyordu, mobil uygulama "Ödeme
-- Onayı Bekleniyor" ekranını gösterebilmek için bunu okuyabilmeli.
drop policy if exists club_subscriptions_club_admin_read on public.club_subscriptions;
create policy club_subscriptions_club_admin_read on public.club_subscriptions for select
  using (club_id = current_club_id());

-- X-NETIC'in kendi ödeme alacağı banka hesabı (kulüplerin KENDİ aidat
-- hesabından farklı — bu, kulübün platforma abonelik ödemesi için).
alter table public.platform_settings add column if not exists bank_account_name text;
alter table public.platform_settings add column if not exists bank_iban text;

-- Geriye dönük uyumluluk: bu değişiklikten önce oluşmuş 'mock_paid'
-- kayıtları zaten "kullanılabilir" kabul ediliyordu (SuperAdminSubscriptions
-- ekranında elle test/demo amaçlı seçilebilen bir durum) — mobil uygulamadaki
-- yeni "ödeme onayı bekleniyor" kilidi SADECE 'pending_review' (ve
-- 'past_due'/'cancelled') durumlarını kilitleyecek, 'mock_paid' ve 'active'
-- serbest kalacak şekilde tasarlandı; burada veri taşımaya gerek yok.
