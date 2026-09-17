-- Kullanıcı isteği: "özel rozet şablonları" özelliği saçma bulundu, komple
-- geri alındı (bkz. 3426a1b/5b22c87'nin revert commit'leri). Bu migration
-- o özelliğin CANLI veritabanı nesnelerini temizliyor — git revert repo'yu
-- düzeltir ama veritabanına dokunmaz. count_* fonksiyonları ve onları
-- kullanan check_my_badges() BİLEREK bırakıldı: davranışları eskisiyle
-- birebir aynı, "saçma" bulunan kısım sadece özel şablon katmanıydı.
drop function if exists public.check_my_custom_badges();
drop function if exists public.mark_custom_badge_seen(uuid);
drop table if exists public.custom_badge_earned;
drop table if exists public.badge_template_stages;
drop table if exists public.badge_templates;

drop policy if exists badge_icons_storage_insert on storage.objects;
drop policy if exists badge_icons_storage_update on storage.objects;
drop policy if exists badge_icons_storage_delete on storage.objects;
-- Not: storage.buckets'tan silme Storage API üzerinden yapılmalı (doğrudan
-- SQL DELETE reddediliyor) — hiç dosya yüklenmemiş boş, politikasız (RLS
-- yazma izni yok) bir public bucket olarak kalıyor, zararsız.
update storage.buckets set public = false where id = 'badge-icons';
