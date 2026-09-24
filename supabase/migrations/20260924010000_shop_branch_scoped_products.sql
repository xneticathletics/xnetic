-- Mağaza ürünleri "Genel" (tüm kulüp) ya da "Branşa özel" yayınlanabilsin.
--
-- Kural, Etkinlikler ile BİREBİR aynı (bkz. events_* politikaları):
--   • branch IS NULL  → genel ürün, kulüpteki herkes görür; yalnızca kulüp
--                       yöneticisi oluşturup yönetebilir.
--   • branch dolu     → yalnızca o branşın veli/sporcu/antrenörleri görür;
--                       yönetici ya da O branşın koordinatörü yönetir.
-- Mevcut ürünlerin branch'i NULL kalır → hepsi "genel" olur, görünürlükte
-- hiçbir değişiklik olmaz.
--
-- Koordinatör artık kulübün TÜM ürün ve siparişlerini değil, yalnızca kendi
-- branşınınkileri yönetiyor ("koordinatör = kendi branşının yöneticisi").

alter table public.shop_products add column if not exists branch text;

-- Bir ürünü yönetebilir miyim? SECURITY DEFINER: içindeki sorgu RLS'e
-- takılmaz (görünürlüğe bağlı politika hatasını önler). Metin alır ki
-- storage klasör adıyla da doğrudan çağrılabilsin; geçersiz bir değer
-- (uuid olmayan klasör adı) hata değil false döner.
create or replace function public.can_manage_shop_product(p_product text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.shop_products p
    where p.id::text = p_product
      and p.club_id = public.current_club_id()
      and (
        coalesce(public.is_admin_tier(), false)
        or (p.branch is not null and coalesce(public.is_my_coordinator_branch(p.branch), false))
      )
  );
$$;

create or replace function public.can_manage_shop_variant(p_variant uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.shop_product_variants v
    where v.id = p_variant and public.can_manage_shop_product(v.product_id::text)
  );
$$;

revoke all on function public.can_manage_shop_product(text), public.can_manage_shop_variant(uuid) from public, anon;
grant execute on function public.can_manage_shop_product(text), public.can_manage_shop_variant(uuid) to authenticated;

-- ---------- shop_products ----------
drop policy if exists shop_products_admin_all on public.shop_products;
create policy shop_products_admin_all on public.shop_products
  for all to authenticated
  using (club_id = public.current_club_id() and public.is_admin_tier())
  with check (club_id = public.current_club_id() and public.is_admin_tier());

-- Koordinatör yalnızca KENDİ branşına ürün ekler/yönetir; genel (branch
-- NULL) ürün oluşturamaz — events_coordinator_write ile aynı.
drop policy if exists shop_products_coordinator_write on public.shop_products;
create policy shop_products_coordinator_write on public.shop_products
  for all to authenticated
  using (club_id = public.current_club_id() and branch is not null and public.is_my_coordinator_branch(branch))
  with check (club_id = public.current_club_id() and branch is not null and public.is_my_coordinator_branch(branch));

-- Görüntüleme: genel ürünü herkes, branş ürününü yalnızca o branştakiler.
drop policy if exists shop_products_view_select on public.shop_products;
create policy shop_products_view_select on public.shop_products
  for select to authenticated
  using (
    club_id = public.current_club_id()
    and is_active = true
    and public.current_user_role() = any (array['parent', 'athlete', 'coach'])
    and public.is_my_branch(branch)
  );

-- ---------- varyantlar ve stok ----------
drop policy if exists shop_product_variants_admin_all on public.shop_product_variants;
create policy shop_product_variants_admin_all on public.shop_product_variants
  for all to authenticated
  using (club_id = public.current_club_id() and (public.is_admin_tier() or public.can_manage_shop_product(product_id::text)))
  with check (club_id = public.current_club_id() and (public.is_admin_tier() or public.can_manage_shop_product(product_id::text)));

drop policy if exists shop_product_variant_stock_admin_all on public.shop_product_variant_stock;
create policy shop_product_variant_stock_admin_all on public.shop_product_variant_stock
  for all to authenticated
  using (club_id = public.current_club_id() and (public.is_admin_tier() or public.can_manage_shop_variant(variant_id)))
  with check (club_id = public.current_club_id() and (public.is_admin_tier() or public.can_manage_shop_variant(variant_id)));

-- ---------- siparişler ----------
-- Yönetici tüm siparişleri görür (ürün silinmiş olsa bile — o yüzden
-- is_admin_tier() ayrı kol); koordinatör yalnızca kendi branş ürünlerininkini.
drop policy if exists shop_orders_admin_all on public.shop_orders;
create policy shop_orders_admin_all on public.shop_orders
  for all to authenticated
  using (club_id = public.current_club_id() and (public.is_admin_tier() or public.can_manage_shop_product(product_id::text)))
  with check (club_id = public.current_club_id() and (public.is_admin_tier() or public.can_manage_shop_product(product_id::text)));

-- ---------- ürün fotoğrafları (storage) ----------
-- Eskiden yazma yalnızca is_admin_tier()'a açıktı: koordinatör ürün
-- oluşturabiliyor ama fotoğrafını YÜKLEYEMİYORDU. Artık ürünü yönetebilen
-- herkes (yönetici / o branşın koordinatörü) fotoğrafını da yönetir.
-- Klasör adı ürün id'si; alt sorgu yerine SECURITY DEFINER yardımcı —
-- görünürlüğe bağlı politika ve "name" belirsizliği hatalarının ikisini de önler.
drop policy if exists shop_photos_insert on storage.objects;
create policy shop_photos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'shop-photos' and public.can_manage_shop_product((storage.foldername(name))[1]));

