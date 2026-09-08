-- Canlı testte bulunan kök sorun: users tablosunda bir antrenörün BAŞKA
-- bir antrenörü görebilmesini sağlayan HİÇBİR SELECT politikası yokmuş
-- (var olanlar sadece "veli kendi çocuğunun koçunu görür" / "koç kendi
-- sporcusunun velisini görür" yönünde — coach-to-coach hiç kapsanmıyor).
-- Bu bugüne kadar hiç fark edilmemiş çünkü CoachesListScreen'e (Antrenörler)
-- koordinatör dünkü güne kadar hiç erişemiyordu — sadece admin (is_admin_tier,
-- users_admin_all ile zaten her şeyi görüyor) erişiyordu. Dün eklenen
-- "Antrenörler" kutucuğuyla bu gerçek eksiklik ortaya çıktı: koordinatör
-- listede SADECE KENDİ satırını görüyordu (canlıda doğrulandı: total=1).
--
-- Bu da dünkü coach_branches/coach_leaves/users UPDATE politikalarımın
-- neden çalışmadığını açıklıyor — hepsi "exists (select 1 from users u
-- where u.id = ...)" şeklinde DOĞRUDAN users'a bakıyordu, ama hedef
-- antrenörün satırı zaten RLS'te hiç görünmediği için bu exists hep FALSE
-- dönüyordu. Çözüm: users tablosuna gerçek bir "koordinatör kendi
-- branşındaki antrenörleri görebilir" SELECT politikası eklemek — ve
-- bunu (coach_branches/branches/users'a çapraz bakan) SECURITY DEFINER
-- bir fonksiyonla yapmak, aksi halde coach_branches_select'in KENDİSİ de
-- users'a baktığı için iç içe RLS bağımlılığı oluşuyor.
create or replace function public.is_my_coordinated_branch_coach(target_user_id uuid)
returns boolean
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  v_my_id uuid;
begin
  select id into v_my_id from users where auth_user_id = auth.uid();
  if v_my_id is null then return false; end if;
  return exists (
    select 1 from coach_branches cb
    join branches b on b.id = cb.branch_id
    where cb.coach_id = target_user_id
    and b.coordinator_user_id = v_my_id
    and b.club_id = current_club_id()
  );
end;
$$;

revoke execute on function public.is_my_coordinated_branch_coach(uuid) from public;
grant execute on function public.is_my_coordinated_branch_coach(uuid) to authenticated;

-- Kök düzeltme: koordinatör artık kendi branşındaki antrenörleri
-- GÖREBİLİYOR (CoachesListScreen'in gerçekten çalışması için şart).
create policy "users_select_coordinator_branch_coaches" on public.users
  for select to authenticated
  using (club_id = current_club_id() and role = 'coach' and public.is_my_coordinated_branch_coach(id));

-- Dünkü users UPDATE politikasını aynı (artık RLS-döngüsüz) yardımcı
-- fonksiyonla yeniden yazıyoruz.
drop policy if exists "users_coordinator_update_branch_coaches" on public.users;
create policy "users_coordinator_update_branch_coaches" on public.users
  for update to authenticated
  using (club_id = current_club_id() and role = 'coach' and public.is_my_coordinated_branch_coach(id))
  with check (club_id = current_club_id() and role = 'coach' and public.is_my_coordinated_branch_coach(id));

-- coach_leaves de aynı şekilde sadeleştirildi.
drop policy if exists "coach_leaves_coordinator_write" on public.coach_leaves;
create policy "coach_leaves_coordinator_write" on public.coach_leaves
  for all to authenticated
  using (club_id = current_club_id() and public.is_my_coordinated_branch_coach(coach_id))
  with check (club_id = current_club_id() and public.is_my_coordinated_branch_coach(coach_id));
