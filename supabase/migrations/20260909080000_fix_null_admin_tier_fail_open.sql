-- Az önceki iki trigger'da (20260909070000) "if not is_admin_tier() then
-- <kilitle>" yazılmıştı. is_admin_tier() -> current_user_role() ->
-- auth.jwt()->>'app_role' zincirinde, 'app_role' claim'i herhangi bir
-- sebeple eksik/okunamaz olursa is_admin_tier() FALSE değil NULL döner.
-- PL/pgSQL'de "if not NULL" da NULL'dur ve bir IF koşulunda NULL, FALSE
-- gibi davranır — yani "not is_admin_tier()" beklenmedik şekilde NULL
-- olduğunda kilitleme bloğu HİÇ ÇALIŞMAZ (fail-open). Canlı testte
-- yakalandı: senaryoyu simüle ederken app_role claim'i eksik bırakılınca
-- kilit devre dışı kaldı. Gerçek oturumlarda app_role her zaman dolu
-- olsa da, "emin değilsen admin SAY" yerine "emin değilsen admin SAYMA"
-- (fail-closed) daha güvenli — coalesce ile NULL'u false'a sabitliyoruz.
create or replace function public.payments_lock_paid_transition_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not coalesce(public.is_admin_tier(), false) and old.status = 'pending' and new.status = 'paid' then
    new.club_id := old.club_id;
    new.athlete_id := old.athlete_id;
    new.period := old.period;
    new.amount := old.amount;
    new.due_date := old.due_date;
    new.method := old.method;
    new.receipt_url := old.receipt_url;
    new.plan_id := old.plan_id;
    new.created_at := old.created_at;
    new.last_reminder_sent_at := old.last_reminder_sent_at;
  end if;
  return new;
end;
$$;

create or replace function public.groups_lock_non_coordinator_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not coalesce(public.is_admin_tier(), false) then
    new.club_id := old.club_id;
    new.branch := old.branch;
    new.name := old.name;
    new.venue_id := old.venue_id;
    new.athlete_type := old.athlete_type;
    new.fixed_schedule := old.fixed_schedule;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
