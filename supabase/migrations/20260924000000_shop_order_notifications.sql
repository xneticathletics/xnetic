-- Mağaza sipariş bildirimleri SUNUCU tarafında gönderilsin.
--
-- 1) Yeni sipariş → kulüp yöneticileri + alıcının çocuklarının branş
--    koordinatör(ler)i. Eskiden istemciden (veli hesabıyla) gönderiliyordu,
--    ancak can_send_notification velinin 'shop_order' türünde bildirim
--    göndermesine izin vermiyor — insert RLS ile reddediliyor ve hata
--    sessizce yutuluyordu. Sonuç: yönetici velilerin siparişlerinden bugüne
--    kadar HİÇ haberdar olmadı (2026-09-24 canlıda doğrulandı).
--    Politikayı gevşetmek yerine bildirimi sipariş RPC'sinin İÇİNDEN
--    gönderiyoruz: böylece yalnızca gerçekten oluşmuş bir sipariş bildirim
--    üretebiliyor, sahte "yeni sipariş" bildirimi gönderilemiyor.
-- 2) Sipariş onaylanınca / teslim edilince → siparişi veren veli.

-- Sunucu içi bildirim + push yardımcısı. send_session_rpe_reminders ile
-- aynı desen (susturulmuş türlere saygı, push için send-push-notification).
-- İSTEMCİYE KAPALI: yalnızca diğer SECURITY DEFINER fonksiyonların içinden
-- çağrılabilir, aksi halde herkes herkese bildirim gönderebilirdi.
create or replace function public.notify_internal(
  p_recipient uuid, p_club uuid, p_title text, p_body text, p_event text, p_payload jsonb
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_muted text[];
  v_project_url text := 'https://wzyyjilodsrwwqdjiqam.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6eXlqaWxvZHNyd3dxZGppcWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTkwNDEsImV4cCI6MjEwNTA3NTA0MX0.Mdj3UIk1hMHi_MhITU84I99KZZ7Uj_c-abQIak9Kyu0';
begin
  if p_recipient is null then return; end if;

  select u.muted_notification_types into v_muted from users u where u.id = p_recipient and u.is_active;
  if not found then return; end if;
  if v_muted is not null and p_event = any (v_muted) then return; end if;

  v_id := gen_random_uuid();
  insert into notifications (id, club_id, recipient_user_id, title, body, event_type, payload)
  values (v_id, p_club, p_recipient, p_title, p_body, p_event, p_payload);

  -- Push best-effort: başarısız olsa bile uygulama içi bildirim yazıldı.
  begin
    perform net.http_post(
      url := v_project_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_anon_key, 'Authorization', 'Bearer ' || v_anon_key),
      body := jsonb_build_object('notification_id', v_id)
    );
  exception when others then null;
  end;
end;
$$;
revoke all on function public.notify_internal(uuid, uuid, text, text, text, jsonb) from public, anon, authenticated;

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
  if not found then
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

  -- Alıcılar: kulüp yöneticileri + alıcının çocuklarının branş
  -- koordinatörleri (ana grup ve ek gruplar). Ürün/siparişte branş bilgisi
  -- olmadığı için "ilgili koordinatör" = bu ailenin branşından sorumlu olan.
  for r in
    select u.id from users u
     where u.club_id = v_order.club_id and u.role = 'club_admin' and u.is_active
    union
    select b.coordinator_user_id from athletes a
      join groups g on g.id = a.group_id
      join branches b on b.name = g.branch and b.club_id = a.club_id
     where a.parent_user_id = v_user_id and a.club_id = v_order.club_id and b.coordinator_user_id is not null
    union
    select b.coordinator_user_id from athletes a
      join athlete_groups ag on ag.athlete_id = a.id
      join groups g on g.id = ag.group_id
      join branches b on b.name = g.branch and b.club_id = a.club_id
     where a.parent_user_id = v_user_id and a.club_id = v_order.club_id and b.coordinator_user_id is not null
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

create or replace function public.update_shop_order_status(p_order_id uuid, p_status text)
returns shop_orders
language plpgsql security definer set search_path = public
as $$
declare
  v_order shop_orders%rowtype;
  v_prev_status text;
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

  -- Veliye bildirim: yalnızca durum GERÇEKTEN değiştiyse (aynı duruma
  -- tekrar basılınca ikinci bildirim gitmesin).
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
