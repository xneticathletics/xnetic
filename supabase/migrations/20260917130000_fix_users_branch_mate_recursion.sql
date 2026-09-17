-- ACİL DÜZELTME: bir önceki migration (20260917100000) users tablosuna
-- eklediği İKİ yeni SELECT politikasında coach_branches/athletes'e DÜZ bir
-- subquery ile bakıyordu. coach_branches'in KENDİ select politikası ise
-- ("coach_branches_select", migration 20260906193000) users tablosuna
-- DÜZ bir subquery ile bakıyor — sonuç: users politikası → coach_branches
-- politikası → users politikası → ... "infinite recursion detected in
-- policy for relation users" (canlıda Sporcu Yönetimi ekranında görüldü).
-- ATHLETES tablosu da muhtemelen aynı şekilde users'a bakan bir select
-- politikasına sahip (baseline şemada, migration'larda görünmüyor) — aynı
-- kalıp orada da tekrarlanmış olabilir.
--
-- ÇÖZÜM: [[security_rls_visibility_dependent_policy_bug]] — cross-tablo
-- kontrollerini HER ZAMAN SECURITY DEFINER bir fonksiyona sarmalı (bkz.
-- is_my_coordinated_athlete, my_user_id). SECURITY DEFINER fonksiyon
-- içindeki sorgular çağıranın RLS'sine tabi olmadığı için coach_branches/
-- athletes/users'a tekrar dönüp politika tetiklemez, döngü kırılır.
drop policy if exists "users_select_branch_mate_coaches" on public.users;
drop policy if exists "users_select_groupmate_athletes" on public.users;

create or replace function public.is_branch_mate_coach(other_user_id uuid)
returns boolean
language plpgsql
stable security definer
set search_path to 'public'
as $$
begin
  return exists (
    select 1 from coach_branches cb1
    join coach_branches cb2 on cb2.branch_id = cb1.branch_id
    where cb1.coach_id = my_user_id() and cb2.coach_id = other_user_id
  );
end;
$$;

revoke execute on function public.is_branch_mate_coach(uuid) from public;
grant execute on function public.is_branch_mate_coach(uuid) to authenticated;

create or replace function public.is_groupmate_athlete(other_user_id uuid)
returns boolean
language plpgsql
stable security definer
set search_path to 'public'
as $$
begin
  return exists (
    select 1 from athletes a1
    join athletes a2 on a2.group_id = a1.group_id
    where a1.athlete_user_id = my_user_id()
      and a1.group_id is not null
      and a2.athlete_user_id = other_user_id
  );
end;
$$;

revoke execute on function public.is_groupmate_athlete(uuid) from public;
grant execute on function public.is_groupmate_athlete(uuid) to authenticated;

create policy "users_select_branch_mate_coaches" on public.users
  for select to authenticated
  using (club_id = current_club_id() and role = 'coach' and is_branch_mate_coach(id));

create policy "users_select_groupmate_athletes" on public.users
  for select to authenticated
  using (club_id = current_club_id() and role = 'athlete' and is_groupmate_athlete(id));
