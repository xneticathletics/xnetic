-- Fitness hareketlerindeki aynı düzeltme: Süper Admin artık sadece global
-- (club_id null) performans testlerini değil, TÜM kulüplerin kendi eklediği
-- özel testleri de görebiliyor.
drop policy if exists "performance_test_catalog_select" on public.performance_test_catalog;
create policy "performance_test_catalog_select" on public.performance_test_catalog
  for select to PUBLIC
  using (club_id is null or club_id = public.current_club_id() or public.is_super_admin());
