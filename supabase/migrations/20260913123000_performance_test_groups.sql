-- "Test Grubu": admin/branş koordinatörünün bir seferde sporcu seçip
-- (bir gruptan toplu + tek tek ekleme/çıkarma), uygulanacak testleri seçip
-- oluşturduğu, kalıcı/isimlendirilmiş bir test seansı — daha sonra tekrar
-- açılıp o sporcu×test matrisine ölçüm girilebiliyor. Global (kulüpler
-- arası) bir kavram değil, her zaman tek bir kulübe ait olduğu için diğer
-- katalog tablolarının (performance_test_catalog vb.) aksine club_id NOT
-- NULL — yine de aynı set_club_id_from_jwt trigger'ını kullanıyoruz ki
-- client hiç club_id göndermesin (admin/koordinatörün current_club_id()'si
-- her zaman kendi kulübü, hiçbir zaman NULL değil).
create table public.performance_test_groups (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.performance_test_group_athletes (
  test_group_id uuid not null references public.performance_test_groups(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  primary key (test_group_id, athlete_id)
);

create table public.performance_test_group_tests (
  test_group_id uuid not null references public.performance_test_groups(id) on delete cascade,
  test_id uuid not null references public.performance_test_catalog(id) on delete cascade,
  primary key (test_group_id, test_id)
);

create index performance_test_groups_club_id_idx on public.performance_test_groups(club_id);
create index performance_test_group_athletes_athlete_idx on public.performance_test_group_athletes(athlete_id);
create index performance_test_group_tests_test_idx on public.performance_test_group_tests(test_id);

alter table public.performance_test_groups enable row level security;
alter table public.performance_test_group_athletes enable row level security;
alter table public.performance_test_group_tests enable row level security;

create trigger trg_set_club_id
  before insert on public.performance_test_groups
  for each row
  execute function public.set_club_id_from_jwt();

-- Test grubu yönetimi (oluşturma/görme/silme) sadece admin ve branş
-- koordinatörüne açık — "admin, branş koordinatörünün ekleyebildiği"
-- isteğiyle birebir aynı yetki şekli performance_test_catalog/categories'de
-- kullanılan desenin bu tabloya uyarlanmış hâli.
create policy "performance_test_groups_select" on public.performance_test_groups
  for select to authenticated
  using (club_id = public.current_club_id() and (public.is_admin_tier() or public.is_branch_coordinator()));

create policy "performance_test_groups_insert" on public.performance_test_groups
  for insert to authenticated
  with check (club_id = public.current_club_id() and (public.is_admin_tier() or public.is_branch_coordinator()));

create policy "performance_test_groups_delete" on public.performance_test_groups
  for delete to authenticated
  using (club_id = public.current_club_id() and (public.is_admin_tier() or public.is_branch_coordinator()));

-- İki junction tablosu da yetkiyi üst (parent) test grubundan miras alıyor.
create policy "performance_test_group_athletes_all" on public.performance_test_group_athletes
  for all to authenticated
  using (exists (
    select 1 from public.performance_test_groups g
    where g.id = test_group_id and g.club_id = public.current_club_id()
      and (public.is_admin_tier() or public.is_branch_coordinator())
  ))
  with check (exists (
    select 1 from public.performance_test_groups g
    where g.id = test_group_id and g.club_id = public.current_club_id()
      and (public.is_admin_tier() or public.is_branch_coordinator())
  ));

create policy "performance_test_group_tests_all" on public.performance_test_group_tests
  for all to authenticated
  using (exists (
    select 1 from public.performance_test_groups g
    where g.id = test_group_id and g.club_id = public.current_club_id()
      and (public.is_admin_tier() or public.is_branch_coordinator())
  ))
  with check (exists (
    select 1 from public.performance_test_groups g
    where g.id = test_group_id and g.club_id = public.current_club_id()
      and (public.is_admin_tier() or public.is_branch_coordinator())
  ));

revoke all on public.performance_test_groups from anon;
revoke all on public.performance_test_group_athletes from anon;
revoke all on public.performance_test_group_tests from anon;
grant select, insert, delete on public.performance_test_groups to authenticated;
grant select, insert, delete on public.performance_test_group_athletes to authenticated;
grant select, insert, delete on public.performance_test_group_tests to authenticated;
