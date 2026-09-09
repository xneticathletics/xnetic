-- KRİTİK, canlıda doğrulanmış tam yetki yükseltme (privilege escalation)
-- açığı: "users_admin_all" politikası (for all, using/with check:
-- club_id = current_club_id() AND is_admin_tier()) role sütununun DEĞERİNİ
-- hiç kısıtlamıyordu. is_admin_tier() club_admin için de true döndüğünden,
-- kendi kulübündeki HERHANGİ bir kullanıcının (kendisi dahil) role'ünü
-- doğrudan bir UPDATE ile 'super_admin' yapan bir club_admin, bootstrap-
-- super-admin fonksiyonunun "kimse kendi kendine süper admin olamasın"
-- korumasını tamamen atlayıp platformun TAMAMINA (tüm kulüpler, abonelik
-- onayı, kulüp silme) erişim kazanabiliyordu. Canlıda test edildi ve
-- doğrulandı (standing test kulübünde), hemen ardından geri alındı —
-- gerçek kulüplerde istismar edilmemiş (tek süper admin hesabı, beklenen
-- kişiye ait).
--
-- Çözüm: role='super_admin' YAZILMASINI, yalnızca çağıran zaten
-- is_super_admin() olduğunda (bir süper adminin başka bir süper admin
-- ataması/yönetmesi) VEYA hiç 'authenticated' JWT context'i olmadığında
-- (service-role bootstrap-super-admin fonksiyonu, migration/psql) kabul
-- eden bir trigger. "for all" politika INSERT'ü de kapsadığı için hem
-- INSERT hem UPDATE'te devrede.
create or replace function public.users_block_super_admin_self_promotion()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.role = 'super_admin'
     and auth.role() = 'authenticated'
     and not coalesce(public.is_super_admin(), false)
  then
    raise exception 'Bu işlem için süper admin yetkisi gerekiyor.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_users_block_super_admin_self_promotion on public.users;
create trigger trg_users_block_super_admin_self_promotion
  before insert or update on public.users
  for each row execute function public.users_block_super_admin_self_promotion();
