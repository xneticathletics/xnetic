set local statement_timeout = 0;
do $clean$
declare
  ids uuid[] := array(select id from clubs);
  sa uuid;
begin
  select auth_user_id into sa from users where role = 'super_admin' and is_active order by created_at limit 1;
  if sa is null then raise exception 'super admin bulunamadi'; end if;
  delete from coach_advance_deductions where club_id = any (ids);
  delete from coach_payments where club_id = any (ids);
  delete from coach_payment_plans where club_id = any (ids);
  delete from extra_income where club_id = any (ids);
  delete from expenses where club_id = any (ids);
  delete from event_registrations where club_id = any (ids);
  delete from events where club_id = any (ids);
  delete from training_schedule_templates where club_id = any (ids);
  delete from venue_coaches where club_id = any (ids);
  delete from fitness_program_completions where club_id = any (ids);
  delete from fitness_program_items where club_id = any (ids);
  delete from fitness_programs where club_id = any (ids);
  delete from fitness_groups where club_id = any (ids);
  delete from fitness_measurements where club_id = any (ids);
  delete from membership_freezes where club_id = any (ids);
  delete from nutrition_articles where club_id = any (ids);
  delete from performance_measurements where club_id = any (ids);
  delete from wellness_checkins where club_id = any (ids);
  delete from club_subscription_history where club_id = any (ids);
  delete from audit_log where club_id = any (ids);
  delete from auth.users where id <> sa;
  delete from clubs where id = any (ids);
  delete from users where role <> 'super_admin';
end
$clean$;
