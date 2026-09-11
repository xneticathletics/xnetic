-- Tam uygulama taraması sırasında bulunan, 20260909090000'daki kolon
-- kilidinin eksik bıraktığı boşluklar (payments_coordinator_all /
-- payment_plans_coordinator_all, bkz. 20260908020000):
--
-- 1) payments_lock_paid_transition_columns SADECE "old.status='pending' AND
--    new.status='paid'" olan tek adımlı çağrılarda devreye giriyordu. Bir
--    koordinatör iki adımda gidebilirdi: (a) status'u DEĞİŞTİRMEDEN
--    amount/athlete_id/plan_id'yi değiştir (kilit hiç tetiklenmez, çünkü
--    koşul sağlanmıyor), (b) sonra ayrı bir çağrıyla status'u paid yap.
--    markPaymentPaid() (src/lib/api/payments.ts) zaten SADECE
--    {status, paid_at} güncelliyor — yani koordinatörün bu tablodaki tek
--    meşru yazması budur. Kilidi transitiona bağlı olmaktan çıkarıp HER
--    UPDATE'te (adminler hariç) devreye sokuyoruz.
create or replace function public.payments_lock_paid_transition_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.role() = 'authenticated' and not coalesce(public.is_admin_tier(), false) then
    new.club_id := old.club_id;
    new.athlete_id := old.athlete_id;
    new.period := old.period;
    new.amount := old.amount;
    new.due_date := old.due_date;
    new.method := old.method;
    new.receipt_url := old.receipt_url;
    new.plan_id := old.plan_id;
    new.created_at := old.created_at;
    new.last_reminder_sent_at := old.last_reminder_sent_at;
  end if;
  return new;
end;
$$;

-- 2) payments_coordinator_all / payment_plans_coordinator_all "for all"
--    idi, yani DELETE de dahildi — trigger'lar sadece UPDATE'i kilitleyebilir,
--    bir DELETE'i "eski haline döndüremez". Koordinatörün meşru DELETE
--    ihtiyacı hiç yok (src/lib/api/payments.ts ve paymentPlans.ts'de böyle
--    bir çağrı yok) — DELETE'i tamamen admin'e bırakıyoruz. payment_plans'ta
--    ayrıca hiç UPDATE çağrısı da yok (sadece createPaymentPlan/insert ve
--    topUpPlan/insert-into-payments var) — o yüzden UPDATE'i de kaldırıyoruz.
drop policy if exists "payments_coordinator_all" on public.payments;
create policy "payments_coordinator_write" on public.payments
  for all to authenticated
  using (club_id = public.current_club_id() and public.is_my_coordinated_athlete(athlete_id))
  with check (club_id = public.current_club_id() and public.is_my_coordinated_athlete(athlete_id));

-- "for all" DELETE'i de kapsadığı için burada da ayrı bir revoke gerekiyor:
-- DELETE'i sadece is_admin_tier()'a bırakan ayrı bir kısıtlama ekliyoruz.
-- Postgres RLS'te birden fazla permissive policy OR'lanır, bu yüzden "for
-- all"ı DELETE hariç yeniden yazmak yerine, DELETE'i ayrı bir restrictive
-- politikayla admin'e sabitliyoruz.
drop policy if exists "payments_coordinator_write" on public.payments;
create policy "payments_coordinator_write" on public.payments
  for select to authenticated
  using (club_id = public.current_club_id() and public.is_my_coordinated_athlete(athlete_id));
create policy "payments_coordinator_insert" on public.payments
  for insert to authenticated
  with check (club_id = public.current_club_id() and public.is_my_coordinated_athlete(athlete_id));
create policy "payments_coordinator_update" on public.payments
  for update to authenticated
  using (club_id = public.current_club_id() and public.is_my_coordinated_athlete(athlete_id))
  with check (club_id = public.current_club_id() and public.is_my_coordinated_athlete(athlete_id));

drop policy if exists "payment_plans_coordinator_all" on public.payment_plans;
create policy "payment_plans_coordinator_select" on public.payment_plans
  for select to authenticated
  using (club_id = public.current_club_id() and public.is_my_coordinated_athlete(athlete_id));
create policy "payment_plans_coordinator_insert" on public.payment_plans
  for insert to authenticated
  with check (club_id = public.current_club_id() and public.is_my_coordinated_athlete(athlete_id));
