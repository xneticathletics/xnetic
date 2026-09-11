-- 20260909070000_lock_limited_trust_update_columns.sql'deki
-- trg_groups_lock_non_coordinator_columns, "GroupFormScreen koordinatöre
-- hiç gösterilmiyor" varsayımıyla name/venue_id/athlete_type/fixed_schedule
-- alanlarını is_admin_tier() DIŞINDAKİ herkes için (yani koordinatör dahil)
-- kilitliyordu. Ama GroupsListScreen.tsx bir koordinatörü aynı GroupFormScreen'e
-- DÜZENLEME için yönlendiriyor, ve 20260910000000_groups_coordinator_write_access.sql
-- koordinatöre kendi branşında grup oluşturma/silme hakkı da verdi — yani
-- varsayım artık geçerli değil. Tam uygulama taraması sırasında bulundu:
-- bir koordinatör "Kaydet"e bastığında hiçbir hata almadan bu alanlar
-- sessizce eski değerine dönüyordu.
--
-- Düzeltme: koordinatör KENDİ yönettiği bir grubu düzenliyorsa (mevcut satır
-- zaten onun branşındaysa) name/venue_id/athlete_type/fixed_schedule'ı da
-- değiştirebilsin — "koordinatör = kendi branşına scope'lanmış admin"
-- felsefesiyle tutarlı. branch/club_id hâlâ herkes için kilitli kalıyor
-- (bir grubu başka bir branşa taşımak yapısal bir admin kararı).
create or replace function public.groups_lock_non_coordinator_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin_tier() then
    new.club_id := old.club_id;
    new.branch := old.branch;
    if not public.is_my_coordinated_group(old.id) then
      new.name := old.name;
      new.venue_id := old.venue_id;
      new.athlete_type := old.athlete_type;
      new.fixed_schedule := old.fixed_schedule;
    end if;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
