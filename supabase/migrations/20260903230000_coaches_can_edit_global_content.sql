-- Var olan (global) hareket/testleri düzenleme antrenör/kulüp adminine de
-- açılıyor — sadece YENİ global kayıt EKLEMEK Süper Admin'e özel kalıyor
-- (silme de Süper Admin'e özel kalıyor, sadece güncelleme genişliyor).
drop policy if exists "fitness_exercises_update" on public.fitness_exercises;
create policy "fitness_exercises_update" on public.fitness_exercises
  for update to PUBLIC
  using (
    (club_id = public.current_club_id())
    or (club_id is null and public.current_user_role() in ('coach', 'club_admin', 'super_admin'))
  )
  with check (
    (club_id = public.current_club_id())
    or (club_id is null and public.current_user_role() in ('coach', 'club_admin', 'super_admin'))
  );

drop policy if exists "performance_test_catalog_update" on public.performance_test_catalog;
create policy "performance_test_catalog_update" on public.performance_test_catalog
  for update to PUBLIC
  using (
    (club_id = public.current_club_id())
    or (club_id is null and public.current_user_role() in ('coach', 'club_admin', 'super_admin'))
  )
  with check (
    (club_id = public.current_club_id())
    or (club_id is null and public.current_user_role() in ('coach', 'club_admin', 'super_admin'))
  );
