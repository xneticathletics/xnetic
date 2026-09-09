-- Branş koordinatörü zaten UPDATE yapabiliyordu (groups_coordinator_update,
-- is_my_coordinated_group() ile — önceki bir oturumda eklenmişti). Burada
-- sadece eksik olan INSERT ve DELETE ekleniyor, aynı "kendi branşıyla
-- sınırlı" mantığıyla — Kulüp Yapısı'nda artık kendi branşının gruplarını
-- ekleyip silebiliyor, salonlar hâlâ salt okunur, branşlar hiç gösterilmiyor
-- (istemci tarafında). INSERT'te henüz bir id olmadığı için grup id'sine
-- göre çalışan is_my_coordinated_group() yerine branş metnine göre çalışan
-- is_my_coordinator_branch() kullanılıyor; DELETE'te ise mevcut UPDATE
-- politikasıyla aynı is_my_coordinated_group() deseni izleniyor.
create policy "groups_coordinator_write" on public.groups
  for insert to authenticated
  with check (club_id = current_club_id() and is_my_coordinator_branch(branch));

create policy "groups_coordinator_delete" on public.groups
  for delete to authenticated
  using (club_id = current_club_id() and is_my_coordinated_group(id));
