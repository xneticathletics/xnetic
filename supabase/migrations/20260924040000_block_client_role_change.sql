-- Bir hesabın ROLÜ artık istemciden hiç değiştirilemez (kullanıcı kararı).
--
-- Neden: users_admin_all politikası kulüp yöneticisine kendi kulübündeki
-- kullanıcı satırlarında tam yazma izni veriyor ve HANGİ sütunun değiştiğini
-- kısıtlamıyordu. Uygulamada rol değiştiren bir ekran hiç yok, ama doğrudan
-- REST çağrısıyla (tarayıcı devtools) kulüp yöneticisi kendi kulübündeki bir
-- veliyi "kulüp yöneticisi" yapabiliyordu — yani arayüzün sunmadığı, iz de
-- bırakmayan (audit_log yalnızca super_admin'e yükseltmeyi kaydediyor) bir
-- yetki dağıtımı mümkündü. [[security-column-smuggling-status-transition-bug]]
-- ile aynı sınıf: satırı güncelleme hakkı, o satırdaki HER sütunu
-- güncelleme hakkı anlamına geliyordu.
--
-- Rol artık yalnızca hesap OLUŞTURULURKEN belirleniyor (invite-user /
-- create-club edge function'ları, servis rolüyle INSERT). Servis rolü ve
-- bakım amaçlı doğrudan SQL etkilenmiyor: kontrol, mevcut
-- users_block_super_admin_self_promotion ile birebir aynı desende
-- auth.role() = 'authenticated' koşuluna bağlı.
create or replace function public.users_block_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.role() = 'authenticated' then
    raise exception 'Kullanıcı rolü değiştirilemez. Rol yalnızca hesap oluşturulurken belirlenir.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_users_block_role_change on public.users;
create trigger trg_users_block_role_change
  before update on public.users
  for each row execute function public.users_block_role_change();
