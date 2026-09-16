-- fitness_groups_write, "coach" rolündeki HERKESE (düz antrenör dahil)
-- fitness grubu oluşturma izni veriyordu. Artık sadece admin, branş
-- koordinatörü (diğer politikalarda zaten bu ikisi birlikte kullanılıyor,
-- bkz. fitness_groups_delete) ve en az bir salonun yetkilisi olan
-- antrenör oluşturabilir. is_venue_authority() belirli bir venue_id
-- istiyor ama fitness_groups'ta hiç venue kolonu yok — "en az bir salonun
-- yetkilisi miyim" diye HANGİ salon olduğuna bakmayan yeni bir yardımcı
-- fonksiyon gerekiyor.
create or replace function public.is_any_venue_authority()
returns boolean
language plpgsql
stable security definer
set search_path to 'public'
as $$
begin
  return exists (
    select 1 from venue_coaches vc
    join users u on u.id = vc.coach_id
    where u.auth_user_id = auth.uid()
  );
end;
$$;

revoke execute on function public.is_any_venue_authority() from public;
grant execute on function public.is_any_venue_authority() to authenticated;

drop policy if exists "fitness_groups_write" on public.fitness_groups;
create policy "fitness_groups_write" on public.fitness_groups
  for insert to authenticated
  with check (
    club_id = current_club_id()
    and (is_admin_tier() or is_branch_coordinator() or is_any_venue_authority())
  );
