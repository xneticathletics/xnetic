-- Şampiyon rozeti GERİ ALINABİLSİN.
--
-- Şampiyon, elle verilen tek rozet (diğer 7'si otomatik kazanılıyor).
-- Yanlış sporcuya verildiğinde geri almanın hiçbir yolu yoktu — badges
-- tablosunda istemciye açık bir DELETE politikası da yok (bilerek: sporcu
-- kendi rozetini silememeli). Bu yüzden vermeyle BİREBİR aynı yetki
-- kurallarını kullanan bir RPC ekleniyor.
create or replace function public.revoke_champion_badge(p_athlete_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  -- award_champion_badge ile aynı yetki kontrolü: kulüp yöneticisi kendi
  -- kulübünde, branş koordinatörü yalnızca kendi branşındaki sporcuda.
  if is_admin_tier() then
    if not exists (select 1 from athletes a where a.id = p_athlete_id and a.club_id = current_club_id()) then
      raise exception 'Sporcu bulunamadı';
    end if;
  elsif is_branch_coordinator() then
    if not exists (
      select 1 from athletes a
      join groups g on g.id = a.group_id
      join branches b on b.name = g.branch and b.club_id = a.club_id
      where a.id = p_athlete_id and b.coordinator_user_id = my_user_id()
    ) then
      raise exception 'Bu sporcu koordinatörü olduğun branşta değil';
    end if;
  else
    raise exception 'Sadece kulüp admini veya branş koordinatörü şampiyon rozetini geri alabilir';
  end if;

  -- SADECE şampiyon rozeti silinebilir; otomatik rozetler bu uçtan
  -- kaldırılamaz (zaten bir sonraki hesaplamada geri gelirlerdi).
  delete from badges
   where athlete_id = p_athlete_id
     and badge_type = 'sampiyon'
     and club_id = (select a.club_id from athletes a where a.id = p_athlete_id);
end;
$$;

revoke all on function public.revoke_champion_badge(uuid) from public, anon;
grant execute on function public.revoke_champion_badge(uuid) to authenticated;
