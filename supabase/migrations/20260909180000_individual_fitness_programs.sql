-- "Bireysel Fitness Programım" — sporcunun kulüpten bağımsız, kendi
-- yazdığı hareket listesi. Gerçek ağırlık/set/tekrar günlüğü ayrı bir
-- tabloya değil, zaten var olan fitness_measurements'a yazılıyor (aynı
-- exercise_key sözlüğünü paylaşıyorlar) — böylece AthleteFitnessViewScreen
-- "Egzersiz Geçmişi" hem atanmış programdan hem bireysel programdan gelen
-- kayıtları otomatik birleşik gösteriyor. Burada sadece "hangi hareketleri
-- kendi programıma koydum" kısmı için iki yeni tablo gerekiyor.
create table public.individual_fitness_programs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index individual_fitness_programs_athlete_idx on public.individual_fitness_programs(athlete_id);

create table public.individual_fitness_program_items (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  program_id uuid not null references public.individual_fitness_programs(id) on delete cascade,
  category text not null,
  exercise_key text not null,
  exercise_name text not null,
  sets int not null,
  reps int not null,
  sort_order int not null default 0
);
create index individual_fitness_program_items_program_idx on public.individual_fitness_program_items(program_id);

alter table public.individual_fitness_programs enable row level security;
alter table public.individual_fitness_program_items enable row level security;

-- Sahibi (sporcu ya da velisi — fitness_program_completions'taki
-- is_my_athlete emsaliyle aynı) tam CRUD; admin gözetim/destek için
-- tam CRUD. Antrenör/koordinatör bilerek YOK — "bireysel", sporcunun
-- kendi yazdığı bir şey, kulüp tarafının içeriğine karışmıyor. Gerçek
-- performans verisi zaten fitness_measurements üzerinden antrenör/admin'e
-- görünür kalıyor (fitness_coach_select / fitness_admin_all).
create policy "ind_fit_prog_admin_all" on public.individual_fitness_programs
  for all to authenticated
  using (club_id = current_club_id() and is_admin_tier())
  with check (club_id = current_club_id() and is_admin_tier());

create policy "ind_fit_prog_own_all" on public.individual_fitness_programs
  for all to authenticated
  using (club_id = current_club_id() and is_my_athlete(athlete_id))
  with check (club_id = current_club_id() and is_my_athlete(athlete_id));

create policy "ind_fit_items_admin_all" on public.individual_fitness_program_items
  for all to authenticated
  using (club_id = current_club_id() and is_admin_tier())
  with check (club_id = current_club_id() and is_admin_tier());

create policy "ind_fit_items_own_all" on public.individual_fitness_program_items
  for all to authenticated
  using (
    club_id = current_club_id()
    and exists (
      select 1 from public.individual_fitness_programs p
      where p.id = program_id and is_my_athlete(p.athlete_id)
    )
  )
  with check (
    club_id = current_club_id()
    and exists (
      select 1 from public.individual_fitness_programs p
      where p.id = program_id and is_my_athlete(p.athlete_id)
    )
  );
