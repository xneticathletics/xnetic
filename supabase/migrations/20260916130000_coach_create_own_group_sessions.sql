-- training_sessions_coordinator_insert politikası antrenman EKLEMEYİ
-- sadece admin/branş koordinatörü/salon yetkilisiyle sınırlamıştı — düz
-- bir antrenör (baş ya da yardımcı antrenör olduğu KENDİ grubu için bile)
-- hiç antrenman ekleyemiyordu, sadece UPDATE (yoklama/tamamlama/not)
-- yapabiliyordu. is_my_coached_group() zaten "baş antrenör YA DA yardımcı
-- antrenör YA DA branş koordinatörü" anlamına geliyor (bkz. UPDATE
-- politikasında da kullanılıyor) — aynı kapsamı EKLEMEYE de açıyoruz.
-- SİLME kasıtlı olarak dar tutuluyor (bkz. training_sessions_coordinator_delete
-- yorumu), buna dokunulmadı.
create policy "training_sessions_coach_insert" on public.training_sessions
  for insert to authenticated
  with check (club_id = public.current_club_id() and public.is_my_coached_group(group_id));