drop policy if exists shop_photos_update on storage.objects;
create policy shop_photos_update on storage.objects
  for update to authenticated
  using (bucket_id = 'shop-photos' and public.can_manage_shop_product((storage.foldername(name))[1]));

drop policy if exists shop_photos_delete on storage.objects;
create policy shop_photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'shop-photos' and public.can_manage_shop_product((storage.foldername(name))[1]));

-- ---------- sipariş oluşturma ----------
-- Veli yalnızca GÖREBİLDİĞİ ürünü sipariş edebilsin (branş ürünü → o
-- branşta çocuğu olmalı). Bildirim: yöneticiler + ürün branşa özelse o
-- branşın koordinatörü (genel ürünleri koordinatör yönetmediği için ona
-- gitmez).
create or replace function public.create_shop_order(
  p_product_id uuid, p_variant_id uuid, p_quantity integer, p_payment_method text, p_note text
) returns shop_orders
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_product shop_products%rowtype;
  v_stock integer;
  v_order shop_orders%rowtype;
  r record;
begin
  if current_user_role() <> 'parent' then
    raise exception 'Sadece veliler sipariş oluşturabilir';
  end if;

  select id into v_user_id from users where auth_user_id = auth.uid();
  if v_user_id is null then
    raise exception 'Kullanıcı bulunamadı';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Geçersiz adet';
  end if;

  select * into v_product from shop_products
  where id = p_product_id and club_id = current_club_id() and is_active = true;
  if not found or not public.is_my_branch(v_product.branch) then
    raise exception 'Ürün bulunamadı';
  end if;

  if not exists (
    select 1 from shop_product_variants
    where id = p_variant_id and product_id = p_product_id
  ) then
    raise exception 'Seçenek bulunamadı';
  end if;

  select stock into v_stock from shop_product_variant_stock
  where variant_id = p_variant_id
  for update;

  if v_stock is null or v_stock < p_quantity then
    raise exception 'Yetersiz stok';
  end if;

  update shop_product_variant_stock
  set stock = stock - p_quantity, updated_at = now()
  where variant_id = p_variant_id;

  insert into shop_orders (
    club_id, product_id, variant_id, parent_user_id, quantity,
    unit_price, total_price, payment_method, note, status
  ) values (
    current_club_id(), p_product_id, p_variant_id, v_user_id, p_quantity,
    v_product.price, v_product.price * p_quantity, p_payment_method, p_note, 'pending'
  )
  returning * into v_order;

  for r in
    select u.id from users u
     where u.club_id = v_order.club_id and u.role = 'club_admin' and u.is_active
    union
    select b.coordinator_user_id from branches b
     where v_product.branch is not null
       and b.name = v_product.branch and b.club_id = v_order.club_id
       and b.coordinator_user_id is not null
  loop
    if r.id is distinct from v_user_id then
      perform public.notify_internal(
        r.id, v_order.club_id,
        'Yeni Mağaza Siparişi',
        concat(v_product.title, ' (', p_quantity, ' adet) — ',
               trim(to_char(v_order.total_price, 'FM999G999G990')), ' ₺ tutarında yeni bir sipariş var.'),
        'shop_order',
        jsonb_build_object('orderId', v_order.id)
      );
    end if;
  end loop;

  return v_order;
end;
$$;

-- ---------- sipariş durumu ----------
-- Yetki artık sipariş BAZINDA: koordinatör yalnızca kendi branş ürününün
-- siparişini güncelleyebilir (eskiden kulübün tüm siparişlerini).
create or replace function public.update_shop_order_status(p_order_id uuid, p_status text)
returns shop_orders
language plpgsql security definer set search_path = public
as $$
declare
  v_order shop_orders%rowtype;
  v_prev_status text;
  v_product_title text;
begin
  select * into v_order from shop_orders
  where id = p_order_id and club_id = current_club_id()
  for update;
  if not found then
    raise exception 'Sipariş bulunamadı';
  end if;

  if not (coalesce(public.is_admin_tier(), false) or public.can_manage_shop_product(v_order.product_id::text)) then
    raise exception 'Yetkin yok';
  end if;

  if p_status not in ('pending', 'confirmed', 'delivered', 'cancelled') then
    raise exception 'Geçersiz durum';
  end if;

  v_prev_status := v_order.status;
  select title into v_product_title from shop_products where id = v_order.product_id;

  if p_status = 'confirmed' and v_order.status <> 'confirmed' then
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

  if p_status is distinct from v_prev_status then
    if p_status = 'confirmed' then
      perform public.notify_internal(
        v_order.parent_user_id, v_order.club_id,
        'Siparişin Onaylandı',
        concat('"', coalesce(v_product_title, 'Ürün'), '" siparişin onaylandı. Teslim edildiğinde tekrar haber vereceğiz.'),
        'shop_order',
        jsonb_build_object('orderId', v_order.id)
      );
    elsif p_status = 'delivered' then
      perform public.notify_internal(
        v_order.parent_user_id, v_order.club_id,
        'Siparişin Teslim Edildi',
        concat('"', coalesce(v_product_title, 'Ürün'), '" siparişin teslim edildi. İyi günlerde kullanın!'),
        'shop_order',
        jsonb_build_object('orderId', v_order.id)
      );
    end if;
  end if;

  return v_order;
end;
$$;
