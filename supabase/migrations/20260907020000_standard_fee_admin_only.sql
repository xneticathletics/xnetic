-- update_standard_fee, is_admin_tier() (club_admin + accounting) kullanıyordu.
-- Kullanıcı "sadece kulüp adminin belirlediği" diye açıkça belirtti — arayüzde
-- buton zaten sadece club_admin'e gösteriliyordu ama RPC'nin kendisi accounting
-- rolüne de izin veriyordu, yani muhasebe rolündeki biri API'yi doğrudan
-- çağırarak (uygulama arayüzünü hiç kullanmadan) sabit ücreti değiştirebilirdi.
-- Kontrolü tam olarak 'club_admin' rolüyle sınırlıyoruz.
create or replace function public.update_standard_fee(p_club_id uuid, p_new_fee numeric)
returns table (plans_updated integer, payments_updated integer)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_plans_updated integer;
  v_payments_updated integer;
  v_first_of_next_month date := date_trunc('month', current_date) + interval '1 month';
begin
  if current_user_role() is distinct from 'club_admin' or p_club_id is distinct from current_club_id() then
    raise exception 'Bu işlem için yetkiniz yok.';
  end if;
  if p_new_fee is null or p_new_fee <= 0 then
    raise exception 'Geçerli bir tutar girilmedi.';
  end if;

  insert into club_settings (club_id, standard_fee_try)
  values (p_club_id, p_new_fee)
  on conflict (club_id) do update set standard_fee_try = p_new_fee;

  update payment_plans set amount = p_new_fee
  where club_id = p_club_id and active = true;
  get diagnostics v_plans_updated = row_count;

  -- Bulunduğumuz ay HARİÇ (v_first_of_next_month'tan itibaren), henüz
  -- ödenmemiş gelecek aylardaki kayıtlar güncellenir. Geçmiş/bulunulan ay
  -- ve zaten ödenmiş kayıtlara dokunulmaz.
  update payments set amount = p_new_fee
  where club_id = p_club_id and status = 'pending' and due_date >= v_first_of_next_month;
  get diagnostics v_payments_updated = row_count;

  return query select v_plans_updated, v_payments_updated;
end;
$$;

revoke execute on function public.update_standard_fee(uuid, numeric) from public;
grant execute on function public.update_standard_fee(uuid, numeric) to authenticated;
