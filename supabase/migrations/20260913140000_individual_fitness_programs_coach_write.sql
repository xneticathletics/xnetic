-- Bireysel Program: kullanıcı artık admin/branş koordinatörü/normal
-- antrenörün de bir sporcu adına bireysel program OLUŞTURABİLMESİNİ
-- istedi (önceden sadece sporcunun kendisi + club_admin yazabiliyordu,
-- antrenör/koordinatör salt okunur SELECT'e sahipti — bkz.
-- 20260909200000_individual_fitness_programs_coach_select.sql'deki
-- "bilerek YOK" notu, o karar bu istekle tersine çevriliyor).
-- is_athletes_coach() zaten hem doğrudan antrenörü hem o branşın
-- koordinatörünü kapsıyor (is_my_coached_group üzerinden) — tek
-- fonksiyonla ikisi de kapsanıyor. Eski salt-okunur politikaları "for all"
-- ile değiştiriyoruz.
drop policy if exists "ind_fit_prog_coach_select" on public.individual_fitness_programs;
create policy "ind_fit_prog_coach_all" on public.individual_fitness_programs
  for all to authenticated
  using (club_id = public.current_club_id() and public.is_athletes_coach(athlete_id))
  with check (club_id = public.current_club_id() and public.is_athletes_coach(athlete_id));

drop policy if exists "ind_fit_items_coach_select" on public.individual_fitness_program_items;
create policy "ind_fit_items_coach_all" on public.individual_fitness_program_items
  for all to authenticated
  using (
    club_id = public.current_club_id()
    and exists (
      select 1 from public.individual_fitness_programs p
      where p.id = program_id and public.is_athletes_coach(p.athlete_id)
    )
  )
  with check (
    club_id = public.current_club_id()
    and exists (
      select 1 from public.individual_fitness_programs p
      where p.id = program_id and public.is_athletes_coach(p.athlete_id)
    )
  );
