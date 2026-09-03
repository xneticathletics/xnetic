-- Kulübe özel egzersizlere (fitness_exercises) video ve açıklama eklenebilmesi
-- için — web'deki Hareket Ekle/Düzenle modalinden dosya yükleyerek ya da
-- dışarıdan bir video linki yapıştırarak (video_url'ün kaynağı fark etmez,
-- tek bir metin alanı) doldurulur.
alter table public.fitness_exercises
  add column if not exists video_url text,
  add column if not exists description text;

-- club-logos/athlete-photos ile aynı desen: kulüp klasörüne göre ayrılmış,
-- herkese açık (public) okunabilir bir bucket — yazma sadece o kulübün
-- antrenör/adminine ait.
insert into storage.buckets (id, name, public)
values ('fitness-exercise-videos', 'fitness-exercise-videos', true)
on conflict (id) do nothing;

drop policy if exists "fitness_exercise_videos_coach_insert" on storage.objects;
create policy "fitness_exercise_videos_coach_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fitness-exercise-videos'
    and exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.role in ('coach', 'club_admin')
        and u.club_id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "fitness_exercise_videos_coach_update" on storage.objects;
create policy "fitness_exercise_videos_coach_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'fitness-exercise-videos'
    and exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.role in ('coach', 'club_admin')
        and u.club_id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "fitness_exercise_videos_coach_delete" on storage.objects;
create policy "fitness_exercise_videos_coach_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'fitness-exercise-videos'
    and exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.role in ('coach', 'club_admin')
        and u.club_id::text = (storage.foldername(name))[1]
    )
  );
