-- Günlük Check-in ve Algılanan Zorluk Derecesi (RPE) artık kulüp bazında
-- açılıp kapatılabiliyor ve süreleri ayarlanabiliyor. İKİSİ DE VARSAYILAN
-- OLARAK AÇIK — isteyen kulüp kapatır (kullanıcı kararı).
alter table public.club_settings
  add column if not exists wellness_enabled boolean not null default true,
  add column if not exists wellness_start_hour smallint not null default 6,
  add column if not exists wellness_end_hour smallint not null default 12,
  add column if not exists rpe_enabled boolean not null default true,
  add column if not exists rpe_window_minutes smallint not null default 60;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_settings_wellness_hours_check') then
    alter table public.club_settings add constraint club_settings_wellness_hours_check
      check (wellness_start_hour between 0 and 23 and wellness_end_hour between 1 and 24
             and wellness_start_hour < wellness_end_hour);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'club_settings_rpe_window_check') then
    alter table public.club_settings add constraint club_settings_rpe_window_check
      check (rpe_window_minutes between 5 and 720);
  end if;
end $$;

-- Antrenman bitiminde gönderilen RPE hatırlatmasının tekrarlanmaması için.
alter table public.training_sessions
  add column if not exists rpe_reminder_sent_at timestamptz;

-- Günlük check-in hatırlatması: kapalı kulüplere gönderilmez, metindeki
-- saat aralığı kulübün kendi ayarından gelir.
create or replace function public.send_wellness_reminders()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into notifications (club_id, recipient_user_id, title, body, event_type)
  select a.club_id, a.athlete_user_id,
         'Günlük Check-in Hatırlatması',
         'Bugünkü check-in''ini doldurmayı unutma! Saat ' ||
           lpad(coalesce(cs.wellness_start_hour, 6)::text, 2, '0') || ':00-' ||
           lpad(coalesce(cs.wellness_end_hour, 12)::text, 2, '0') || ':00 arası aktif.',
         'wellness_reminder'
  from athletes a
  left join club_settings cs on cs.club_id = a.club_id
  where a.athlete_type = 'musabik'
    and a.status = 'active'
    and a.athlete_user_id is not null
    and coalesce(cs.wellness_enabled, true);
end;
$function$;

-- Antrenman BİTİŞ saatinde, o antrenmana katılan sporculara "zorluk
-- derecesini gir" bildirimi. Her 15 dakikada bir çalışır; son 20 dakika
-- içinde bitmiş ve daha önce bildirim gönderilmemiş antrenmanları alır
-- (cron gecikmesine karşı pencere biraz geniş, rpe_reminder_sent_at
-- tekrarı engelliyor). Saatler Türkiye yerel saati olarak saklandığı için
-- karşılaştırma Europe/Istanbul'a çevrilerek yapılır.
create or replace function public.send_session_rpe_reminders()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r record;
  v_now timestamp := (now() at time zone 'Europe/Istanbul');
  v_ids uuid[];
  v_notification_id uuid;
  v_muted text[];
  v_sent integer := 0;
  v_project_url text := 'https://wzyyjilodsrwwqdjiqam.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6eXlqaWxvZHNyd3dxZGppcWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTkwNDEsImV4cCI6MjEwNTA3NTA0MX0.Mdj3UIk1hMHi_MhITU84I99KZZ7Uj_c-abQIak9Kyu0';
begin
  -- Bitişi son 20 dakika içinde geçmiş, henüz hatırlatma gönderilmemiş
  -- antrenmanlar (cron 15 dk'da bir; pencere biraz geniş, tekrarı
  -- rpe_reminder_sent_at engelliyor).
  select array_agg(s.id) into v_ids
  from training_sessions s
  left join club_settings cs on cs.club_id = s.club_id
  where s.rpe_reminder_sent_at is null
    and s.status <> 'cancelled'
    and coalesce(cs.rpe_enabled, true)
    and (s.session_date + s.end_time) <= v_now
    and (s.session_date + s.end_time) > v_now - interval '20 minutes';

  if v_ids is null then return 0; end if;

  -- Önce işaretle: aşağıdaki döngü hata alsa bile aynı antrenman için
  -- ikinci kez bildirim yağmuru olmasın.
  update training_sessions set rpe_reminder_sent_at = now() where id = any (v_ids);

  for r in
    select s.id as session_id, s.club_id, a.id as athlete_id, a.full_name, u.id as user_id,
           coalesce(cs.rpe_window_minutes, 60) as window_minutes
    from training_sessions s
    join athletes a on a.group_id = s.group_id and a.status = 'active' and a.athlete_user_id is not null
    join users u on u.id = a.athlete_user_id and u.is_active
    left join club_settings cs on cs.club_id = s.club_id
    left join attendance att on att.session_id = s.id and att.athlete_id = a.id
    where s.id = any (v_ids)
      and coalesce(att.status::text, 'geldi') <> 'gelmedi'
  loop
    select u.muted_notification_types into v_muted from users u where u.id = r.user_id;
    if v_muted is not null and 'session_rpe' = any (v_muted) then
      continue;
    end if;

    v_notification_id := gen_random_uuid();
    insert into notifications (id, club_id, recipient_user_id, title, body, event_type, payload)
    values (
      v_notification_id, r.club_id, r.user_id,
      'Antrenman Nasıl Geçti?',
      'Bugünkü antrenmanın zorluk derecesini değerlendir — ' || r.window_minutes || ' dakika içinde doldurabilirsin.',
      'session_rpe',
      jsonb_build_object('sessionId', r.session_id, 'athleteId', r.athlete_id, 'athleteName', r.full_name)
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
$function$;

revoke execute on function public.send_session_rpe_reminders() from public, anon, authenticated;

-- 15 dakikada bir — antrenman bitişlerini yakalamak için günlük cron yetmez.
select cron.schedule(
  'send-session-rpe-reminders',
  '*/15 * * * *',
  $$select public.send_session_rpe_reminders()$$
);

-- 20260919020000_security_hardening.sql ile aynı kural: cron'a özel
-- fonksiyonlar istemciden çağrılamaz.
revoke execute on function public.send_wellness_reminders() from public, anon, authenticated, service_role;
