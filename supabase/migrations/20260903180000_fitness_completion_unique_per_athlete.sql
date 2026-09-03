-- Bir sporcu aynı programı yalnızca BİR KEZ tamamlayabilir — daha önce
-- tekrar tekrar "Antrenmanı Tamamladım" denilebiliyordu. Test sırasında
-- oluşmuş olası tekrarları (en son kaydı tutarak) temizleyip tekil kısıt
-- ekliyoruz.
delete from public.fitness_program_completions a
using public.fitness_program_completions b
where a.program_id = b.program_id
  and a.athlete_id = b.athlete_id
  and a.id <> b.id
  and (a.completed_at, a.id) < (b.completed_at, b.id);

alter table public.fitness_program_completions
  add constraint fitness_program_completions_program_athlete_key unique (program_id, athlete_id);
