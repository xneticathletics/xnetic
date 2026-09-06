-- Güvenlik denetiminde bulundu: users_own_update RLS politikası,
-- is_self_update_safe(id, role, club_id) ile sadece role/club_id'nin
-- değişmediğini kontrol ediyordu — is_active alanı bu kontrolün DIŞINDA
-- kalıyordu. Sonuç: bir club_admin bir kullanıcıyı pasifleştirdiğinde
-- (is_active=false), o kullanıcı kendi hesabına ait satırı doğrudan REST
-- API'den PATCH ederek is_active'i tekrar true yapabiliyor, sonra
-- yeniden giriş yapıp (custom_access_token_hook is_active=true gördüğü
-- için) TAM yetkisini geri kazanabiliyordu. Canlıda test kulübündeki bir
-- antrenör hesabıyla doğrulandı (200 OK ile is_active geri true oldu) ve
-- hemen ardından test verisi eski haline döndürüldü.
--
-- Düzeltme: is_self_update_safe artık is_active'in de değişmediğini
-- kontrol ediyor. Hesabı (de)aktifleştirmek yalnızca users_admin_all
-- politikasından (club_admin/accounting) mümkün olacak.

drop policy if exists users_own_update on public.users;
drop function if exists public.is_self_update_safe(uuid, user_role, uuid);

create function public.is_self_update_safe(uid uuid, new_role user_role, new_club_id uuid, new_is_active boolean)
returns boolean
language plpgsql
stable security definer
set search_path to 'public'
as $$
begin
  return exists (
    select 1 from users
    where id = uid and role = new_role and club_id = new_club_id and is_active = new_is_active
  );
end;
$$;

create policy users_own_update on public.users
  for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid() and is_self_update_safe(id, role, club_id, is_active));

-- Aynı denetimde Supabase Security Advisor'ın işaretlediği, düşük riskli
-- ama bedelsiz bir sertleştirme: search_path'i sabitlenmemiş fonksiyonlar
-- (hiçbiri SECURITY DEFINER değil, ama best-practice olarak sabitleniyor).
alter function public.set_updated_at() set search_path to 'public';
alter function public.current_club_id() set search_path to 'public';
alter function public.current_user_role() set search_path to 'public';
alter function public.is_super_admin() set search_path to 'public';
alter function public.set_club_id_from_jwt() set search_path to 'public';
alter function public.is_admin_tier() set search_path to 'public';
alter function public.sync_athlete_type_from_group() set search_path to 'public';
alter function public.cascade_group_athlete_type() set search_path to 'public';
