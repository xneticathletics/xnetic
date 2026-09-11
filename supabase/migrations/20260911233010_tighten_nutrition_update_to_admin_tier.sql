-- fitness_exercises_update, 20260911110000'de sıradan (koordinatör
-- olmayan) bir antrenörün global (club_id NULL) kütüphaneyi düzenlemesini
-- engelleyecek şekilde sıkılaştırılmıştı — mobil arayüzün kendi kodu/yorumu
-- ("sıradan antrenör artık hareket düzenleyemez", bkz.
-- NutritionFoodDetailScreen.tsx / NutritionRecipeDetailScreen.tsx'teki
-- BİREBİR AYNI yorum) bu davranışı besinler/tarifler için de zaten
-- varsayıyor, ama bu iki kardeş tabloda RLS hiç güncellenmemişti — canlıda
-- bir "coach" JWT'siyle nutrition_foods'taki 97/97, nutrition_recipes'teki
-- 34/34 global kaydın tamamının düzenlenebildiği doğrulandı. Not:
-- performance_test_catalog_update BİLEREK dokunulmuyor — o tabloda sıradan
-- antrenörün düzenleyebilmesi PerformanceCategoryScreen.tsx'te açıkça
-- belirtilmiş, tasarım gereği farklı bir davranış.

drop policy if exists "nutrition_foods_update" on public.nutrition_foods;
create policy "nutrition_foods_update" on public.nutrition_foods
  for update to PUBLIC
  using (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and (is_branch_coordinator() or current_user_role() = any (array['club_admin', 'super_admin'])))
  )
  with check (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and (is_branch_coordinator() or current_user_role() = any (array['club_admin', 'super_admin'])))
  );

drop policy if exists "nutrition_recipes_update" on public.nutrition_recipes;
create policy "nutrition_recipes_update" on public.nutrition_recipes
  for update to PUBLIC
  using (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and (is_branch_coordinator() or current_user_role() = any (array['club_admin', 'super_admin'])))
  )
  with check (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and (is_branch_coordinator() or current_user_role() = any (array['club_admin', 'super_admin'])))
  );
