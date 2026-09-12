-- Sporcu ve antrenörlerin doğum günlerinde otomatik kutlama bildirimi —
-- send_payment_reminders() ile birebir aynı pg_cron kalıbı (bkz. o
-- migration'daki club_id/trg_set_club_id notu, burada da geçerli).
--
-- Sporcu için: athlete_user_id (varsa, sporcunun kendi hesabı) VE
-- parent_user_id (varsa, velisi) ayrı ayrı, birbirine bağımsız bildirim
-- alır — biri diğerinin varlığına bakılmaksızın. İkisi de yoksa (sporcu
-- girişi henüz oluşturulmamış) o sporcu için hiçbir şey gönderilmez.
-- Antrenör için: users tablosundaki kendi hesabı (role='coach').
create or replace function public.send_birthday_notifications()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  r record;
  v_notification_id uuid;
  v_muted text[];
  v_sent integer := 0;
  v_project_url text := 'https://dfinjohgmtdawkgwnhfj.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaW5qb2hnbXRkYXdrZ3duaGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDMxODYsImV4cCI6MjEwMjYxOTE4Nn0.DphbUJBUFQv2KcOyPu4kWjVf0cRiAR2CI2MEWJ6n7nQ';
begin
  -- Sporcunun kendi hesabı — doğrudan kendisine hitap eden mesaj.
  for r in
    select a.club_id, a.athlete_user_id as recipient_id, a.full_name
    from athletes a
    where a.birth_date is not null
      and a.athlete_user_id is not null
      and extract(month from a.birth_date) = extract(month from current_date)
      and extract(day from a.birth_date) = extract(day from current_date)
  loop
    select u.muted_notification_types into v_muted from users u where u.id = r.recipient_id;
    if v_muted is not null and 'birthday' = any(v_muted) then
      continue;
    end if;

    v_notification_id := gen_random_uuid();
    insert into notifications (id, club_id, recipient_user_id, title, body, event_type)
    values (
      v_notification_id, r.club_id, r.recipient_id,
      'İyi ki Doğdun! 🎉',
      'Bugün senin doğum günün ' || r.full_name || '! Kulübümüzdeki tüm ailen sana mutlu, sağlıklı ve başarılarla dolu bir yaş diliyor. 🎂',
      'birthday'
    );
    v_sent := v_sent + 1;

    perform net.http_post(
      url := v_project_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_anon_key, 'Authorization', 'Bearer ' || v_anon_key),
      body := jsonb_build_object('notification_id', v_notification_id)
    );
  end loop;

  -- Sporcunun velisi — çocuğu için kutlama, veliye hitap eden mesaj.
  for r in
    select a.club_id, a.parent_user_id as recipient_id, a.full_name
    from athletes a
    where a.birth_date is not null
      and a.parent_user_id is not null
      and extract(month from a.birth_date) = extract(month from current_date)
      and extract(day from a.birth_date) = extract(day from current_date)
  loop
    select u.muted_notification_types into v_muted from users u where u.id = r.recipient_id;
    if v_muted is not null and 'birthday' = any(v_muted) then
      continue;
    end if;

    v_notification_id := gen_random_uuid();
    insert into notifications (id, club_id, recipient_user_id, title, body, event_type)
    values (
      v_notification_id, r.club_id, r.recipient_id,
      '🎂 Bugün ' || r.full_name || '''in Doğum Günü!',
      r.full_name || '''in doğum günü kutlu olsun! Kulübümüz onun için mutlu, sağlıklı ve başarılarla dolu bir yaş diliyor. 🎉',
      'birthday'
    );
    v_sent := v_sent + 1;

    perform net.http_post(
      url := v_project_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_anon_key, 'Authorization', 'Bearer ' || v_anon_key),
      body := jsonb_build_object('notification_id', v_notification_id)
    );
  end loop;

  -- Antrenör — kendi hesabına doğrudan hitap eden mesaj.
  for r in
    select u.club_id, u.id as recipient_id, u.name as full_name
    from users u
    where u.role = 'coach'
      and u.is_active = true
      and u.birth_date is not null
      and extract(month from u.birth_date) = extract(month from current_date)
      and extract(day from u.birth_date) = extract(day from current_date)
  loop
    select u2.muted_notification_types into v_muted from users u2 where u2.id = r.recipient_id;
    if v_muted is not null and 'birthday' = any(v_muted) then
      continue;
    end if;

    v_notification_id := gen_random_uuid();
    insert into notifications (id, club_id, recipient_user_id, title, body, event_type)
    values (
      v_notification_id, r.club_id, r.recipient_id,
      'İyi ki Doğdun! 🎉',
      'Bugün senin doğum günün ' || r.full_name || '! Kulübümüzdeki tüm ailen sana mutlu, sağlıklı ve başarılarla dolu bir yaş diliyor. 🎂',
      'birthday'
    );
    v_sent := v_sent + 1;

    perform net.http_post(
      url := v_project_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_anon_key, 'Authorization', 'Bearer ' || v_anon_key),
      body := jsonb_build_object('notification_id', v_notification_id)
    );
  end loop;

  return v_sent;
end;
$$;

revoke execute on function public.send_birthday_notifications() from public;

-- Her sabah Türkiye saatiyle 09:00'da (UTC 06:00) — gün başlarken, mesai
-- öncesi görülsün diye (aidat hatırlatmasından biraz önce, 10:00'daki
-- kalabalıkla çakışmasın).
select cron.schedule(
  'send-birthday-notifications-daily',
  '0 6 * * *',
  $$select public.send_birthday_notifications();$$
);
