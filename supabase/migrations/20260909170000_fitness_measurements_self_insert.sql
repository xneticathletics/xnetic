-- Sporcunun (ve velisinin) kendi fitness_measurements kaydını KENDİSİ
-- girebilmesi için — şimdiye kadar sadece antrenör/admin girebiliyordu
-- (fitness_coach_insert / fitness_admin_all), sporcu tarafı sadece
-- SELECT yapabiliyordu (fitness_own_select). Atanmış bir programı
-- tamamlarken set bazlı ağırlık/tekrar girebilmesi için gereken tek RLS
-- değişikliği bu — is_my_athlete() zaten fitness_program_completions'ın
-- kendi INSERT politikasında (fitness_completions_own_insert) aynı
-- şekilde kullanılıyor, o emsali birebir izliyoruz.
create policy "fitness_own_insert" on public.fitness_measurements
  for insert to authenticated
  with check (club_id = current_club_id() and is_my_athlete(athlete_id));
