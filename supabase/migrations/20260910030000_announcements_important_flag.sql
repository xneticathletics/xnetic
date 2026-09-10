-- Kullanıcı isteği: duyurular listesinde "dikkat gerektiren" duyurular
-- (kulüp yöneticisi tarafından işaretlenir) listenin en üstünde çıksın.
alter table public.announcements
  add column if not exists is_important boolean not null default false;
