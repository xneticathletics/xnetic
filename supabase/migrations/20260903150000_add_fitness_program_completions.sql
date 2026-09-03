-- Sporcunun kendisine/velisine gönderilen fitness programını "tamamladım"
-- diyebilmesi + isteğe bağlı not bırakabilmesi için — antrenörün artık
-- programın gerçekten yapılıp yapılmadığını görebilmesi amacıyla.
-- fitness_measurements ile birebir aynı RLS deseni izleniyor.
create table if not exists "public"."fitness_program_completions" (
  "id"           uuid                     not null default gen_random_uuid(),
  "club_id"      uuid                     not null,
  "program_id"   uuid                     not null,
  "athlete_id"   uuid                     not null,
  "completed_at" timestamp with time zone not null default now(),
  "note"         text,
  "created_at"   timestamp with time zone not null default now(),
  constraint "fitness_program_completions_pkey" primary key (id),
  constraint "fitness_program_completions_program_id_fkey" foreign key (program_id) references public.fitness_programs(id) on delete cascade,
  constraint "fitness_program_completions_athlete_id_fkey" foreign key (athlete_id) references public.athletes(id) on delete cascade
);

alter table "public"."fitness_program_completions" enable row level security;

create index if not exists idx_fitness_program_completions_program on public.fitness_program_completions using btree (program_id, completed_at desc);
create index if not exists idx_fitness_program_completions_athlete on public.fitness_program_completions using btree (athlete_id, completed_at desc);

drop trigger if exists trg_set_club_id on public.fitness_program_completions;
create trigger trg_set_club_id
  before insert on public.fitness_program_completions
  for each row
  execute function public.set_club_id_from_jwt();

drop policy if exists "fitness_completions_admin_all" on "public"."fitness_program_completions";
create policy "fitness_completions_admin_all" on "public"."fitness_program_completions"
  for all to PUBLIC
  using (((club_id = public.current_club_id()) AND public.is_admin_tier()))
  with check (((club_id = public.current_club_id()) AND public.is_admin_tier()));

drop policy if exists "fitness_completions_coach_select" on "public"."fitness_program_completions";
create policy "fitness_completions_coach_select" on "public"."fitness_program_completions"
  for select to PUBLIC
  using (((club_id = public.current_club_id()) AND public.is_athletes_coach(athlete_id)));

drop policy if exists "fitness_completions_coach_insert" on "public"."fitness_program_completions";
create policy "fitness_completions_coach_insert" on "public"."fitness_program_completions"
  for insert to PUBLIC
  with check (((club_id = public.current_club_id()) AND public.is_athletes_coach(athlete_id)));

drop policy if exists "fitness_completions_coach_delete" on "public"."fitness_program_completions";
create policy "fitness_completions_coach_delete" on "public"."fitness_program_completions"
  for delete to PUBLIC
  using (((club_id = public.current_club_id()) AND public.is_athletes_coach(athlete_id)));

drop policy if exists "fitness_completions_own_select" on "public"."fitness_program_completions";
create policy "fitness_completions_own_select" on "public"."fitness_program_completions"
  for select to PUBLIC
  using (((club_id = public.current_club_id()) AND public.is_my_athlete(athlete_id)));

drop policy if exists "fitness_completions_own_insert" on "public"."fitness_program_completions";
create policy "fitness_completions_own_insert" on "public"."fitness_program_completions"
  for insert to PUBLIC
  with check (((club_id = public.current_club_id()) AND public.is_my_athlete(athlete_id)));

drop policy if exists "fitness_completions_own_delete" on "public"."fitness_program_completions";
create policy "fitness_completions_own_delete" on "public"."fitness_program_completions"
  for delete to PUBLIC
  using (((club_id = public.current_club_id()) AND public.is_my_athlete(athlete_id)));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."fitness_program_completions" to "anon", "authenticated", "postgres", "service_role";
