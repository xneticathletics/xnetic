-- createPaymentPlan artık bir sporcunun eski aktif aidat planını (ve ona
-- bağlı, henüz ödenmemiş bekleyen kayıtlarını) yeni plan eklenmeden önce
-- siliyor (bkz. src/lib/api/paymentPlans.ts) — ama branş koordinatörünün
-- ne payment_plans ne de payments üzerinde bir DELETE izni vardı (sadece
-- admin'in ALL politikası kapsıyordu). Koordinatör kendi branşındaki bir
-- sporcu için yeni plan oluşturduğunda bu sessizce başarısız kalır (eski
-- plan silinmez, iki plan birden geçerli kalırdı). payments tarafında
-- sadece 'pending' (henüz ödenmemiş) kayıtlarla sınırlandırıldı — ödenmiş
-- gerçek bir mali kayıt koordinatör tarafından asla silinemez.
create policy "payment_plans_coordinator_delete" on public.payment_plans
  for delete to authenticated
  using (club_id = current_club_id() and is_my_coordinated_athlete(athlete_id));

create policy "payments_coordinator_delete" on public.payments
  for delete to authenticated
  using (club_id = current_club_id() and status = 'pending' and is_my_coordinated_athlete(athlete_id));
