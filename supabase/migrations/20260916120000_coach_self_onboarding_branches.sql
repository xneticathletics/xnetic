-- Antrenör ilk kaydında (CoachOnboardingScreen) kendi branş(lar)ını ve
-- kademesini kaydetmeye çalışıyor ama coach_branches için sadece admin
-- (coach_branches_admin_write) ve branş koordinatörü (coach_branches_
-- coordinator_write) insert/delete yapabiliyordu — antrenörün KENDİ
-- satırını eklemesine izin veren bir politika hiç yoktu. Sonuç: her
-- "Kaydet ve Devam Et" denemesi "new row violates row-level security
-- policy for table coach_branches" ile patlıyor, antrenör onboarding'i
-- hiç tamamlayamıyordu.
--
-- İzni sadece onboarding SIRASINDA (onboarding_completed=false iken)
-- kendi satırlarına açıyoruz — onboarding bittikten sonra branş/kademe
-- değişikliği yine admin/koordinatör kontrolünde kalmalı (bir antrenörün
-- kendi kendine yeni branşlar ekleyip grup atama kısıtlamalarını
-- atlamasını istemiyoruz).
create or replace function public.my_onboarding_completed()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(onboarding_completed, true) from users where id = my_user_id();
$$;

revoke execute on function public.my_onboarding_completed() from public;
grant execute on function public.my_onboarding_completed() to authenticated;

drop policy if exists "coach_branches_self_onboarding_write" on public.coach_branches;
create policy "coach_branches_self_onboarding_write" on public.coach_branches
  for all to authenticated
  using (coach_id = my_user_id() and not my_onboarding_completed())
  with check (coach_id = my_user_id() and not my_onboarding_completed());
