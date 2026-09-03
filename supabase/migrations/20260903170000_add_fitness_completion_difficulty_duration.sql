-- "Antrenmanı Tamamladım" formuna notun altında zorluk derecesi (1-10) ve
-- süre (dakika) eklendi.
alter table public.fitness_program_completions
  add column if not exists difficulty smallint check (difficulty is null or (difficulty between 1 and 10)),
  add column if not exists duration_minutes smallint check (duration_minutes is null or duration_minutes > 0);
