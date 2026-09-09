-- 1) Duyurular hiç silinmiyordu — sadece "Bildirim Ayarları"ndaki
-- announcement_visibility_days'e göre ARTIK GÖRÜNMÜYORDU (client-side
-- filtre), ama listAnnouncements() hâlâ kulübün BAŞINDAN BERİ attığı TÜM
-- duyuruları çekiyordu. Zaten görünmeyen bir şeyi saklamanın hiçbir
-- anlamı yok — session-media'daki 2 haftalık otomatik silme deseniyle
-- aynı şekilde, artık her kulübün KENDİ görünürlük ayarına göre otomatik
-- siliniyor (hem satır hem varsa ek dosya).
alter table public.announcements add column if not exists storage_path text;
update public.announcements
set storage_path = substring(attachment_url from 'announcement-attachments/([^?]+)')
where storage_path is null and attachment_url is not null;

create or replace function public.trigger_announcements_cleanup()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_project_url text := 'https://dfinjohgmtdawkgwnhfj.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaW5qb2hnbXRkYXdrZ3duaGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDMxODYsImV4cCI6MjEwMjYxOTE4Nn0.DphbUJBUFQv2KcOyPu4kWjVf0cRiAR2CI2MEWJ6n7nQ';
begin
  perform net.http_post(
    url := v_project_url || '/functions/v1/cleanup-old-announcements',
    headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_anon_key, 'Authorization', 'Bearer ' || v_anon_key),
    body := '{}'::jsonb
  );
end;
$$;

revoke execute on function public.trigger_announcements_cleanup() from public;

-- Her gün Türkiye saatiyle 10:50'de (UTC 07:50) — diğer günlük görevlerle
-- aynı pencerede, çakışmasın diye kaydırılmış.
select cron.schedule('cleanup-old-announcements-daily', '50 7 * * *', $$select public.trigger_announcements_cleanup();$$);

-- 2) Finans özetindeki "Vadesi Geçmiş" toplamı, kulübün BAŞINDAN BERİ
-- HİÇ ÖDENMEMİŞ (status='pending') tüm aidat satırlarını istemciye
-- çekip JS'te topluyordu — kulüp yıllar boyu kullandıkça bu satır sayısı
-- (ve Ana Sayfa/Finans açılış süresi) hiç sınır olmadan büyürdü. Artık
-- toplam veritabanı tarafında (tek bir SUM sorgusu) hesaplanıyor, sadece
-- TEK bir sayı client'a dönüyor. isOverdue()'daki AYNI yerel-tarih-güvenli
-- mantık (UTC kaymasını önlemek için) burada da geçerli olsun diye
-- fonksiyonun oturum saat dilimi Europe/Istanbul'a sabitlendi.
create or replace function public.get_overdue_payments_total(p_grace_days integer, p_athlete_ids uuid[] default null)
returns numeric
language plpgsql
stable
set search_path to 'public'
set timezone to 'Europe/Istanbul'
as $$
begin
  return coalesce((
    select sum(amount) from payments
    where status = 'pending'
    and club_id = current_club_id()
    and due_date < (current_date - p_grace_days)
    and (p_athlete_ids is null or athlete_id = any(p_athlete_ids))
  ), 0);
end;
$$;

revoke execute on function public.get_overdue_payments_total(integer, uuid[]) from public;
grant execute on function public.get_overdue_payments_total(integer, uuid[]) to authenticated;
