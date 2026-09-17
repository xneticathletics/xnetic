-- Kullanıcı isteği: club_admin da (branş koordinatörü gibi) Şampiyon
-- rozeti verebilsin — admin kulübün tamamını yönettiği için branş
-- eşleşmesi aranmıyor, kendi kulübündeki HERHANGİ bir sporcuya verebilir.
create or replace function public.award_champion_badge(p_athlete_id uuid)
returns public.badges
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_row badges;
begin
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
    raise exception 'Sadece kulüp admini veya branş koordinatörü şampiyon rozeti verebilir';
  end if;

  insert into badges (club_id, athlete_id, badge_type, tier, awarded_by)
  select a.club_id, a.id, 'sampiyon', 1, my_user_id() from athletes a where a.id = p_athlete_id
  on conflict (athlete_id, badge_type) where athlete_id is not null
  do update set seen_at = null, earned_at = now(), awarded_by = excluded.awarded_by
  returning * into v_row;

  return v_row;
end;
$$;
