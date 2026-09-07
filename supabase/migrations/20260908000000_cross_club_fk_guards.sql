-- RLS her satırı club_id = current_club_id() ile zaten kapsıyor, ama
-- venue_id/group_id/coach_id gibi bir FOREIGN KEY'in kendisinin AYNI
-- kulübe ait olduğunu doğrulayan bir veritabanı kısıtı yoktu — pratikte
-- uygulama üzerinden başka bir kulübün UUID'sini görmek imkansız (venues/
-- groups/users hepsi kendi club_id'sine göre RLS ile filtreleniyor) ama
-- "hiçbir koşulda" garanti değildi. Bu migration, bu üç ilişkiyi trigger
-- seviyesinde sıkılaştırıyor — Postgres CHECK constraint'leri başka
-- tabloya bakamadığı için trigger kullanmak gerekiyor.

create or replace function public.enforce_venue_same_club()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.venue_id is not null and new.club_id <> (select club_id from venues where id = new.venue_id) then
    raise exception 'Seçilen salon başka bir kulübe ait.';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_group_same_club()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.group_id is not null and new.club_id <> (select club_id from groups where id = new.group_id) then
    raise exception 'Seçilen grup başka bir kulübe ait.';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_coach_same_club()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.coach_id is not null and new.club_id <> (select club_id from users where id = new.coach_id) then
    raise exception 'Seçilen antrenör başka bir kulübe ait.';
  end if;
  return new;
end;
$$;

-- training_sessions: hem salon hem grup aynı kulübe ait olmalı.
drop trigger if exists trg_training_sessions_venue_club on public.training_sessions;
create trigger trg_training_sessions_venue_club
  before insert or update on public.training_sessions
  for each row execute function public.enforce_venue_same_club();

drop trigger if exists trg_training_sessions_group_club on public.training_sessions;
create trigger trg_training_sessions_group_club
  before insert or update on public.training_sessions
  for each row execute function public.enforce_group_same_club();

-- training_schedule_templates: aynı şekilde salon + grup.
drop trigger if exists trg_schedule_templates_venue_club on public.training_schedule_templates;
create trigger trg_schedule_templates_venue_club
  before insert or update on public.training_schedule_templates
  for each row execute function public.enforce_venue_same_club();

drop trigger if exists trg_schedule_templates_group_club on public.training_schedule_templates;
create trigger trg_schedule_templates_group_club
  before insert or update on public.training_schedule_templates
  for each row execute function public.enforce_group_same_club();

-- venue_coaches: salon + antrenör aynı kulübe ait olmalı.
drop trigger if exists trg_venue_coaches_venue_club on public.venue_coaches;
create trigger trg_venue_coaches_venue_club
  before insert or update on public.venue_coaches
  for each row execute function public.enforce_venue_same_club();

drop trigger if exists trg_venue_coaches_coach_club on public.venue_coaches;
create trigger trg_venue_coaches_coach_club
  before insert or update on public.venue_coaches
  for each row execute function public.enforce_coach_same_club();
