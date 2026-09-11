-- Tam uygulama taramasında bulunan: users_own_update / is_self_update_safe()
-- role/club_id/is_active'i self-update'te kilitliyordu ama must_change_password'a
-- hiç bakmıyordu. Meşru akış (artık self-change-password edge function'ı —
-- bkz. currentUser.ts changeMyPasswordFirstLogin) önce gerçek şifreyi
-- service-role ile değiştirip SONRA bu bayrağı temizliyor, ama eskiden bu
-- ikinci adım tek başına da (auth.updateUser hiç çağrılmadan) doğrudan bir
-- client update ile tetiklenebiliyordu — yani admin'in verdiği geçici şifre
-- hiç değiştirilmeden zorunlu rotasyon kalıcı olarak atlatılabiliyordu.
--
-- Bu tetikleyici savunma derinliği sağlıyor: normal bir authenticated
-- oturumdan (admin dahil kimse) gelen bir UPDATE bu kolonu asla
-- değiştiremez; sadece service-role çağrıları (self-change-password,
-- admin-reset-user-password, invite-user gibi edge function'lar) etkiler —
-- aynı auth.role() = 'authenticated' deseni diğer kilit tetikleyicilerinde
-- de kullanılıyor (bkz. payments/groups).
create or replace function public.users_lock_must_change_password_self_update()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.role() = 'authenticated' then
    new.must_change_password := old.must_change_password;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_users_lock_must_change_password on public.users;
create trigger trg_users_lock_must_change_password
  before update on public.users
  for each row execute function public.users_lock_must_change_password_self_update();
