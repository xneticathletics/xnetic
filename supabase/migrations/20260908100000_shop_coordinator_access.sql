-- Mağaza ürün yönetimi bugüne kadar SADECE club_admin'e açıktı — kullanıcı
-- kararı: "branş koordinatörü admin gibi ama sadece kendi branşının admini".
-- Mağazada branş kavramı olmadığı için (tüm ürünler kulüp geneli — bkz.
-- shop_products'ta branch/category kolonu yok, category serbest metin bir
-- ürün tipi etiketi), performance_test_catalog'daki "is_admin_tier() OR
-- is_branch_coordinator()" deseniyle aynı şekilde, koordinatöre kulübün
-- TÜM mağazasını yönetme hakkı veriliyor (branşa özel bir alt küme yok).
drop policy if exists "shop_products_admin_all" on public.shop_products;
create policy "shop_products_admin_all" on public.shop_products
  for all to authenticated
  using (club_id = public.current_club_id() and (public.is_admin_tier() or public.is_branch_coordinator()))
  with check (club_id = public.current_club_id() and (public.is_admin_tier() or public.is_branch_coordinator()));

drop policy if exists "shop_product_variants_admin_all" on public.shop_product_variants;
create policy "shop_product_variants_admin_all" on public.shop_product_variants
  for all to authenticated
  using (club_id = public.current_club_id() and (public.is_admin_tier() or public.is_branch_coordinator()))
  with check (club_id = public.current_club_id() and (public.is_admin_tier() or public.is_branch_coordinator()));

drop policy if exists "shop_product_variant_stock_admin_all" on public.shop_product_variant_stock;
create policy "shop_product_variant_stock_admin_all" on public.shop_product_variant_stock
  for all to authenticated
  using (club_id = public.current_club_id() and (public.is_admin_tier() or public.is_branch_coordinator()))
  with check (club_id = public.current_club_id() and (public.is_admin_tier() or public.is_branch_coordinator()));

-- Mağazayı yönetmek sipariş görüntüleme/onaylamayı da içeriyor — sadece
-- ürün ekleyip siparişleri hiç göremeyen bir koordinatör yarım bir özellik
-- olurdu (ShopManageScreen zaten Siparişler/Stok butonlarını aynı ekranda
-- gösteriyor).
drop policy if exists "shop_orders_admin_all" on public.shop_orders;
create policy "shop_orders_admin_all" on public.shop_orders
  for all to authenticated
  using (club_id = public.current_club_id() and (public.is_admin_tier() or public.is_branch_coordinator()))
  with check (club_id = public.current_club_id() and (public.is_admin_tier() or public.is_branch_coordinator()));

create or replace function public.update_shop_order_status(p_order_id uuid, p_status text)
returns shop_orders
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_order shop_orders%rowtype;
  v_product_title text;
begin
  if not (is_admin_tier() or is_branch_coordinator()) then
    raise exception 'Yetkin yok';
  end if;

  select * into v_order from shop_orders
  where id = p_order_id and club_id = current_club_id()
  for update;
  if not found then
    raise exception 'Sipariş bulunamadı';
  end if;

  if p_status not in ('pending', 'confirmed', 'delivered', 'cancelled') then
    raise exception 'Geçersiz durum';
  end if;

  if p_status = 'confirmed' and v_order.status <> 'confirmed' then
    select title into v_product_title from shop_products where id = v_order.product_id;
    insert into extra_income (club_id, description, amount, income_date, order_id)
    values (
      v_order.club_id,
      concat('Mağaza siparişi — ', coalesce(v_product_title, 'Ürün')),
      v_order.total_price,
      current_date,
      v_order.id
    )
    on conflict (order_id) do nothing;
  end if;

  if p_status = 'cancelled' and v_order.status <> 'cancelled' and v_order.variant_id is not null then
    update shop_product_variant_stock
    set stock = stock + v_order.quantity, updated_at = now()
    where variant_id = v_order.variant_id;
  end if;

  update shop_orders set status = p_status where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;
