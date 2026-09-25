-- Aynı telefon numarası kulüp içinde birden fazla hesapta kayıtlı olunca
-- şifre sıfırlama talebi HANGİ hesap için geldiği belirsizleşiyordu
-- (request_password_reset_notice eşleşen HER hesaba ayrı bildirim
-- gönderiyor — kullanıcı isteği: "aynı telefon numarasını kullanan
-- kullanıcıların şifre sıfırlama talepleri geliyor, hangisi gerçekten
-- istedi bilemeyiz"). Kalıcı çözüm kaynağında: bir telefon numarası aynı
-- kulüpte birden fazla AKTİF hesaba artık YAZILAMIYOR.
--
-- Mevcut veride ZATEN bir çakışma var (test kulübünde bir antrenör ve bir
-- sporcu hesabı aynı numarayı paylaşıyor) — bu satırlara DOKUNMUYORUZ,
-- kontrol yalnızca YENİ bir INSERT'te ya da telefonu GERÇEKTEN değiştiren
-- bir UPDATE'te devreye giriyor, geriye dönük veriyi bozmuyor/silmiyor.
--
-- Kulüp bazında (global değil): iki farklı kulübün birbirinden habersiz
-- üyelerinin aynı numarayı taşıması engellenmiyor — o zaten ayrı
-- yöneticilere gidiyor, karışıklık yaratmıyor.
create or replace function public.users_prevent_duplicate_phone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_digits text;
  v_conflict record;
begin
  if new.phone is null or btrim(new.phone) = '' then
    return new;
  end if;
  -- Telefon değişmediyse (ör. profildeki başka bir alanı güncelleyip aynı
  -- numarayı geri gönderme) tekrar kontrol etmeye gerek yok.
  if tg_op = 'UPDATE' and old.phone is not distinct from new.phone then
    return new;
  end if;

  v_digits := public.normalize_phone_digits(new.phone);
  if v_digits is null then
    return new;
  end if;

  select id, name into v_conflict
  from users
  where club_id = new.club_id
    and is_active
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    and public.normalize_phone_digits(phone) = v_digits
  limit 1;

  if found then
    raise exception 'Bu telefon numarası kulüpte "%" adlı hesapta zaten kayıtlı. Aynı numara birden fazla hesapta kullanılamaz.', v_conflict.name;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_users_prevent_duplicate_phone on public.users;
create trigger trg_users_prevent_duplicate_phone
  before insert or update on public.users
  for each row execute function public.users_prevent_duplicate_phone();
