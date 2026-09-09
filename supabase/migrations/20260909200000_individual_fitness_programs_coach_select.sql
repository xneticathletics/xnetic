-- Staff (antrenör/koordinatör) artık kendi antrenörlük ettiği sporcuların
-- "Bireysel Programım" içeriğini SALT OKUNUR görebiliyor — sporcu adı ve
-- branşıyla listede, içine girince tarihleriyle geçmiş çalışmalarıyla
-- birlikte. club_admin zaten ind_fit_prog_admin_all/ind_fit_items_admin_all
-- ile tam erişime sahipti; burada sadece antrenör/koordinatör için eksik
-- olan SELECT ekleniyor — is_athletes_coach() diğer tüm fitness
-- tablolarındaki (fitness_measurements, fitness_program_completions vb.)
-- aynı "coach_select" deseniyle birebir aynı.
create policy "ind_fit_prog_coach_select" on public.individual_fitness_programs
  for select to authenticated
  using (club_id = current_club_id() and is_athletes_coach(athlete_id));

create policy "ind_fit_items_coach_select" on public.individual_fitness_program_items
  for select to authenticated
  using (
    club_id = current_club_id()
    and exists (
      select 1 from public.individual_fitness_programs p
      where p.id = program_id and is_athletes_coach(p.athlete_id)
    )
  );
