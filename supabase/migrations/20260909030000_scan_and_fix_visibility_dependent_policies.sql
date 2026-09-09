-- notifications_insert_club'daki bug'ın (bkz. migration 20260909020000)
-- aynı sınıfından başka örnekler var mı diye tüm RLS politikaları tarandı
-- ("EXISTS (select ... from users where u.id = <BAŞKA BİR SATIR> and ...)"
-- şeklinde, kendi satırımı DEĞİL başka birinin satırını kontrol eden ve
-- bir güvenlik fonksiyonuna sarılmamış her yer aday). Kendi satırını
-- kontrol edenler (u.auth_user_id = auth.uid()) güvenli — herkes kendi
-- satırını her zaman görür. Aşağıdaki ikisi GERÇEK örnekler:
--
-- 1) coach_branches_coordinator_write — koordinatör bir antrenöre kendi
--    branşında İLK KEZ branş ataması yaparken (o antrenörün coach_branches'ta
--    henüz hiç satırı yokken), users_select_coordinator_branch_coaches
--    onu göremiyor, bu yüzden bu politikanın kendi içindeki "users"
--    kontrolü sessizce reddediyordu. (coach_branches_admin_* de aynı
--    kalıbı taşıyor ama admin zaten users_admin_all ile herkesi gördüğü
--    için pratikte hiç tetiklenmiyordu — yine de tutarlılık için düzeltildi.)
-- 2) user_photos_select — bir kullanıcının profil fotoğrafını GÖRMEK,
--    fotoğrafı görüntüleyenin o kullanıcıyı zaten "users" üzerinden
--    görebiliyor olmasını şart koşuyordu — ör. bir veli, kendi
--    çocuğunun DOĞRUDAN koçu olmayan bir antrenörün (ya da başka bir
--    velinin) profil fotoğrafını göremiyordu.
--
-- Çözüm: "bu kullanıcı gerçekten benim kulübümde mi" kontrolünü RLS'ten
-- bağımsız, genel bir SECURITY DEFINER fonksiyona taşımak.
create or replace function public.is_user_in_my_club(target_user_id uuid)
returns boolean
language plpgsql
stable security definer
set search_path to 'public'
as $$
begin
  return exists (
    select 1 from users
    where id = target_user_id
    and club_id = current_club_id()
  );
end;
$$;

revoke execute on function public.is_user_in_my_club(uuid) from public;
grant execute on function public.is_user_in_my_club(uuid) to authenticated;

drop policy if exists "coach_branches_admin_write" on public.coach_branches;
create policy "coach_branches_admin_write" on public.coach_branches
  for insert to authenticated
  with check (is_admin_tier() and is_user_in_my_club(coach_id));

drop policy if exists "coach_branches_admin_update" on public.coach_branches;
create policy "coach_branches_admin_update" on public.coach_branches
  for update to authenticated
  using (is_admin_tier() and is_user_in_my_club(coach_id))
  with check (is_admin_tier() and is_user_in_my_club(coach_id));

drop policy if exists "coach_branches_admin_delete" on public.coach_branches;
create policy "coach_branches_admin_delete" on public.coach_branches
  for delete to authenticated
  using (is_admin_tier() and is_user_in_my_club(coach_id));

drop policy if exists "coach_branches_coordinator_write" on public.coach_branches;
create policy "coach_branches_coordinator_write" on public.coach_branches
  for all to authenticated
  using (
    is_user_in_my_club(coach_id)
    and exists (select 1 from branches b where b.id = coach_branches.branch_id and is_my_coordinator_branch(b.name))
  )
  with check (
    is_user_in_my_club(coach_id)
    and exists (select 1 from branches b where b.id = coach_branches.branch_id and is_my_coordinator_branch(b.name))
  );

drop policy if exists "user_photos_select" on storage.objects;
create policy "user_photos_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'user-photos'
    and public.is_user_in_my_club(((storage.foldername(storage.objects.name))[1])::uuid)
  );
