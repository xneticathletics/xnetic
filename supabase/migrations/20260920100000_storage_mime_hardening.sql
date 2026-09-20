-- Depolama sertleştirme: dosya tipi (MIME) kısıtlaması olmayan bucket'lar.
--
-- Sorun: announcement-attachments PUBLIC ve allowed_mime_types NULL idi;
-- duyuru eki seçici de DocumentPicker type:"*/*" kullanıyor. Yani bir kulüp
-- yöneticisi .html / .svg yükleyip supabase.co alan adı altında çalışan bir
-- sayfa barındırabiliyordu (depolanmış XSS / güvenilir alan adında oltalama).
-- Özel (private) bucket'larda da imzalı URL aynı content-type ile servis
-- edildiği için risk aynıdır.
--
-- application/octet-stream bilerek izinli: bilinmeyen MIME'lı dosyalar bu
-- tiple yükleniyor ve tarayıcı bunu ÇALIŞTIRMAZ, indirir — yükleme akışını
-- bozmadan XSS riskini ortadan kaldırır. text/html ve image/svg+xml listede
-- YOK; eklenmemeli.

-- Duyuru ekleri: ofis dokümanı/PDF/görsel yüklenebilmeli.
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif',
  'application/pdf','text/plain','application/zip','application/octet-stream',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'
]
where id = 'announcement-attachments';

-- Dekontlar: fotoğraf ya da PDF.
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf','application/octet-stream'
]
where id in ('payment-receipts', 'event-receipts');

-- Antrenman/sosyal medya: görsel ve video.
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif',
  'video/mp4','video/quicktime','video/x-m4v','video/webm','application/octet-stream'
]
where id in ('session-media', 'social-posts');

-- Rozet simgeleri: sadece görsel.
update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id = 'badge-icons';
