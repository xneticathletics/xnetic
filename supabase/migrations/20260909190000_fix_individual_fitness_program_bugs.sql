-- BULUNAN HATA (kullanıcı canlıda karşılaştı): sporcu "Bireysel Programım"
-- oluştururken "new row violates row-level security policy" hatası alıyordu
-- — individual_fitness_programs/_items tabloları club_id sütununu client'tan
-- hiç göndermiyordu (createIndividualProgram sadece athlete_id/name
-- gönderiyor) ve bu iki tabloya, diğer tüm benzer tablolarda (bkz.
-- fitness_program_completions) zaten var olan otomatik club_id doldurma
-- trigger'ı (set_club_id_from_jwt) eklenmemişti — club_id NULL kalınca
-- with check (club_id = current_club_id() ...) hiçbir zaman doğru olamıyordu.
create trigger trg_set_club_id
  before insert on public.individual_fitness_programs
  for each row execute function public.set_club_id_from_jwt();

create trigger trg_set_club_id
  before insert on public.individual_fitness_program_items
  for each row execute function public.set_club_id_from_jwt();

-- GÜVENLİK/GİZLİLİK İYİLEŞTİRMESİ: is_my_athlete() sporcunun kendi hesabı
-- ile velisinin hesabını ayırt etmiyor (fitness_program_completions'daki
-- emsal buydu). Ama "Bireysel Programım" özellikle "sporcu kendi yazsın"
-- diye tasarlandı — bu yüzden ayrı bir is_athlete_self() ile SADECE
-- sporcunun kendi girişini (athlete_user_id) kabul ediyoruz, veliyi değil.
create or replace function public.is_athlete_self(aid uuid)
returns boolean
language plpgsql stable security definer cost 10000
set search_path to 'public'
as $$
begin
  return exists (
    select 1 from athletes a
    join users u on u.id = a.athlete_user_id
    where a.id = aid and u.auth_user_id = auth.uid()
  );
end;
$$;

drop policy if exists "ind_fit_prog_own_all" on public.individual_fitness_programs;
create policy "ind_fit_prog_own_all" on public.individual_fitness_programs
  for all to authenticated
  using (club_id = current_club_id() and is_athlete_self(athlete_id))
  with check (club_id = current_club_id() and is_athlete_self(athlete_id));

drop policy if exists "ind_fit_items_own_all" on public.individual_fitness_program_items;
create policy "ind_fit_items_own_all" on public.individual_fitness_program_items
  for all to authenticated
  using (
    club_id = current_club_id()
    and exists (
      select 1 from public.individual_fitness_programs p
      where p.id = program_id and is_athlete_self(p.athlete_id)
    )
  )
  with check (
    club_id = current_club_id()
    and exists (
      select 1 from public.individual_fitness_programs p
      where p.id = program_id and is_athlete_self(p.athlete_id)
    )
  );
