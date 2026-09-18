-- Mağaza ürün fotoğrafları tam çözünürlükte (birkaç MB) yükleniyor ve ızgarada
-- da aynı dosya kullanıldığı için liste çok yavaş açılıyordu. Izgara için
-- ayrıca küçük bir önizleme tutuluyor: photo_thumb_urls, photo_urls ile AYNI
-- sırada paralel bir dizi (i. eleman i. fotoğrafın önizlemesi; eski
-- fotoğraflarda boş/eksik olabilir, istemci ana URL'ye geri düşer).
alter table public.shop_products
  add column if not exists photo_thumb_urls text[] not null default '{}';
