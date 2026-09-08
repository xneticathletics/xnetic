-- Abonelik yenileme akışı: şu ana kadar bir kulübün current_period_end'i
-- geçse bile status='active' kalıyordu (hiçbir otomatik kontrol yoktu) ve
-- yaklaşan bitiş için hiçbir uyarı gönderilmiyordu. send_payment_reminders()
-- ile aynı desende, günlük çalışan tek bir fonksiyon iki işi yapıyor:
-- (1) süresi geçmiş "active" abonelikleri "past_due"ya çekip kulüp adminine
-- VE süper admin(ler)e bildirir, (2) bitişine 7 gün kalan "active"
-- abonelikler için TEK SEFERLİK (renewal_reminder_sent_at ile) bir
-- hatırlatma gönderir.

alter table public.club_subscriptions add column if not exists renewal_reminder_sent_at timestamptz;

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
  -- 1) Süresi geçmiş "active" abonelikler -> "past_due". Kulüp adminine
  -- ("ödeme yap") VE süper admin(ler)e ("takip et") ayrı ayrı bildirilir.
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
        null
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
        null
      );
      perform net.http_post(
        url := v_project_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_anon_key, 'Authorization', 'Bearer ' || v_anon_key),
        body := jsonb_build_object('notification_id', v_notification_id)
      );
    end loop;
  end loop;

  -- 2) Bitişine 7 gün kalan "active" abonelikler -> tek seferlik hatırlatma
  -- (renewal_reminder_sent_at ile aynı dönem için tekrar gönderilmez;
  -- upsertSubscription() bir kulüp yenilendiğinde bunu null'a çeker, böylece
  -- bir sonraki dönemde yeniden uyarı verilebilir).
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
        null
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

revoke execute on function public.process_subscription_renewals() from public;
revoke execute on function public.process_subscription_renewals() from anon;
revoke execute on function public.process_subscription_renewals() from authenticated;

select cron.schedule('process-subscription-renewals-daily', '10 7 * * *', $$select public.process_subscription_renewals();$$);
