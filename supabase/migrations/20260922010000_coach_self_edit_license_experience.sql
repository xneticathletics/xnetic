-- Antrenör kendi belge numarasını ve deneyim yılını, onboarding bittikten
-- SONRA da düzenleyebilsin (Kişisel Bilgiler ekranından).
--
-- Önceki durum: coach_branches'e kendi satırına yazma izni SADECE
-- onboarding sürerken açıktı (coach_branches_self_onboarding_write —
-- my_onboarding_completed() = false şartı). Tamamlandıktan sonra
-- yalnızca admin/koordinatör güncelleyebiliyordu; antrenör kendi belge
-- no'sunu/deneyim yılını sonradan güncelleyemiyordu.
--
-- Branş ve kademe (level) admin/koordinatör kontrolünde kalmalı — bu
-- yüzden self-update politikası branş/kademe/coach_id DEĞİŞTİRMEYE izin
-- vermiyor, bir tetikleyici bu sütunları antrenörün kendi güncellemesinde
-- eski değerine sabitliyor (users_lock_coordinator_editable_columns ile
-- aynı desen).
drop policy if exists "coach_branches_self_update" on public.coach_branches;
create policy "coach_branches_self_update" on public.coach_branches
  for update to authenticated
  using (coach_id = public.my_user_id())
  with check (coach_id = public.my_user_id());

create or replace function public.coach_branches_lock_self_editable_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.role() = 'authenticated'
     and not coalesce(public.is_admin_tier(), false)
     and not coalesce(public.is_branch_coordinator(), false)
  then
    new.coach_id := old.coach_id;
    new.branch_id := old.branch_id;
    new.level := old.level;
  end if;
  return new;
end;
$$;
revoke all on function public.coach_branches_lock_self_editable_columns() from public, anon, authenticated;

drop trigger if exists trg_coach_branches_lock_self_columns on public.coach_branches;
create trigger trg_coach_branches_lock_self_columns before update on public.coach_branches
  for each row execute function public.coach_branches_lock_self_editable_columns();
