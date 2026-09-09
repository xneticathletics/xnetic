-- social_posts'ta bulunan sınıfın aynısı: "for all"/"for update" politikaları
-- sadece SATIRIN kimin yetkisinde olduğunu (status/branch/ilişki) kontrol
-- ediyor, HANGİ KOLONLARIN değiştiğini kısıtlamıyordu. Sınırlı yetkili bir
-- aktör (branş koordinatörü), meşru tek bir alanı değiştirmesi gereken bir
-- işlemin (ödemeyi ödendi işaretle / bir gruba baş antrenör ata) içine
-- ilgisiz kolon değişikliklerini de sokabiliyordu. Admin'in bu tablolar
-- üzerindeki meşru serbest düzenleme hakkı ETKİLENMİYOR — kilit sadece
-- is_admin_tier() OLMAYAN aktörler için devreye giriyor.

-- 1) payments — bir branş koordinatörü, "ödendi işaretle" (yalnızca
-- status+paid_at değişmeli) çağrısının içine amount/athlete_id/plan_id/
-- due_date/period değişikliklerini de sokup tutarı sıfırlayabiliyor ya da
-- ödemeyi başka bir plana/sporcuya yönlendirebiliyordu (canlıda
-- doğrulanmadı ama social_posts'taki ile birebir aynı politika şekli —
-- payments_coordinator_all, bkz. 20260908020000_coordinator_payments_access.sql).
create or replace function public.payments_lock_paid_transition_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin_tier() and old.status = 'pending' and new.status = 'paid' then
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

drop trigger if exists trg_payments_lock_paid_transition on public.payments;
create trigger trg_payments_lock_paid_transition
  before update on public.payments
  for each row execute function public.payments_lock_paid_transition_columns();

-- 2) groups — bir branş koordinatörünün meşru tek işlemi "bir gruba baş
-- antrenör ata" (head_coach_id) iken, groups_coordinator_update politikası
-- ve paylaşılan updateGroup() fonksiyonu aynı çağrıda name/venue_id/
-- athlete_type/fixed_schedule/branch değişikliğine de izin veriyordu —
-- bu alanları düzenleyen tam form (GroupFormScreen) zaten koordinatöre
-- hiç gösterilmiyor, yani bu sadece UI'ı atlayan bir REST çağrısıyla
-- erişilebilen, hiç kullanılması amaçlanmamış bir yetkiydi.
create or replace function public.groups_lock_non_coordinator_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin_tier() then
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

drop trigger if exists trg_groups_lock_non_coordinator_columns on public.groups;
create trigger trg_groups_lock_non_coordinator_columns
  before update on public.groups
  for each row execute function public.groups_lock_non_coordinator_columns();
