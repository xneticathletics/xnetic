-- Tam uygulama taramasında bulunan: users_own_update / is_self_update_safe()
-- email kolonuna hiç bakmıyordu, yani bir kullanıcı doğrudan bir client
-- update'iyle kendi email'ini (login kimliğini) İSTEDİĞİ herhangi bir
-- değere set edebiliyordu — güvenlik kontrolü yok, benzersizlik kontrolü
-- yok (update-login-identifier edge function'ı ikisini de yapıyor ama
-- ham bir update bunu atlıyor).
--
-- Somut istismar: request-password-reset-notice/index.ts, hedef kullanıcıyı
-- .eq("email", loginEmail).maybeSingle() ile buluyor ve dönen `error`'ı
-- HİÇ kontrol etmiyor. Bir saldırgan kendi email'ini bilinen bir kurbanın
-- sentetik login email'ine (tel<numara>@xnetic.local) eşitlerse, bu sorgu
-- artık İKİ satırla eşleşir → .maybeSingle() hata fırlatır → matchedUser
-- undefined olur → hiçbir bildirim gitmez → kurban için "Şifremi Unuttum"
-- kalıcı olarak sessizce kırılır (numaralandırmayı önlemek için hata da
-- hiç yüzeye çıkmıyor).
--
-- Düzeltme: email de artık normal authenticated oturumlardan (admin dahil)
-- self-update ile değiştirilemiyor — TEK meşru yol update-login-identifier
-- edge function'ı (service-role + benzersizlik kontrolü + gerçek auth.users
-- email'ini de günceller).
create or replace function public.users_lock_must_change_password_self_update()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.role() = 'authenticated' then
    new.must_change_password := old.must_change_password;
    new.email := old.email;
  end if;
  return new;
end;
$$;
