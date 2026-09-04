-- Fitness Grupları: normal antrenman/yoklama gruplarından (groups) tamamen
-- bağımsız — bir branştaki tüm müsabık (athlete_type='musabik') sporculardan
-- serbestçe seçilmiş, sadece fitness programı ataması için kullanılan özel
-- kümeler. "roster-shaped" tablolar için kullanılan mevcut kulüp-geneli
-- okuma/yazma deseni (tenant_isolation_<table>) burada da uygulanıyor —
-- bkz. groups/fitness_programs tabloları.

create table public.fitness_groups (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null,
  name text not null,
  branch text not null,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create trigger trg_set_club_id
  before insert on public.fitness_groups
  for each row execute function public.set_club_id_from_jwt();

alter table public.fitness_groups enable row level security;

create policy tenant_isolation_fitness_groups on public.fitness_groups
  for all
  using (club_id = current_club_id())
  with check (club_id = current_club_id());

grant select, insert, update, delete on table public.fitness_groups to anon, authenticated, postgres, service_role;

-- Hangi sporcuların bu fitness grubunda olduğu — athlete_groups'un aynısı
-- bir join-table deseni.
create table public.fitness_group_members (
  fitness_group_id uuid not null references public.fitness_groups(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  primary key (fitness_group_id, athlete_id)
);

alter table public.fitness_group_members enable row level security;

create policy tenant_isolation_fitness_group_members on public.fitness_group_members
  for all
  using (exists (
    select 1 from public.fitness_groups fg
    where fg.id = fitness_group_members.fitness_group_id and fg.club_id = current_club_id()
  ))
  with check (exists (
    select 1 from public.fitness_groups fg
    where fg.id = fitness_group_members.fitness_group_id and fg.club_id = current_club_id()
  ));

grant select, insert, update, delete on table public.fitness_group_members to anon, authenticated, postgres, service_role;

-- fitness_programs artık normal bir gruba YA DA bir fitness grubuna
-- atanabilir (ikisinden tam biri — XOR). fitness_group_id kasıtlı olarak
-- ON DELETE CASCADE değil: bir fitness grubu, ona atanmış programlar
-- varken silinemez (uygulama tarafı bunu 23503 hatasını yakalayıp
-- anlaşılır bir mesaja çeviriyor — bkz. deleteFitnessGroup).
alter table public.fitness_programs alter column group_id drop not null;
alter table public.fitness_programs add column fitness_group_id uuid references public.fitness_groups(id);
alter table public.fitness_programs add constraint fitness_programs_target_xor
  check ((group_id is not null) <> (fitness_group_id is not null));
