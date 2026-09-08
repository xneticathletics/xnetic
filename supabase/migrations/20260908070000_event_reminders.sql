-- Etkinlik/turnuva/kamp yaklaşırken kayıtlı sporculara otomatik hatırlatma
-- — 1 hafta kala ve 3 gün kala, send_payment_reminders/
-- process_subscription_renewals ile aynı pg_cron desenini kullanıyor.
-- Her etkinlik için her eşik SADECE BİR KEZ gönderilir (reminder_*_sent_at
-- ile işaretlenir) — cron her gün çalıştığı için tekrar göndermemesi
-- gerekiyor.
alter table public.events add column if not exists reminder_7d_sent_at timestamptz;
alter table public.events add column if not exists reminder_3d_sent_at timestamptz;

create or replace function public.send_event_reminders()
returns table (reminders_7d integer, reminders_3d integer)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  r record;
  r2 record;
  v_notification_id uuid;
  v_muted text[];
  v_body text;
  v_count_7d integer := 0;
  v_count_3d integer := 0;
  v_project_url text := 'https://dfinjohgmtdawkgwnhfj.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaW5qb2hnbXRkYXdrZ3duaGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDMxODYsImV4cCI6MjEwMjYxOTE4Nn0.DphbUJBUFQv2KcOyPu4kWjVf0cRiAR2CI2MEWJ6n7nQ';
begin
  -- 1 hafta kala — sadece hâlâ geçerli (pending/approved) kayıtlara.
  for r in
    select e.id, e.club_id, e.title, e.start_date
    from events e
    where e.status = 'published'
      and e.start_date = current_date + interval '7 days'
      and e.reminder_7d_sent_at is null
  loop
    update events set reminder_7d_sent_at = now() where id = r.id;
    v_count_7d := v_count_7d + 1;
    v_body := r.title || ' 1 hafta sonra (' || to_char(r.start_date, 'DD.MM.YYYY') || ') gerçekleşecek.';

    for r2 in
      select distinct registered_by from event_registrations
      where event_id = r.id and status in ('pending','approved')
    loop
      select u.muted_notification_types into v_muted from users u where u.id = r2.registered_by;
      if v_muted is not null and 'event_reminder' = any(v_muted) then
        continue;
      end if;
      v_notification_id := gen_random_uuid();
      insert into notifications (id, club_id, recipient_user_id, title, body, event_type, payload)
      values (v_notification_id, r.club_id, r2.registered_by, 'Etkinlik Yaklaşıyor', v_body, 'event_reminder', jsonb_build_object('eventId', r.id));
      perform net.http_post(
        url := v_project_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_anon_key, 'Authorization', 'Bearer ' || v_anon_key),
        body := jsonb_build_object('notification_id', v_notification_id)
      );
    end loop;
  end loop;

  -- 3 gün kala — aynı mantık.
  for r in
    select e.id, e.club_id, e.title, e.start_date
    from events e
    where e.status = 'published'
      and e.start_date = current_date + interval '3 days'
      and e.reminder_3d_sent_at is null
  loop
    update events set reminder_3d_sent_at = now() where id = r.id;
    v_count_3d := v_count_3d + 1;
    v_body := r.title || ' 3 gün sonra (' || to_char(r.start_date, 'DD.MM.YYYY') || ') gerçekleşecek.';

    for r2 in
      select distinct registered_by from event_registrations
      where event_id = r.id and status in ('pending','approved')
    loop
      select u.muted_notification_types into v_muted from users u where u.id = r2.registered_by;
      if v_muted is not null and 'event_reminder' = any(v_muted) then
        continue;
      end if;
      v_notification_id := gen_random_uuid();
      insert into notifications (id, club_id, recipient_user_id, title, body, event_type, payload)
      values (v_notification_id, r.club_id, r2.registered_by, 'Etkinlik Yaklaşıyor', v_body, 'event_reminder', jsonb_build_object('eventId', r.id));
      perform net.http_post(
        url := v_project_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_anon_key, 'Authorization', 'Bearer ' || v_anon_key),
        body := jsonb_build_object('notification_id', v_notification_id)
      );
    end loop;
  end loop;

  return query select v_count_7d, v_count_3d;
end;
$$;

revoke execute on function public.send_event_reminders() from public;

-- Her gün Türkiye saatiyle 10:20'de (UTC 07:20) — diğer günlük cron
-- görevleriyle (07:00 aidat, 07:10 abonelik) aynı pencerede, çakışmasın diye kaydırılmış.
select cron.schedule('send-event-reminders-daily', '20 7 * * *', $$select public.send_event_reminders();$$);
