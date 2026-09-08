-- Yayınlanmış etkinlikler bugüne kadar branch ne olursa olsun kulübün HER
-- üyesine görünüyordu (events_select sadece status='published' bakıyordu,
-- branch eşleşmesine hiç bakmıyordu) — kullanıcı kararı: "hangi branşlar
-- işaretlendiyse yalnızca onlara görünsün". branch=null (kulüp geneli)
-- etkinlikler değişmeden herkese açık kalıyor.
create or replace function public.is_my_branch(p_branch text)
returns boolean
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  v_uid uuid;
begin
  if p_branch is null then return true; end if;
  select id into v_uid from users where auth_user_id = auth.uid();
  if v_uid is null then return false; end if;
  return exists (
    select 1 from athletes a join groups g on g.id = a.group_id
    where g.branch = p_branch and (a.parent_user_id = v_uid or a.athlete_user_id = v_uid)
  ) or exists (
    select 1 from group_coaches gc join groups g on g.id = gc.group_id
    where g.branch = p_branch and gc.coach_id = v_uid
  ) or exists (
    select 1 from groups g where g.branch = p_branch and g.head_coach_id = v_uid
  );
end;
$$;

revoke execute on function public.is_my_branch(text) from public;
grant execute on function public.is_my_branch(text) to authenticated;

drop policy if exists "events_select" on public.events;
create policy "events_select" on public.events
  for select to authenticated
  using (
    club_id = public.current_club_id()
    and (
      (status = 'published' and public.is_my_branch(branch))
      or public.is_admin_tier()
      or public.is_my_coordinator_branch(branch)
    )
  );
