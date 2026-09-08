-- Sabit aidat ücreti artık kulüp genelinde TEK bir sayı değil, branş
-- bazında ayarlanabiliyor — kullanıcı: "branş branş sabit aidat ücreti
-- uygulaması getirelim, her branş aynı olmaz sonuçta". Var olan
-- club_settings.standard_fee_try değeri (varsa) kulübün TÜM branşlarına
-- başlangıç değeri olarak kopyalanıyor — geriye dönük hiçbir aidat/plan
-- tutarı değişmiyor, sadece bundan sonraki güncellemeler branş bazlı olacak.
alter table public.branches add column if not exists standard_fee_try numeric;

update branches b
set standard_fee_try = cs.standard_fee_try
from club_settings cs
where cs.club_id = b.club_id and cs.standard_fee_try is not null and b.standard_fee_try is null;

-- update_standard_fee (migration 20260907020000) ile aynı mantık, sadece
-- kulübün TÜMÜ yerine tek bir branşın sporcularına (athletes -> groups ->
-- branch = bu branşın adı) uygulanıyor. Kontrol yine SADECE club_admin
-- (accounting değil) — 20260907020000'deki açık kullanıcı kararıyla aynı.
create or replace function public.update_branch_standard_fee(p_branch_id uuid, p_new_fee numeric)
returns table (plans_updated integer, payments_updated integer)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_branch_name text;
  v_club_id uuid;
  v_plans_updated integer;
  v_payments_updated integer;
  v_first_of_next_month date := date_trunc('month', current_date) + interval '1 month';
begin
  if current_user_role() is distinct from 'club_admin' then
    raise exception 'Bu işlem için yetkiniz yok.';
  end if;
  if p_new_fee is null or p_new_fee <= 0 then
    raise exception 'Geçerli bir tutar girilmedi.';
  end if;

  select name, club_id into v_branch_name, v_club_id from branches where id = p_branch_id;
  if v_branch_name is null or v_club_id is distinct from current_club_id() then
    raise exception 'Branş bulunamadı.';
  end if;

  update branches set standard_fee_try = p_new_fee where id = p_branch_id;

  update payment_plans pp set amount = p_new_fee
  where pp.club_id = v_club_id and pp.active = true
  and exists (
    select 1 from athletes a join groups g on g.id = a.group_id
    where a.id = pp.athlete_id and g.branch = v_branch_name
  );
  get diagnostics v_plans_updated = row_count;

  -- Bulunduğumuz ay HARİÇ, henüz ödenmemiş gelecek aylardaki kayıtlar
  -- güncellenir — update_standard_fee ile aynı kural.
  update payments p set amount = p_new_fee
  where p.club_id = v_club_id and p.status = 'pending' and p.due_date >= v_first_of_next_month
  and exists (
    select 1 from athletes a join groups g on g.id = a.group_id
    where a.id = p.athlete_id and g.branch = v_branch_name
  );
  get diagnostics v_payments_updated = row_count;

  return query select v_plans_updated, v_payments_updated;
end;
$$;

revoke execute on function public.update_branch_standard_fee(uuid, numeric) from public;
grant execute on function public.update_branch_standard_fee(uuid, numeric) to authenticated;
