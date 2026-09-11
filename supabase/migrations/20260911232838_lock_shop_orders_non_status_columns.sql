-- shop_orders_admin_all tek bir "FOR ALL" politikası — is_branch_coordinator()
-- (sıradan branş koordinatörü antrenör) kulübündeki HERHANGİ bir siparişin
-- HERHANGİ bir kolonunu değiştirebiliyordu (total_price, unit_price,
-- quantity, parent_user_id, payment_method, variant_id vb.), sadece
-- status'u değil. Web'in kendi kodu (shop.ts) durum güncellemesini
-- SECURITY DEFINER bir RPC'ye (update_shop_order_status) yönlendiriyor
-- ama RLS'in kendisi bunu ZORUNLU kılmıyordu — ham bir PostgREST isteği
-- her kolonu değiştirebilirdi. payments/payment_plans için daha önce
-- uygulanan "lock non-transition columns" deseninin (bkz.
-- payments_lock_paid_transition_columns, 20260908020000 ve
-- 20260911100400) shop_orders'a hiç uygulanmadığı canlıda doğrulandı
-- (bir koordinatör JWT'siyle tek bir UPDATE ile status+total_price+
-- quantity+parent_user_id aynı anda değiştirilebildi).

create or replace function public.shop_orders_lock_non_status_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.role() = 'authenticated' and not coalesce(public.is_admin_tier(), false) then
    new.club_id := old.club_id;
    new.product_id := old.product_id;
    new.parent_user_id := old.parent_user_id;
    new.quantity := old.quantity;
    new.unit_price := old.unit_price;
    new.total_price := old.total_price;
    new.payment_method := old.payment_method;
    new.note := old.note;
    new.created_at := old.created_at;
    new.variant_id := old.variant_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_shop_orders_lock_non_status_columns on public.shop_orders;
create trigger trg_shop_orders_lock_non_status_columns
  before update on public.shop_orders
  for each row execute function public.shop_orders_lock_non_status_columns();
