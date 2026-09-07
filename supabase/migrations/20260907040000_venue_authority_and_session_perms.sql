-- Antrenman EKLEME (ve buna bağlı SİLME) yetkisi daraltılıyor: bugüne kadar
-- training_sessions_coach_write (FOR ALL) is_my_coached_group(group_id)
-- true olan HERKESE (baş antrenör + yardımcı antrenör + branş koordinatörü)
-- insert/update/delete izni veriyordu. Bundan sonra sadece admin, branş
-- koordinatörü ve "salon yetkilisi" (yeni venue_coaches etiketi) antrenman
-- EKLEYEBİLİR/SİLEBİLİR — sıradan antrenörün UPDATE'i (yoklama/tamamlama/
-- not girme gibi mevcut işlemler) DOKUNULMADAN aynen devam ediyor.

-- is_my_coached_group(gid)'in üçüncü OR dalıyla (branş koordinatörlüğü)
-- AYNI mantık ama SADECE o dalı izole eden yeni bir fonksiyon — mevcut
-- is_my_coached_group tüm antrenörleri de kapsadığı için INSERT/DELETE
-- politikasında doğrudan kullanılamıyor.
create or replace function public.is_my_coordinated_group(gid uuid)
returns boolean
language plpgsql
stable security definer
set search_path to 'public'
as $$
begin
  return exists (
    select 1 from users u
    join groups g on g.id = gid
    where u.auth_user_id = auth.uid()
    and exists (select 1 from branches b where b.coordinator_user_id = u.id and b.name = g.branch)
  );
end;
$$;

revoke execute on function public.is_my_coordinated_group(uuid) from public;
grant execute on function public.is_my_coordinated_group(uuid) to authenticated;

-- "Salon yetkilisi" — venue_coaches'ta (bir sonraki migration'da oluşturuluyor)
-- çağıranın bu salon için bir satırı var mı. Fonksiyon burada tanımlanıyor
-- çünkü training_sessions politikaları venue_coaches'tan ÖNCE bu dosyada
-- yazılıyor; venue_coaches tablosu henüz yokken de fonksiyon oluşturulabilir
-- (yalnızca çağrıldığında tabloya erişir).
create or replace function public.is_venue_authority(p_venue_id uuid)
returns boolean
language plpgsql
stable security definer
set search_path to 'public'
as $$
begin
  if p_venue_id is null then return false; end if;
  return exists (
    select 1 from venue_coaches vc
    join users u on u.id = vc.coach_id
    where u.auth_user_id = auth.uid() and vc.venue_id = p_venue_id
  );
end;
$$;

revoke execute on function public.is_venue_authority(uuid) from public;
grant execute on function public.is_venue_authority(uuid) to authenticated;

drop policy if exists "training_sessions_coach_write" on public.training_sessions;

-- Sıradan antrenörün UPDATE'i (yoklama/tamamlama/not) DEĞİŞMİYOR.
create policy "training_sessions_coach_update" on public.training_sessions
  for update to authenticated
  using (club_id = public.current_club_id() and public.is_my_coached_group(group_id))
  with check (club_id = public.current_club_id() and public.is_my_coached_group(group_id));

-- EKLEME sadece koordinatör + salon yetkilisi (admin zaten ayrı
-- training_sessions_admin_write politikasıyla kapsanıyor).
create policy "training_sessions_coordinator_insert" on public.training_sessions
  for insert to authenticated
  with check (
    club_id = public.current_club_id()
    and (public.is_my_coordinated_group(group_id) or public.is_venue_authority(venue_id))
  );

-- SİLME de aynı şekilde daraltılıyor — önceden herhangi bir koçlu antrenör
-- silebiliyordu (UI'da gizliydi ama RLS izin veriyordu), artık gerçekten kapalı.
create policy "training_sessions_coordinator_delete" on public.training_sessions
  for delete to authenticated
  using (
    club_id = public.current_club_id()
    and (public.is_my_coordinated_group(group_id) or public.is_venue_authority(venue_id))
  );
