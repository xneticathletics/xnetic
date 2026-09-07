-- updateStandardFee'yi (club_settings + payment_plans + payments'a 3 ayrı
-- ardışık client isteği) TEK bir atomic RPC'ye taşıyoruz — bu potansiyel
-- olarak yüzlerce finansal kaydı etkileyen bir toplu işlem, biri başarılı
-- diğeri başarısız olup yarım kalmış bir durumda bırakmasını istemiyoruz.
-- SECURITY DEFINER RLS'i atladığı için yetki kontrolünü fonksiyonun
-- kendisi yapıyor (is_admin_tier() + çağıranın GERÇEKTEN o kulüpten
-- olduğunu current_club_id() ile doğrulayarak — p_club_id parametresine
-- körü körüne güvenmiyoruz).
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
  if not is_admin_tier() or p_club_id is distinct from current_club_id() then
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
