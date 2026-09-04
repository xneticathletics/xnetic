-- BULUNAN HATA: fitness-exercise-videos, performance-test-videos ve
-- nutrition-pdfs politikalarındaki "(storage.foldername(name))[1]" ifadesi,
-- alt sorgudaki "from public.users u" bloğu içinde yazıldığı için Postgres
-- "name"i storage.objects.name yerine users.name (kişinin adı, ör. "Mehmet
-- Demir") olarak çözümlüyordu — bkz. pg_policies çıktısı:
-- "(storage.foldername(u.name))[1]". Sonuç: coach/club_admin'in kendi
-- kulübüne dosya yüklemesi HİÇBİR ZAMAN çalışmıyordu (her zaman "row
-- violates row-level security policy"). storage.objects.name olarak tam
-- nitelendirilerek belirsizlik ortadan kaldırılıyor.

drop policy if exists "fitness_exercise_videos_insert" on storage.objects;
create policy "fitness_exercise_videos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fitness-exercise-videos'
    and (
      (
        (storage.foldername(storage.objects.name))[1] = 'global'
        and exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'super_admin')
      )
      or exists (
        select 1 from public.users u
        where u.auth_user_id = auth.uid()
          and u.role in ('coach', 'club_admin')
          and u.club_id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
  );

drop policy if exists "fitness_exercise_videos_update" on storage.objects;
create policy "fitness_exercise_videos_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'fitness-exercise-videos'
    and (
      (
        (storage.foldername(storage.objects.name))[1] = 'global'
        and exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'super_admin')
      )
      or exists (
        select 1 from public.users u
        where u.auth_user_id = auth.uid()
          and u.role in ('coach', 'club_admin')
          and u.club_id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
  );

drop policy if exists "fitness_exercise_videos_delete" on storage.objects;
create policy "fitness_exercise_videos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'fitness-exercise-videos'
    and (
      (
        (storage.foldername(storage.objects.name))[1] = 'global'
        and exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'super_admin')
      )
      or exists (
        select 1 from public.users u
        where u.auth_user_id = auth.uid()
          and u.role in ('coach', 'club_admin')
          and u.club_id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
  );

drop policy if exists "performance_test_videos_insert" on storage.objects;
create policy "performance_test_videos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'performance-test-videos'
    and (
      (
        (storage.foldername(storage.objects.name))[1] = 'global'
        and exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'super_admin')
      )
      or exists (
        select 1 from public.users u
        where u.auth_user_id = auth.uid()
          and u.role in ('coach', 'club_admin')
          and u.club_id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
  );

drop policy if exists "performance_test_videos_update" on storage.objects;
create policy "performance_test_videos_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'performance-test-videos'
    and (
      (
        (storage.foldername(storage.objects.name))[1] = 'global'
        and exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'super_admin')
      )
      or exists (
        select 1 from public.users u
        where u.auth_user_id = auth.uid()
          and u.role in ('coach', 'club_admin')
          and u.club_id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
  );

drop policy if exists "performance_test_videos_delete" on storage.objects;
create policy "performance_test_videos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'performance-test-videos'
    and (
      (
        (storage.foldername(storage.objects.name))[1] = 'global'
        and exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'super_admin')
      )
      or exists (
        select 1 from public.users u
        where u.auth_user_id = auth.uid()
          and u.role in ('coach', 'club_admin')
          and u.club_id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
  );

drop policy if exists "nutrition_pdfs_insert" on storage.objects;
create policy "nutrition_pdfs_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'nutrition-pdfs'
    and exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.role = 'club_admin'
        and u.club_id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

drop policy if exists "nutrition_pdfs_update" on storage.objects;
create policy "nutrition_pdfs_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'nutrition-pdfs'
    and exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.role = 'club_admin'
        and u.club_id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

drop policy if exists "nutrition_pdfs_delete" on storage.objects;
create policy "nutrition_pdfs_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'nutrition-pdfs'
    and exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.role = 'club_admin'
        and u.club_id::text = (storage.foldername(storage.objects.name))[1]
    )
  );
