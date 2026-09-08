-- process_subscription_renewals()'ın gönderdiği bildirimler event_type=null
-- ile geliyordu — getNotificationTarget() bunu adlandırılmış bir event_type
-- olmadan yönlendiremiyordu, süper admin bu bildirimlere dokununca hiçbir
-- yere gitmiyordu. "subscription_alert" event_type'ı eklenip
-- notificationNavigation.ts'te süper admin için Abonelikler'e yönlendirme
-- tanımlandı (bkz. src/lib/notificationNavigation.ts) — bu migration onun
-- veritabanı tarafı.
create or replace function public.process_subscription_renewals()
returns table (reminders_sent integer, expired_count integer)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  r record;
  r2 record;
  v_notification_id uuid;
  v_reminders integer := 0;
  v_expired integer := 0;
  v_project_url text := 'https://dfinjohgmtdawkgwnhfj.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaW5qb2hnbXRkYXdrZ3duaGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDMxODYsImV4cCI6MjEwMjYxOTE4Nn0.DphbUJBUFQv2KcOyPu4kWjVf0cRiAR2CI2MEWJ6n7nQ';
begin
  for r in
    select cs.id as sub_id, cs.club_id, c.name as club_name
    from club_subscriptions cs
    join clubs c on c.id = cs.club_id
    where cs.status = 'active' and cs.current_period_end < now()
  loop
    update club_subscriptions set status = 'past_due' where id = r.sub_id;
    v_expired := v_expired + 1;

    for r2 in select id from users where club_id = r.club_id and role = 'club_admin' and is_active = true loop
      v_notification_id := gen_random_uuid();
      insert into notifications (id, club_id, recipient_user_id, title, body, event_type)
      values (
        v_notification_id, r.club_id, r2.id, 'Aboneliğin Süresi Doldu',
        'Kulübünün abonelik dönemi sona erdi. Uygulamaya devam edebilmek için ödemeni yapıp uygulama içinden bildirmen gerekiyor.',
        'subscription_alert'
      );
      perform net.http_post(
        url := v_project_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_anon_key, 'Authorization', 'Bearer ' || v_anon_key),
        body := jsonb_build_object('notification_id', v_notification_id)
      );
    end loop;

    for r2 in select id from users where role = 'super_admin' and is_active = true loop
      v_notification_id := gen_random_uuid();
      insert into notifications (id, recipient_user_id, title, body, event_type)
      values (
        v_notification_id, r2.id, 'Kulüp Aboneliği Süresi Doldu',
        r.club_name || ' kulübünün abonelik dönemi sona erdi, otomatik olarak "Ödeme Gecikti" durumuna alındı.',
        'subscription_alert'
      );
      perform net.http_post(
        url := v_project_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_anon_key, 'Authorization', 'Bearer ' || v_anon_key),
        body := jsonb_build_object('notification_id', v_notification_id)
      );
    end loop;
  end loop;

  for r in
    select cs.id as sub_id, cs.club_id, cs.current_period_end
    from club_subscriptions cs
    where cs.status = 'active'
      and cs.current_period_end between now() and now() + interval '7 days'
      and cs.renewal_reminder_sent_at is null
  loop
    update club_subscriptions set renewal_reminder_sent_at = now() where id = r.sub_id;
    v_reminders := v_reminders + 1;

    for r2 in select id from users where club_id = r.club_id and role = 'club_admin' and is_active = true loop
      v_notification_id := gen_random_uuid();
      insert into notifications (id, club_id, recipient_user_id, title, body, event_type)
      values (
        v_notification_id, r.club_id, r2.id, 'Aboneliğin Yakında Sona Eriyor',
        'Kulübünün abonelik dönemi ' || to_char(r.current_period_end, 'DD.MM.YYYY') || ' tarihinde sona erecek. Kesintisiz devam edebilmek için önceden ödeme yapabilirsin.',
        'subscription_alert'
      );
      perform net.http_post(
        url := v_project_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_anon_key, 'Authorization', 'Bearer ' || v_anon_key),
        body := jsonb_build_object('notification_id', v_notification_id)
      );
    end loop;
  end loop;

  return query select v_reminders, v_expired;
end;
$$;
