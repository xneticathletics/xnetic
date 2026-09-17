-- send_wellness_reminders() (günlük 04:00 pg_cron görevi "wellness-reminder-daily",
-- migration geçmişinde hiç görünmüyor — dashboard'dan doğrudan oluşturulmuş,
-- bkz. CLAUDE.md "Base schema predates tracked migrations" notu) Türkçe
-- karakterleri BOZUK kaydedilmiş halde içeriyordu (ör. "GÃ¼nlÃ¼k Check-in
-- HatÄ±rlatmasÄ±") — muhtemelen ilk oluşturulduğunda yanlış kodlamalı bir
-- terminalden (bkz. [[feedback_turkish_chars_bash_corruption]]) yapıştırılmış.
-- Bu fonksiyon her gün TÜM müsabık sporculara gönderildiği için etkisi
-- genişti. Metin burada, dosyaya yazılarak (terminal/bash'e ELLE
-- yazılmadan) düzeltiliyor.
create or replace function public.send_wellness_reminders()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into notifications (club_id, recipient_user_id, title, body)
  select a.club_id, a.athlete_user_id,
         'Günlük Check-in Hatırlatması',
         'Bugünkü wellness check-in''ini doldurmayı unutma! Sabah 06:00-12:00 arası aktif.'
  from athletes a
  where a.athlete_type = 'musabik'
    and a.status = 'active'
    and a.athlete_user_id is not null;
end;
$$;
