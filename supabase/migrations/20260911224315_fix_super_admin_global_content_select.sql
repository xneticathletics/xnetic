-- fitness_exercises_select ve performance_test_catalog_select politikaları,
-- kardeşleri nutrition_foods_select/nutrition_recipes_select'ten farklı
-- olarak "or is_super_admin()" bypass'ını hiç içermiyordu. Süper Admin'in
-- kendi kulübü olmadığı için current_club_id() NULL dönüyor — bu da bir
-- kulübün eklediği özel (club_id dolu) bir hareketi/testi Süper Admin'in
-- "İçeriği Globale Yükselt" ekranında hiç GÖRMEMESİNE yol açıyordu (şu an
-- veritabanında hiç kulübe özel kayıt olmadığı için fark edilmemişti, ama
-- bir kulüp ilk özel hareketi/testi eklediği an bu görünmez kalırdı).

drop policy if exists "fitness_exercises_select" on public.fitness_exercises;
create policy "fitness_exercises_select" on public.fitness_exercises
  for select to PUBLIC
  using (club_id is null or club_id = public.current_club_id() or public.is_super_admin());

drop policy if exists "performance_test_catalog_select" on public.performance_test_catalog;
create policy "performance_test_catalog_select" on public.performance_test_catalog
  for select to PUBLIC
  using (club_id is null or club_id = public.current_club_id() or public.is_super_admin());
