-- BULUNAN CİDDİ HATA: payments/payment_plans tablolarında sadece iki
-- politika vardı — is_my_athlete (veli/sporcunun KENDİ kaydı) ve
-- is_admin_tier (club_admin/accounting). Branş koordinatörü ("coach" rolü,
-- current_user_role() 'club_admin' DEĞİL) HİÇBİR politikaya uymuyordu —
-- yani Finans ekranı, "Sabit Aidat Ücreti", PaymentGroupsScreen'in tamamı
-- bir koordinatör için veritabanı seviyesinde tamamen BOŞ dönüyordu
-- (canlı doğrulandı: select count(*) from payments → 0). Home Sayfası'ndaki
-- "Finans: Branşının aidatları" kutucuğu koordinatör için hiçbir zaman
-- gerçekte çalışmamış. notifyPaymentClaim (payments.ts) da zaten branş
-- koordinatörüne "kontrol edip onaylayabilirsiniz" bildirimi gönderiyordu —
-- bu politika o vaadi gerçeğe döndürüyor.

create or replace function public.is_my_coordinated_athlete(aid uuid)
returns boolean
language plpgsql
stable security definer
set search_path to 'public'
as $$
begin
  return exists (
    select 1 from athletes a
    join groups g on g.id = a.group_id
    join branches b on b.name = g.branch and b.club_id = a.club_id
    join users u on u.id = b.coordinator_user_id
    where a.id = aid and u.auth_user_id = auth.uid()
  );
end;
$$;

revoke execute on function public.is_my_coordinated_athlete(uuid) from public;
grant execute on function public.is_my_coordinated_athlete(uuid) to authenticated;

create policy "payments_coordinator_all" on public.payments
  for all to authenticated
  using (club_id = public.current_club_id() and public.is_my_coordinated_athlete(athlete_id))
  with check (club_id = public.current_club_id() and public.is_my_coordinated_athlete(athlete_id));

create policy "payment_plans_coordinator_all" on public.payment_plans
  for all to authenticated
  using (club_id = public.current_club_id() and public.is_my_coordinated_athlete(athlete_id))
  with check (club_id = public.current_club_id() and public.is_my_coordinated_athlete(athlete_id));
