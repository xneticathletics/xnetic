-- Aynı kolon-kaçırma sınıfının son örneği: users_coordinator_update_branch_coaches
-- politikası, bir koordinatörün kendi branşındaki bir antrenörün SADECE
-- kişisel bilgilerini (ad, telefon, doğum tarihi, öğrenim durumu, adres,
-- acil durum kişisi — bkz. src/lib/api/coaches.ts CoachInput) düzenleyebilmesi
-- için eklenmişti, ama role/club_id/is_active/auth_user_id gibi hassas
-- alanları da aynı UPDATE'e sokabilmeyi engellemiyordu (en riskini —
-- auth_user_id — değiştirebilmek, o antrenör hesabını başka bir login'e
-- bağlamak anlamına gelirdi).
--
-- ÖNEMLİ FARK: bu tablo aynı zamanda ÇOK sayıda MEŞRU "kendi satırını
-- güncelleme" akışına da sahip (updateMyProfile, uploadMyPhoto,
-- completeMyOnboarding, changeMyPasswordFirstLogin, bildirim susturma
-- ayarları — hepsi users_own_update politikasından geçiyor). Kilidi SADECE
-- "başkasının satırını düzenleyen, admin OLMAYAN biri" durumuna
-- (auth_user_id <> auth.uid()) daraltıyoruz — aksi halde kullanıcıların
-- kendi profillerini güncellemesi de kırılırdı.
create or replace function public.users_lock_coordinator_editable_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.role() = 'authenticated'
     and not coalesce(public.is_admin_tier(), false)
     and old.auth_user_id is distinct from auth.uid()
  then
    new.club_id := old.club_id;
    new.auth_user_id := old.auth_user_id;
    new.role := old.role;
    new.is_active := old.is_active;
    new.email := old.email;
    new.whatsapp := old.whatsapp;
    new.photo_url := old.photo_url;
    new.onboarding_completed := old.onboarding_completed;
    new.must_change_password := old.must_change_password;
    new.muted_notification_types := old.muted_notification_types;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_users_lock_coordinator_editable_columns on public.users;
create trigger trg_users_lock_coordinator_editable_columns
  before update on public.users
  for each row execute function public.users_lock_coordinator_editable_columns();
