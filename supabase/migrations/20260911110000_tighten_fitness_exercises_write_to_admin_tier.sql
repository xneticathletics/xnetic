-- Tam uygulama taramasında bulunan: fitness_exercises_insert/update
-- "is_admin_tier() or current_user_role() = 'coach'" idi — yani HERHANGİ
-- bir antrenör hareket kütüphanesine ekleme/düzenleme yapabiliyordu. Oysa
-- mobil arayüzün kendi kodu ve yorumları ("Düzenleme sadece club_admin,
-- branş koordinatörü ve süper admine açık — sıradan antrenör artık hareket
-- düzenleyemez" — FitnessCategoryScreen.tsx, FitnessTrainingScreen.tsx'teki
-- canAdd) net şekilde sadece admin/koordinatöre izin veriyor; DELETE zaten
-- doğru şekilde is_admin_tier() or is_branch_coordinator() idi. RLS'i UI'ın
-- (ve nutrition_foods/nutrition_recipes/performance_test_catalog'un zaten
-- kullandığı) niyetiyle hizalıyoruz.
drop policy if exists fitness_exercises_insert on public.fitness_exercises;
create policy fitness_exercises_insert on public.fitness_exercises for insert
  with check (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and is_super_admin())
  );

drop policy if exists fitness_exercises_update on public.fitness_exercises;
create policy fitness_exercises_update on public.fitness_exercises for update
  using (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and (is_branch_coordinator() or current_user_role() = any (array['club_admin','super_admin'])))
  )
  with check (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and (is_branch_coordinator() or current_user_role() = any (array['club_admin','super_admin'])))
  );
