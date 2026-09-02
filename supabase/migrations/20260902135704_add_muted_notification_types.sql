-- Admin, bir kullanıcının hangi bildirim türlerini almayacağını
-- yönetebilsin diye (bkz. web Kullanıcılar sayfası "Bildirim Tercihleri").
-- Boş dizi = kullanıcı her türden bildirim alır (varsayılan, mevcut davranış
-- değişmez). event_type key'leri (match_result, absence, consecutive_absence,
-- fitness_program, membership_freeze, session_excuse, payment_claim,
-- payment_reminder) hem mobil hem web src/lib/api/notifications.ts'te
-- ortak sabit listede tutulur.
alter table public.users
  add column if not exists muted_notification_types text[] not null default '{}';
