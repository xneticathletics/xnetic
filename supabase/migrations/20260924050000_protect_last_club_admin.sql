-- Kulüp yöneticisi ekleme/kaldırma arayüzü geliyor (Kullanıcılar ekranı):
-- yönetici "kaldırma" işlemi hesabı pasifleştiriyor. Buradaki koruma,
-- kulübün YÖNETİCİSİZ kalmasını engelliyor — son aktif kulüp yöneticisi
-- pasifleştirilemez ya da silinemez, önce yerine biri eklenmeli.
--
-- Yalnızca İSTEMCİDEN gelen işlemleri kilitliyoruz (auth.role() =
-- 'authenticated'): delete-club, bir kulübün TÜM kullanıcılarını servis
-- rolüyle siliyor, o akışın bu kontrole takılmaması gerekiyor. Tek bir
-- kullanıcıyı kalıcı silen delete-club-user (o da servis rolü) aynı
-- kontrolü kendi içinde ayrıca yapıyor.
create or replace function public.users_protect_last_club_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining int;
begin
  if auth.role() is distinct from 'authenticated'
     or old.role <> 'club_admin' or not old.is_active or old.club_id is null then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  -- Hâlâ aynı kulübün aktif yöneticisiyse bir şey kaybolmuyor.
  if tg_op = 'UPDATE' and new.is_active and new.role = 'club_admin' and new.club_id = old.club_id then
    return new;
  end if;

  select count(*) into v_remaining
  from users u
  where u.club_id = old.club_id and u.role = 'club_admin' and u.is_active and u.id <> old.id;

  if v_remaining = 0 then
    raise exception 'Kulübün tek yöneticisi kaldırılamaz. Önce başka bir yönetici ekle.';
  end if;

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists trg_users_protect_last_club_admin on public.users;
create trigger trg_users_protect_last_club_admin
  before update or delete on public.users
  for each row execute function public.users_protect_last_club_admin();
