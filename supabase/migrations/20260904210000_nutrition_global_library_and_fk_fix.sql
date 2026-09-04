-- 0) Yetim veri temizliği: FK eklemeden önce, artık var olmayan bir kulübe
-- işaret eden satırlar varsa (ör. bu oturumdaki test kulüplerinin silinmesinden
-- kalma) FK eklemesi hata verir. Böyle satırlar zaten RLS yüzünden hiçbir
-- gerçek kullanıcıya (Süper Admin hariç) görünmüyordu, güvenle temizlenebilir.
delete from public.fitness_exercises where club_id is not null and club_id not in (select id from public.clubs);
delete from public.performance_test_catalog where club_id is not null and club_id not in (select id from public.clubs);
delete from public.nutrition_foods where club_id not in (select id from public.clubs);
delete from public.nutrition_recipes where club_id not in (select id from public.clubs);

-- 1) EKSİK FOREIGN KEY: fitness_exercises ve performance_test_catalog'ın
-- club_id'si hiç FK olarak tanımlanmamış — PostgREST bu yüzden ilişkiyi
-- şema önbelleğinde bulamıyor ve "clubs(name)" gömme sorgusu (Süper Admin'in
-- hangi kulübün ekmiş olduğunu görmesi için) hata veriyordu:
-- "could not find a relationship between 'performance_test_catalog' and
-- 'clubs' in the schema cache". Diğer tüm club_id sütunlarındaki standart
-- kalıpla (on delete cascade) aynı FK ekleniyor.
alter table public.fitness_exercises
  add constraint fitness_exercises_club_id_fkey foreign key (club_id) references public.clubs(id) on delete cascade;

alter table public.performance_test_catalog
  add constraint performance_test_catalog_club_id_fkey foreign key (club_id) references public.clubs(id) on delete cascade;

-- 2) nutrition_foods / nutrition_recipes şimdiye kadar TAMAMEN kulübe özeldi
-- (club_id not null) — her kulüp kendi besin/tarif listesini sıfırdan
-- girmek zorundaydı. fitness_exercises/performance_test_catalog'daki aynı
-- "global kütüphane" modeline geçiriliyor: club_id NULL olan satırlar
-- TÜM kulüplerin gördüğü ortak içerik, sadece Süper Admin ekleyip silebiliyor,
-- var olan içeriği her antrenör/kulüp admini düzenleyebiliyor (bkz.
-- 20260903230000_coaches_can_edit_global_content.sql'deki aynı gerekçe).
-- Kulüpler kendi özel besin/tarifini eskisi gibi ekleyebilmeye devam ediyor.

alter table public.nutrition_foods alter column club_id drop not null;
alter table public.nutrition_foods
  add constraint nutrition_foods_club_id_fkey foreign key (club_id) references public.clubs(id) on delete cascade;

drop policy if exists "tenant_isolation_nutrition_foods" on public.nutrition_foods;

create policy "nutrition_foods_select" on public.nutrition_foods
  for select to PUBLIC
  using (club_id is null or club_id = public.current_club_id() or public.is_super_admin());

create policy "nutrition_foods_insert" on public.nutrition_foods
  for insert to PUBLIC
  with check (
    (club_id = public.current_club_id())
    or (club_id is null and public.is_super_admin())
  );

create policy "nutrition_foods_update" on public.nutrition_foods
  for update to PUBLIC
  using (
    (club_id = public.current_club_id())
    or (club_id is null and public.current_user_role() in ('coach', 'club_admin', 'super_admin'))
  )
  with check (
    (club_id = public.current_club_id())
    or (club_id is null and public.current_user_role() in ('coach', 'club_admin', 'super_admin'))
  );

create policy "nutrition_foods_delete" on public.nutrition_foods
  for delete to PUBLIC
  using (
    (club_id = public.current_club_id())
    or (club_id is null and public.is_super_admin())
  );

alter table public.nutrition_recipes alter column club_id drop not null;
alter table public.nutrition_recipes
  add constraint nutrition_recipes_club_id_fkey foreign key (club_id) references public.clubs(id) on delete cascade;

drop policy if exists "tenant_isolation_nutrition_recipes" on public.nutrition_recipes;

create policy "nutrition_recipes_select" on public.nutrition_recipes
  for select to PUBLIC
  using (club_id is null or club_id = public.current_club_id() or public.is_super_admin());

create policy "nutrition_recipes_insert" on public.nutrition_recipes
  for insert to PUBLIC
  with check (
    (club_id = public.current_club_id())
    or (club_id is null and public.is_super_admin())
  );

create policy "nutrition_recipes_update" on public.nutrition_recipes
  for update to PUBLIC
  using (
    (club_id = public.current_club_id())
    or (club_id is null and public.current_user_role() in ('coach', 'club_admin', 'super_admin'))
  )
  with check (
    (club_id = public.current_club_id())
    or (club_id is null and public.current_user_role() in ('coach', 'club_admin', 'super_admin'))
  );

create policy "nutrition_recipes_delete" on public.nutrition_recipes
  for delete to PUBLIC
  using (
    (club_id = public.current_club_id())
    or (club_id is null and public.is_super_admin())
  );
