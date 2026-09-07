-- payments.method kolonu vardı ama hiç doldurulmuyordu — veli "Ödedim,
-- Bildir" derken hangi yöntemi (Havale/EFT ya da Elden) seçtiği sadece
-- push bildirimi METNİNDE kalıyordu, admin Finans ekranında "Bekliyor"
-- dışında hiçbir bilgi göremiyordu. submit_payment_receipt'teki aynı
-- sahiplik deseniyle (is_my_athlete), SADECE method kolonunu, SADECE
-- kendi sporcusunun hâlâ "pending" olan ödemesinde değiştirebilen dar
-- bir RPC ekliyoruz. payment_method enum'ı 'bank_transfer'/'cash' kullanıyor
-- (uygulama tarafında "havale"/"elden" olarak adlandırılıyor) — RPC bilerek
-- uygulamanın kendi terimlerini kabul edip burada eşliyor, çağıran tarafın
-- DB enum adlarını bilmesine gerek kalmasın diye.
create function public.claim_payment_method(p_payment_id uuid, p_method text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_db_method payment_method;
begin
  v_db_method := case p_method
    when 'havale' then 'bank_transfer'
    when 'elden' then 'cash'
    else null
  end;
  if v_db_method is null then
    raise exception 'Geçersiz ödeme yöntemi.';
  end if;

  if not exists (
    select 1 from payments p
    where p.id = p_payment_id
    and p.status = 'pending'
    and is_my_athlete(p.athlete_id)
  ) then
    raise exception 'Bu ödeme üzerinde yetkiniz yok.';
  end if;

  update payments set method = v_db_method where id = p_payment_id;
end;
$$;

revoke execute on function public.claim_payment_method(uuid, text) from public;
grant execute on function public.claim_payment_method(uuid, text) to authenticated;
