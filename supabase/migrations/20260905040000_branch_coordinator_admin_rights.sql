-- Branş Koordinatörü olarak atanmış bir antrenör, Beslenme/Performans
-- Ölçümleri/Fitness sayfalarında artık Kulüp Admini gibi yetkili. Bu
-- tabloların çoğunda (nutrition_foods/recipes/articles, fitness_exercises,
-- performance_test_catalog) kendi kulübüne ait satırlar için zaten
-- club_id eşleşmesi dışında bir rol kısıtı yoktu — sadece UI tarafında
-- "+ Ekle" gibi butonlar club_admin'e gizliydi (bkz. ilgili ekranlardaki
-- isCoordinator değişikliği). Gerçek bir DB-seviyesi kısıt sadece
-- club_hidden_fitness_exercises'ta vardı (INSERT/DELETE: club_admin şart),
-- onu burada düzeltiyoruz.

-- Çağıranın, kendi kulübündeki HERHANGİ bir branşın koordinatörü olarak
-- atanmış olup olmadığını kontrol eder. plpgsql (sql değil) — is_athletes_coach
-- gibi diğer yardımcı fonksiyonlarla aynı sebep: inline edilirse RLS'in
-- "infinite recursion detected" korumasına takılabiliyor.
create or replace function public.is_branch_coordinator()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.branches b
    join public.users u on u.id = b.coordinator_user_id
    where u.auth_user_id = auth.uid()
      and b.club_id = current_club_id()
  );
end;
$$;

drop policy if exists club_hidden_fitness_exercises_insert on public.club_hidden_fitness_exercises;
create policy club_hidden_fitness_exercises_insert on public.club_hidden_fitness_exercises
  for insert
  with check (
    club_id = current_club_id()
    and (current_user_role() = 'club_admin' or is_branch_coordinator())
    and exists (select 1 from public.fitness_exercises fe where fe.id = exercise_id and fe.club_id is null)
  );

drop policy if exists club_hidden_fitness_exercises_delete on public.club_hidden_fitness_exercises;
create policy club_hidden_fitness_exercises_delete on public.club_hidden_fitness_exercises
  for delete
  using (
    club_id = current_club_id()
    and (current_user_role() = 'club_admin' or is_branch_coordinator())
  );
