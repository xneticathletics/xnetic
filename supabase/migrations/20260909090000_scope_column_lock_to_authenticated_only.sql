-- 20260909080000'deki düzeltme bir adım daha ileri gitmesi gerekiyordu:
-- "not coalesce(is_admin_tier(), false)" tek başına, service-role Edge
-- Function'lardan (delete-club, seed-standing-test-club vb.) ya da
-- düz postgres/migration bağlamından (hiç JWT context'i olmayan
-- oturumlar — is_admin_tier() bunlarda da NULL döner) gelen MEŞRU
-- güncellemeleri de yanlışlıkla kilitliyordu — canlıda doğrulandı: bir
-- admin testinin kendi temizlik güncellemesi (raw postgres bağlamında)
-- sessizce reddedildi. auth.role() — PostgREST/JWT'nin 'role' claim'i
-- (authenticated/service_role/anon), app_role'den (coach/club_admin)
-- FARKLI ve ayrı bir alan — sadece GERÇEK bir 'authenticated' oturumu
-- (yani normal bir son kullanıcı) için kilidi devreye sokuyor;
-- service_role ve JWT context'i hiç olmayan (migration/psql) çağrılar
-- etkilenmiyor.
create or replace function public.payments_lock_paid_transition_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.role() = 'authenticated' and not coalesce(public.is_admin_tier(), false)
     and old.status = 'pending' and new.status = 'paid' then
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
  if auth.role() = 'authenticated' and not coalesce(public.is_admin_tier(), false) then
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
