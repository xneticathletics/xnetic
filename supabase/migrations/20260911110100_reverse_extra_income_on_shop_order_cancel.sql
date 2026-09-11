-- Tam uygulama taramasında bulunan: bir sipariş confirmed -> cancelled
-- yapıldığında stok doğru şekilde geri ekleniyordu ama confirmed'e
-- geçerken oluşturulan extra_income satırı hiç silinmiyordu — iptal
-- edilmiş bir satış Finans'ta kalıcı olarak gelir gibi görünmeye devam
-- ediyordu. Artık cancelled'a geçişte (hangi durumdan gelirse gelsin)
-- o siparişe ait extra_income satırı da siliniyor.
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

  if p_status = 'cancelled' and v_order.status <> 'cancelled' then
    if v_order.variant_id is not null then
      update shop_product_variant_stock
      set stock = stock + v_order.quantity, updated_at = now()
      where variant_id = v_order.variant_id;
    end if;
    delete from extra_income where order_id = v_order.id;
  end if;

  update shop_orders set status = p_status where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;
