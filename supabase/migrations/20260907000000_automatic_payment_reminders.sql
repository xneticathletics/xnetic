-- Otomatik aidat hatırlatması: şimdiye kadar "Aidat Hatırlatması" bildirimi
-- TAMAMEN elle gönderiliyordu (admin/koordinatör Finans → Bekleyen/Gecikmiş
-- Aidatlar'dan tek tek "🔔 Uyarı Gönder"e basmak zorundaydı). 100+ sporculu
-- bir kulüpte bu kolayca unutuluyor. Bu migration, vadesi (kulübün kendi
-- payment_overdue_grace_days ayarına göre) geçmiş ödemeleri her gün
-- otomatik tarayıp hatırlatma gönderen bir pg_cron görevi kuruyor —
-- manuel "Uyarı Gönder" butonu da AYNEN duruyor, ikisi çakışmıyor (aynı
-- ödeme için en fazla 3 günde bir otomatik hatırlatma gider, admin
-- isterse arada elle de gönderebilir).

alter table public.payments add column if not exists last_reminder_sent_at timestamptz;

create extension if not exists pg_net;

-- SECURITY DEFINER + explicit search_path — bugünkü denetimin standart
-- kalıbı. current_club_id()/current_user_role() bir JWT context'i
-- gerektiriyor ki cron içinde hiç yok; bu yüzden trg_set_club_id
-- tetikleyicisinin (notifications tablosunda) hatalı reddetmemesi için
-- club_id'yi INSERT'te AÇIKÇA veriyoruz (elde ettiğimiz payment'ın kendi
-- club_id'si) — tetikleyici sadece club_id UYUŞMAZSA VE is_super_admin()
-- KESİN true DEĞİLSE reddediyor; JWT'siz bir bağlamda is_super_admin()
-- NULL döner (false değil), bu yüzden reddetmiyor. Canlıda doğrulandı.
create or replace function public.send_payment_reminders()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  r record;
  v_notification_id uuid;
  v_body text;
  v_muted text[];
  v_sent integer := 0;
  v_project_url text := 'https://dfinjohgmtdawkgwnhfj.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaW5qb2hnbXRkYXdrZ3duaGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDMxODYsImV4cCI6MjEwMjYxOTE4Nn0.DphbUJBUFQv2KcOyPu4kWjVf0cRiAR2CI2MEWJ6n7nQ';
begin
  for r in
    select p.id as payment_id, p.club_id, p.amount, p.due_date,
           a.full_name as athlete_name, a.parent_user_id
    from payments p
    join athletes a on a.id = p.athlete_id
    where p.status = 'pending'
      and a.parent_user_id is not null
      and p.due_date < (current_date - coalesce(
            (select cs.payment_overdue_grace_days from club_settings cs where cs.club_id = p.club_id),
            0
          ))
      and (p.last_reminder_sent_at is null or p.last_reminder_sent_at < now() - interval '3 days')
  loop
    select u.muted_notification_types into v_muted from users u where u.id = r.parent_user_id;
    if v_muted is not null and 'payment_reminder' = any(v_muted) then
      continue;
    end if;

    v_notification_id := gen_random_uuid();
    v_body := r.athlete_name || ' için ' || r.amount || ' ₺ tutarındaki aidatın vadesi ('
      || to_char(r.due_date, 'DD.MM.YYYY') || ') geçti. Lütfen en kısa sürede ödeme yapın.';

    insert into notifications (id, club_id, recipient_user_id, title, body, event_type)
    values (v_notification_id, r.club_id, r.parent_user_id, 'Aidat Hatırlatması', v_body, 'payment_reminder');

    update payments set last_reminder_sent_at = now() where id = r.payment_id;
    v_sent := v_sent + 1;

    -- Push bildirimi — mobil/web sendNotification()'ın kendi
    -- triggerPushNotification()'ıyla birebir aynı çağrı, sadece burada
    -- bir istemci olmadığı için pg_net ile sunucu tarafından tetikleniyor.
    -- anon key kullanılıyor (gizli değil, uygulamaya zaten gömülü).
    perform net.http_post(
      url := v_project_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_anon_key, 'Authorization', 'Bearer ' || v_anon_key),
      body := jsonb_build_object('notification_id', v_notification_id)
    );
  end loop;

  return v_sent;
end;
$$;

revoke execute on function public.send_payment_reminders() from public;

-- Her gün Türkiye saatiyle 10:00'da (UTC 07:00) — mesai saatleri içinde,
-- gece yarısı bildirim gitmesin diye.
select cron.schedule(
  'send-payment-reminders-daily',
  '0 7 * * *',
  $$select public.send_payment_reminders();$$
);
