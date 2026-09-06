-- "Ödedim, Bildir" akışına isteğe bağlı dekont/makbuz fotoğrafı ekleme.
-- payments.receipt_url kolonu zaten vardı (kullanılmıyordu) — bu migration
-- onu gerçekten dolduran altyapıyı ekliyor: özel (private) bir storage
-- bucket + bunu güvenli şekilde ayarlayan dar bir RPC fonksiyonu.
--
-- payments tablosunda parent/athlete için sadece SELECT var (own),
-- doğrudan bir UPDATE politikası YOK — bilerek: bir veliye "kendi
-- ödeme satırını UPDATE edebilir" izni versek, RLS satır bazlı çalıştığı
-- için amount/status/due_date gibi hassas kolonları da değiştirebilir
-- hale gelirdi. Bunun yerine SECURITY DEFINER bir fonksiyon üzerinden
-- SADECE receipt_url'i, SADECE kendi sporcusunun ödemesinde değiştirmesine
-- izin veriyoruz (bkz. bugünkü RLS denetiminde is_self_update_safe için
-- kullanılan aynı desen).

insert into storage.buckets (id, name, public, file_size_limit)
values ('payment-receipts', 'payment-receipts', false, 5242880)
on conflict (id) do update set file_size_limit = 5242880, public = false;

create policy "payment_receipts_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-receipts'
    and exists (
      select 1 from public.payments p
      where p.id::text = (storage.foldername(storage.objects.name))[1]
      and public.is_my_athlete(p.athlete_id)
    )
  );

create policy "payment_receipts_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-receipts'
    and exists (
      select 1 from public.payments p
      where p.id::text = (storage.foldername(storage.objects.name))[1]
      and (
        public.is_my_athlete(p.athlete_id)
        or public.is_athletes_coach(p.athlete_id)
        or (p.club_id = public.current_club_id() and public.is_admin_tier())
      )
    )
  );

create policy "payment_receipts_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'payment-receipts'
    and exists (
      select 1 from public.payments p
      where p.id::text = (storage.foldername(storage.objects.name))[1]
      and p.club_id = public.current_club_id()
      and public.is_admin_tier()
    )
  );

create function public.submit_payment_receipt(p_payment_id uuid, p_receipt_url text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (
    select 1 from payments p
    where p.id = p_payment_id
    and is_my_athlete(p.athlete_id)
  ) then
    raise exception 'Bu ödeme üzerinde yetkiniz yok.';
  end if;

  update payments set receipt_url = p_receipt_url where id = p_payment_id;
end;
$$;

-- Bugünkü denetimde öğrenilen ders: fonksiyonlar varsayılan olarak PUBLIC'e
-- (yani örtük olarak herkese, anon dahil) EXECUTE ile oluşturuluyor — bu
-- yüzden PUBLIC'ten açıkça revoke edip SADECE authenticated'a GRANT ediyoruz.
revoke execute on function public.submit_payment_receipt(uuid, text) from public;
grant execute on function public.submit_payment_receipt(uuid, text) to authenticated;
