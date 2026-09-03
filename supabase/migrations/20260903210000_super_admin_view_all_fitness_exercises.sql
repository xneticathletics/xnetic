-- Süper Admin artık sadece global (club_id null) hareketleri değil, TÜM
-- kulüplerin kendi eklediği özel hareketleri de görebiliyor — böylece
-- kulüplerin neler eklediğini inceleyip beğendiği bir hareketi globale de
-- ekleyebilir. Yazma yetkisi değişmedi: Süper Admin hâlâ sadece kendi
-- eklediği (club_id null) satırları düzenleyip silebiliyor, kulüplerin
-- kendi hareketlerine dokunamıyor.
drop policy if exists "fitness_exercises_select" on public.fitness_exercises;
create policy "fitness_exercises_select" on public.fitness_exercises
  for select to PUBLIC
  using (club_id is null or club_id = public.current_club_id() or public.is_super_admin());
