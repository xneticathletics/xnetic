-- "Belirli Gruplar" hedefi artık grup seçilince otomatik olarak o grubun
-- TÜM antrenör+veli+sporcularına gitmiyor — admin, branş->grup seçtikten
-- sonra Antrenörler/Sporcular/Veliler'i ayrı ayrı (Tümü ya da isim isim)
-- işaretleyebiliyor. Sonuç, doğrudan alıcı kullanıcı id listesi olarak
-- burada saklanıyor; target_types/target_ids (grup id'leri) referans için
-- olduğu gibi kalıyor. NULL/boş ise (eski duyurular) eski davranışa —
-- gruptaki HERKESE gönderim — geri düşülür (bkz. announcements.ts).
alter table public.announcements
  add column if not exists target_user_ids uuid[];
