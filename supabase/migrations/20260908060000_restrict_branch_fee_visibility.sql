-- Branş bazlı sabit aidat ücretleri (branches.standard_fee_try) genel
-- amaçlı listBranches() üzerinden kulübün HER üyesine (antrenör, veli,
-- sporcu) görünür hale gelmişti — branches tablosunun SELECT politikası
-- sadece club_id eşleşmesi arıyor, rol kontrolü yok. Kullanıcı kararı:
-- "adminden başkasının diğer branşların aidatlarını görmesine gerek yok".
--
-- branches tablosunun geri kalan kolonları (isim, koordinatör, bireysel mi)
-- kulübün her üyesine açık KALMALI (grup/antrenman formlarındaki branş
-- seçimi için gerekli) — bu yüzden RLS satır bazlı çalıştığından tek bir
-- kolonu maskeleyemiyoruz. Bunun yerine SADECE admin'in çağırabileceği,
-- sadece id/name/standard_fee_try döndüren dar bir RPC ekliyoruz;
-- StandardFeeScreen artık listBranches() değil bunu kullanıyor.
create or replace function public.list_branches_with_fees()
returns table (id uuid, name text, standard_fee_try numeric)
language plpgsql
stable security definer
set search_path to 'public'
as $$
begin
  if current_user_role() is distinct from 'club_admin' then
    raise exception 'Bu işlem için yetkiniz yok.';
  end if;
  return query
    select b.id, b.name, b.standard_fee_try
    from branches b
    where b.club_id = current_club_id()
    order by b.name;
end;
$$;

revoke execute on function public.list_branches_with_fees() from public;
grant execute on function public.list_branches_with_fees() to authenticated;
