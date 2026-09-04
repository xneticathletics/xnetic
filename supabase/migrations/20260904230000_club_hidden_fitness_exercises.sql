-- Kulüpler, GLOBAL fitness hareketlerini (club_id null) kendi görünümlerinden
-- gizleyebilsin — hareketin kendisine (globale) hiçbir şekilde dokunmadan,
-- sadece "bu kulüp için görünmez" diye işaretleyerek. Böylece bir kulüp
-- ilgilenmediği hareketleri sadeleştirip listeden kaldırabilir, istediği an
-- geri açabilir; başka hiçbir kulübü ya da global kataloğu etkilemez.
create table public.club_hidden_fitness_exercises (
  club_id uuid not null references public.clubs(id) on delete cascade,
  exercise_id uuid not null references public.fitness_exercises(id) on delete cascade,
  hidden_at timestamp with time zone not null default now(),
  primary key (club_id, exercise_id)
);

alter table public.club_hidden_fitness_exercises enable row level security;

create trigger trg_set_club_id
  before insert on public.club_hidden_fitness_exercises
  for each row
  execute function public.set_club_id_from_jwt();

create policy "club_hidden_fitness_exercises_select" on public.club_hidden_fitness_exercises
  for select to PUBLIC
  using (club_id = public.current_club_id());

-- Sadece kulüp admini gizleyebilir, ve sadece GLOBAL (club_id null)
-- hareketler için — kulübün kendi eklediği özel hareketleri zaten
-- doğrudan silebiliyor, bu tabloya hiç girmesine gerek yok.
create policy "club_hidden_fitness_exercises_insert" on public.club_hidden_fitness_exercises
  for insert to PUBLIC
  with check (
    club_id = public.current_club_id()
    and public.current_user_role() = 'club_admin'
    and exists (select 1 from public.fitness_exercises fe where fe.id = exercise_id and fe.club_id is null)
  );

create policy "club_hidden_fitness_exercises_delete" on public.club_hidden_fitness_exercises
  for delete to PUBLIC
  using (club_id = public.current_club_id() and public.current_user_role() = 'club_admin');
