-- Denetim kaydı (audit log) — hassas/yönetimsel işlemleri kim/ne zaman/
-- hangi IP'den yaptığını kalıcı olarak kaydeder. Bir club_admin'in kendini
-- süper admin yapabildiği (bkz. 20260909110000) az önce bulunan kritik
-- açığın ardından: "istismar edilmiş olsaydı fark eder miydik" sorusuna
-- cevap. Sadece BAŞARILI işlemler loglanıyor (engellenen girişimleri de
-- loglamak, Postgres'te "işlemi geri al ama logu kalıcı tut" -autonomous
-- transaction- gerektirir, bu net faydaya göre gereksiz karmaşıklık).
-- Otomatik silme YOK — güvenlik kaydının amacı kalıcı olmak.
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_user_id uuid references public.users(id),
  actor_email text,
  actor_role text,
  club_id uuid references public.clubs(id),
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb,
  ip_address text
);

create index audit_log_created_at_idx on public.audit_log(created_at desc);
create index audit_log_club_id_idx on public.audit_log(club_id);

alter table public.audit_log enable row level security;

-- Append-only: hiçbir rol için insert/update/delete politikası YOK —
-- kayıtlar sadece SECURITY DEFINER trigger'lar/fonksiyonlar ya da
-- service-role Edge Function'lar üzerinden yazılabilir, client'tan asla
-- değiştirilemez/silinemez (kurcalanamaz denetim izi).
create policy "audit_log_select_super_admin" on public.audit_log
  for select to authenticated
  using (is_super_admin());

create policy "audit_log_select_club_admin_own_club" on public.audit_log
  for select to authenticated
  using (club_id is not null and club_id = current_club_id() and is_admin_tier());

-- PostgREST gerçek bir istekte tüm HTTP header'larını 'request.headers'
-- GUC'una JSON olarak yazıyor (canlı testte doğrulandı) — bu sayede hem
-- web hem mobil'den gelen isteklerde IP'yi trigger içinden okuyabiliyoruz.
create or replace function public.request_ip()
returns text
language sql
stable
set search_path to 'public'
as $$
  select coalesce(
    nullif(current_setting('request.headers', true)::jsonb ->> 'cf-connecting-ip', ''),
    nullif(current_setting('request.headers', true)::jsonb ->> 'x-real-ip', ''),
    nullif(split_part(current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for', ',', 1), '')
  );
$$;

create or replace function public.current_app_user()
returns table(id uuid, email text, role text)
language sql
stable
security definer
set search_path to 'public'
as $$
  select u.id, u.email, u.role::text from users u where u.auth_user_id = auth.uid();
$$;

revoke execute on function public.request_ip() from public;
grant execute on function public.request_ip() to authenticated;
revoke execute on function public.current_app_user() from public;
grant execute on function public.current_app_user() to authenticated;

-- ---------------------------------------------------------------------
-- 1) role='super_admin' başarılı yazımı (bootstrap ya da mevcut bir süper
-- adminin ataması — 20260909110000'deki BEFORE trigger zaten bunun
-- DIŞINDAKİ her durumu reddediyor, buraya sadece başarılı olanlar düşer).
create or replace function public.audit_log_role_super_admin()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_actor record;
begin
  if new.role = 'super_admin' and (tg_op = 'INSERT' or old.role is distinct from new.role) then
    select * into v_actor from public.current_app_user();
    insert into audit_log (actor_user_id, actor_email, actor_role, club_id, action, target_type, target_id, details, ip_address)
    values (
      v_actor.id, v_actor.email, v_actor.role,
      null, 'role_escalated_to_super_admin', 'user', new.id,
      jsonb_build_object('caller_pg_role', auth.role(), 'target_email', new.email),
      public.request_ip()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_log_role_super_admin on public.users;
create trigger trg_audit_log_role_super_admin
  after insert or update on public.users
  for each row execute function public.audit_log_role_super_admin();

-- 2) users.is_active değişikliği (aktif/pasif etme).
create or replace function public.audit_log_user_active_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_actor record;
begin
  if old.is_active is distinct from new.is_active then
    select * into v_actor from public.current_app_user();
    insert into audit_log (actor_user_id, actor_email, actor_role, club_id, action, target_type, target_id, details, ip_address)
    values (
      v_actor.id, v_actor.email, v_actor.role,
      new.club_id, case when new.is_active then 'user_reactivated' else 'user_deactivated' end,
      'user', new.id,
      jsonb_build_object('target_email', new.email, 'target_role', new.role),
      public.request_ip()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_log_user_active_change on public.users;
create trigger trg_audit_log_user_active_change
  after update on public.users
  for each row execute function public.audit_log_user_active_change();

-- 3) club_subscriptions insert/update (abonelik onayı/değişikliği —
-- upsertSubscription(), sadece süper admin bu tabloya yazabiliyor).
create or replace function public.audit_log_subscription_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_actor record;
begin
  select * into v_actor from public.current_app_user();
  insert into audit_log (actor_user_id, actor_email, actor_role, club_id, action, target_type, target_id, details, ip_address)
  values (
    v_actor.id, v_actor.email, v_actor.role,
    new.club_id, 'subscription_updated', 'club_subscription', new.id,
    jsonb_build_object(
      'status', new.status, 'billing_period', new.billing_period, 'amount_try', new.amount_try,
      'previous_status', case when tg_op = 'UPDATE' then old.status else null end
    ),
    public.request_ip()
  );
  return new;
end;
$$;

drop trigger if exists trg_audit_log_subscription_change on public.club_subscriptions;
create trigger trg_audit_log_subscription_change
  after insert or update on public.club_subscriptions
  for each row execute function public.audit_log_subscription_change();
