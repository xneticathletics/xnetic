-- Aynı denetimde bulundu: fitness_exercises için bugün erken saatte
-- düzeltilen "kulübe özel satırların insert/update/delete'inde rol
-- kontrolü hiç yok" hatası, tam olarak aynı desenle nutrition_foods,
-- nutrition_recipes ve performance_test_catalog'da da vardı — üçünde de
-- club_id=current_club_id() dalı hiçbir role bakmıyordu (sadece
-- club_id IS NULL/global dal korunuyordu). Yani bir veli/sporcu hesabı,
-- kendi kulübünün besin/tarif/performans testi kataloğuna doğrudan API
-- ile ekleme/güncelleme/silme yapabiliyordu.
--
-- Otomatik taramamın bunu ilk seferde kaçırma nedeni: politika metninde
-- "is_super_admin" alt dizesi (global dal için) geçiyordu, bu da basit bir
-- anahtar-kelime taramasını yanıltıyordu — asıl mesele club_id dalının rol
-- kontrolünden TAMAMEN muaf olmasıydı. Aynı yanlış negatifin başka bir
-- örneği: notifications_insert_club'ta da "is_super_admin" geçiyordu ama
-- asıl sorun (alıcı ilişkisi kontrolsüzdü) farklıydı — bkz. az önceki
-- migration. Ders: metin araması yeterli değil, her OR dalı ayrı ayrı
-- okunmalı.
--
-- NutritionFoodDetailScreen.tsx / NutritionRecipeDetailScreen.tsx'teki
-- canEdit/canDelete zaten club_admin+koordinatör (düz antrenör DEĞİL) —
-- fitness_exercises'in "her antrenör ekleyebilir" kuralından farklı,
-- burada UI'daki gerçek kural aynen uygulanıyor. performance_test_catalog
-- için de tutarlılık adına aynı (daha sıkı) kural kullanıldı.

drop policy if exists nutrition_foods_insert on public.nutrition_foods;
create policy nutrition_foods_insert on public.nutrition_foods for insert
  with check (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and is_super_admin())
  );
drop policy if exists nutrition_foods_update on public.nutrition_foods;
create policy nutrition_foods_update on public.nutrition_foods for update
  using (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and current_user_role() = any (array['coach','club_admin','super_admin']))
  )
  with check (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and current_user_role() = any (array['coach','club_admin','super_admin']))
  );
drop policy if exists nutrition_foods_delete on public.nutrition_foods;
create policy nutrition_foods_delete on public.nutrition_foods for delete
  using (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and is_super_admin())
  );

drop policy if exists nutrition_recipes_insert on public.nutrition_recipes;
create policy nutrition_recipes_insert on public.nutrition_recipes for insert
  with check (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and is_super_admin())
  );
drop policy if exists nutrition_recipes_update on public.nutrition_recipes;
create policy nutrition_recipes_update on public.nutrition_recipes for update
  using (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and current_user_role() = any (array['coach','club_admin','super_admin']))
  )
  with check (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and current_user_role() = any (array['coach','club_admin','super_admin']))
  );
drop policy if exists nutrition_recipes_delete on public.nutrition_recipes;
create policy nutrition_recipes_delete on public.nutrition_recipes for delete
  using (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and is_super_admin())
  );

drop policy if exists performance_test_catalog_insert on public.performance_test_catalog;
create policy performance_test_catalog_insert on public.performance_test_catalog for insert
  with check (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and is_super_admin())
  );
drop policy if exists performance_test_catalog_update on public.performance_test_catalog;
create policy performance_test_catalog_update on public.performance_test_catalog for update
  using (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and current_user_role() = any (array['coach','club_admin','super_admin']))
  )
  with check (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and current_user_role() = any (array['coach','club_admin','super_admin']))
  );
drop policy if exists performance_test_catalog_delete on public.performance_test_catalog;
create policy performance_test_catalog_delete on public.performance_test_catalog for delete
  using (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and is_super_admin())
  );
